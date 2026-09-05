/**
 * 更新活动照片的文字说明（管理员）
 *
 * 入参说明：
 * @param photoId 照片 ID
 * @param caption 文字说明
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  // 管理员权限校验
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
    return { code: 403, msg: '无权限操作' }
  }

  const { photoId, caption } = event
  if (!photoId) return { code: 400, msg: '缺少照片 ID' }

  try {
    await db.collection('photos').doc(photoId).update({
      data: {
        caption: caption ? String(caption).trim() : ''
      }
    })
    return { code: 0, msg: '更新成功' }
  } catch (e) {
    console.error('adminUpdateActivityPhoto error:', e)
    return { code: 500, msg: '更新失败' }
  }
}
