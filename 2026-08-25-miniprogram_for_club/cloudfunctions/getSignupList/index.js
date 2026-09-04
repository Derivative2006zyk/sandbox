/**
 * 获取活动报名名单（管理员）
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @param page 页码
 * @param pageSize 每页数量
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { activityId, page = 1, pageSize = 50 } = event
  if (!activityId) return { code: 400, msg: '缺少活动 ID' }

  try {
    // 校验管理员
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    const signupsRes = await db.collection('signups')
      .where({ activityId, status: 1 })
      .orderBy('createTime', 'asc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: signupsRes.data,
        hasMore: signupsRes.data.length === pageSize
      }
    }
  } catch (e) {
    console.error('getSignupList error:', e)
    return { code: 500, msg: '获取名单失败' }
  }
}