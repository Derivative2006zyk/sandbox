/**
 * 删除新闻（管理员）
 *
 * 入参说明：
 * @param newsId 新闻 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { newsId } = event
  if (!newsId) return { code: 400, msg: '缺少新闻ID' }

  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    await db.collection('news').doc(newsId).remove()

    return { code: 0, msg: '删除成功' }
  } catch (e) {
    console.error('deleteNews error:', e)
    return { code: 500, msg: '删除失败' }
  }
}