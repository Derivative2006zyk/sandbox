const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { activityId, formData } = event
  if (!activityId || !formData) return { code: 400, msg: '参数不完整' }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  try {
    // 1. 校验用户已完善资料
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0) return { code: 403, msg: '用户不存在' }
    const user = userRes.data[0]
    if (!user.name || !user.studentId || !user.phone) {
      return { code: 403, msg: '请先完善个人资料' }
    }

    // 2. 获取活动信息
    const activityRes = await db.collection('activities').doc(activityId).get()
    if (!activityRes.data) return { code: 404, msg: '活动不存在' }
    const activity = activityRes.data

    // 3. 校验活动状态和报名条件
    if (activity.status !== 1) return { code: 400, msg: '活动未开放报名' }
    if (new Date() > new Date(activity.signupDeadline)) {
      return { code: 400, msg: '报名已截止' }
    }
    if (activity.currentParticipants >= activity.maxParticipants) {
      return { code: 400, msg: '报名人数已满' }
    }

    // 4. 检查是否已报名
    const existSignup = await db.collection('signups').where({
      _openid: OPENID,
      activityId,
      status: 1
    }).get()
    if (existSignup.data.length > 0) return { code: 400, msg: '请勿重复报名' }

    // 5. 使用事务：添加报名记录并增加活动人数
    const transaction = await db.startTransaction()
    try {
      await transaction.collection('signups').add({
        data: {
          _openid: OPENID,
          activityId,
          formData: {
            name: formData.name,
            studentId: formData.studentId,
            phone: formData.phone
          },
          status: 1,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      await transaction.collection('activities').doc(activityId).update({
        data: {
          currentParticipants: _.inc(1)
        }
      })
      await transaction.commit()
      return { code: 0, msg: '报名成功' }
    } catch (e) {
      await transaction.rollback()
      console.error('signup transaction error:', e)
      return { code: 500, msg: '报名失败，请重试' }
    }
  } catch (e) {
    console.error('signup error:', e)
    return { code: 500, msg: '报名失败' }
  }
}