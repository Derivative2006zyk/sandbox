/**
 * 更新活动（管理员）
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @param 其余为可更新字段
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { activityId, ...updateFields } = event
  if (!activityId) return { code: 400, msg: '缺少活动 ID' }

  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    const allowedFields = [
      'title', 'description', 'location', 'startTime', 'endTime',
      'signupDeadline', 'maxParticipants', 'type', 'status',
      'cover', 'coverThumb'      // 添加缩略图字段
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
        } else {
          data[key] = String(updateFields[key]).trim()  // 字符串处理
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