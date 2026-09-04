/**
 * 取消报名
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { activityId } = event
  if (!activityId) return { code: 400, msg: '缺少活动 ID' }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  try {
    // 查找有效报名记录
    const signupRes = await db.collection('signups').where({
      _openid: OPENID,
      activityId,
      status: 1
    }).get()
    if (signupRes.data.length === 0) return { code: 400, msg: '您未报名该活动' }

    const signup = signupRes.data[0]

    // 获取活动信息，校验取消截止时间（通常与报名截止时间一致）
    const activityRes = await db.collection('activities').doc(activityId).get()
    if (!activityRes.data) return { code: 404, msg: '活动不存在' }
    const activity = activityRes.data
    if (new Date() > new Date(activity.signupDeadline)) {
      return { code: 400, msg: '报名已截止，无法取消' }
    }

    // 事务：更新报名状态并减少人数
    const transaction = await db.startTransaction()
    try {
      await transaction.collection('signups').doc(signup._id).update({
        data: {
          status: 2,
          updateTime: db.serverDate()
        }
      })
      await transaction.collection('activities').doc(activityId).update({
        data: {
          currentParticipants: _.inc(-1)
        }
      })
      await transaction.commit()
      return { code: 0, msg: '取消报名成功' }
    } catch (e) {
      await transaction.rollback()
      console.error('cancelSignup transaction error:', e)
      return { code: 500, msg: '取消失败，请重试' }
    }
  } catch (e) {
    console.error('cancelSignup error:', e)
    return { code: 500, msg: '取消失败' }
  }
}