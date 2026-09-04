/**
 * 获取我的报名记录及关联活动
 *
 * 入参说明：
 * @param 无
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  try {
    // 1. 查询当前用户所有有效报名记录（status=1）
    const signupsRes = await db.collection('signups')
      .where({
        _openid: OPENID,
        status: 1
      })
      .orderBy('createTime', 'desc')
      .get()

    if (signupsRes.data.length === 0) {
      return { code: 0, data: { list: [] } }
    }

    // 2. 提取所有 activityId
    const activityIds = signupsRes.data.map(item => item.activityId)

    // 3. 查询对应的活动信息（注意：云数据库 _id 查询用 _.in）
    const activitiesRes = await db.collection('activities')
      .where({
        _id: _.in(activityIds)
      })
      .get()

    // 4. 构建活动映射表 { activityId: activityObject }
    const activityMap = {}
    activitiesRes.data.forEach(activity => {
      activityMap[activity._id] = activity
    })

    // 5. 组装返回数据：报名记录 + 活动信息
    const list = signupsRes.data.map(signup => {
      const activity = activityMap[signup.activityId]
      return {
        signupId: signup._id,
        activityId: signup.activityId,
        formData: signup.formData,
        createTime: signup.createTime,
        activity: activity || null  // 可能活动已删除
      }
    })

    return {
      code: 0,
      data: { list }
    }
  } catch (e) {
    console.error('getMySignups error:', e)
    return { code: 500, msg: '获取我的报名失败' }
  }
}