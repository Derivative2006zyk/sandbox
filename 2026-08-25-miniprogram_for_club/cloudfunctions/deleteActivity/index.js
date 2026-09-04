/**
 * 软删除活动（下架，管理员）
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { activityId } = event
  if (!activityId) return { code: 400, msg: '缺少活动 ID' }

  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    // 软删除：将状态改为 0（下架）
    await db.collection('activities').doc(activityId).update({
      data: {
        status: 0,
        updateTime: db.serverDate()
      }
    })

    return { code: 0, msg: '已删除（下架）' }
  } catch (e) {
    console.error('deleteActivity error:', e)
    return { code: 500, msg: '删除失败' }
  }
}