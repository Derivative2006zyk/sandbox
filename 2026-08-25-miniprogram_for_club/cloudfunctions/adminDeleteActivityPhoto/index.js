/**
 * 删除活动照片（管理员）
 *
 * 入参说明：
 * @param photoId 照片 ID
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

  const { photoId } = event
  if (!photoId) return { code: 400, msg: '缺少照片 ID' }

  try {
    const photoRes = await db.collection('photos').doc(photoId).get()
    await db.collection('photos').doc(photoId).remove()

    // 同步删除云存储文件，避免残留
    const fileID = photoRes.data && photoRes.data.fileID
    if (typeof fileID === 'string' && fileID.startsWith('cloud://')) {
      try {
        await cloud.deleteFile({ fileList: [fileID] })
      } catch (e) {
        console.error('删除云存储文件失败', e)
      }
    }

    return { code: 0, msg: '删除成功' }
  } catch (e) {
    console.error('adminDeleteActivityPhoto error:', e)
    return { code: 500, msg: '删除失败' }
  }
}
