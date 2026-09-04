/**
 * 删除自己的评论
 *
 * 入参说明：
 * @param commentId 评论 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }
  const { commentId } = event
  if (!commentId) return { code: 400, msg: '缺少评论ID' }
  try {
    const res = await db.collection('activity_comments').doc(commentId).get()
    if (!res.data) return { code: 404, msg: '评论不存在' }
    if (res.data.openid !== OPENID) return { code: 403, msg: '只能删除自己的评论' }
    await db.collection('activity_comments').doc(commentId).remove()
    return { code: 0, msg: '删除成功' }
  } catch (e) {
    console.error('deleteActivityComment error:', e)
    return { code: 500, msg: '删除失败' }
  }
}