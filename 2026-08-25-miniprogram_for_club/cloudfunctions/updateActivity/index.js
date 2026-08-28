const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { activityId, ...updateFields } = event
  if (!activityId) return { code: 400, msg: '缺少活动 ID' }

  try {
    // 校验管理员权限
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    // 允许更新的字段列表，添加 cover
    const allowedFields = [
      'title', 'description', 'location', 'startTime', 'endTime',
      'signupDeadline', 'maxParticipants', 'type', 'status', 'cover'
    ];
    const data = {}
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        if (['startTime', 'endTime', 'signupDeadline'].includes(key)) {
          data[key] = new Date(updateFields[key])
        } else if (key === 'maxParticipants') {
          data[key] = Number(updateFields[key])
        } else if (key === 'status') {
          data[key] = Number(updateFields[key])
        } else if (key === 'cover') {
          data[key] = String(updateFields[key])   // 确保字符串
        } else {
          data[key] = String(updateFields[key]).trim()
        }
      }
    }
    data.updateTime = db.serverDate()

    await db.collection('activities').doc(activityId).update({ data })

    return { code: 0, msg: '更新成功' }
  } catch (e) {
    console.error('updateActivity error:', e)
    return { code: 500, msg: '更新失败' }
  }
}