/**
 * 获取草案详情（本人）
 *
 * 入参说明：
 * @param draftId 草案 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { draftId } = event
  if (!draftId) return { code: 400, msg: '缺少草案ID' }

  try {
    const res = await db.collection('drafts').doc(draftId).get()
    if (!res.data) return { code: 404, msg: '草案不存在' }

    // 校验提交者
    if (res.data.submitterOpenid !== OPENID) {
      return { code: 403, msg: '只能查看自己的草案' }
    }

    return { code: 0, data: res.data }
  } catch (e) {
    console.error('getDraftDetail error:', e)
    return { code: 500, msg: '获取草案详情失败' }
  }
}