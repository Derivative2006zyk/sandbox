/**
 * 删除活动的某个照片分组（管理员）
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @param section 分组标题
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

  const { activityId, section } = event
  if (!activityId || !section) return { code: 400, msg: '参数不完整' }

  try {
    // 查询该分组下所有照片，最多 100 条
    const res = await db.collection('photos')
      .where({ activityId, section })
      .limit(100)
      .get()

    const fileIDs = res.data.map(item => item.fileID).filter(v => typeof v === 'string' && v.startsWith('cloud://'))

    // 批量删除数据库记录
    if (res.data.length > 0) {
      const ids = res.data.map(item => item._id)
      await Promise.all(ids.map(id => db.collection('photos').doc(id).remove()))
    }

    // 同步删除云存储文件
    if (fileIDs.length > 0) {
      try {
        await cloud.deleteFile({ fileList: [...new Set(fileIDs)] })
      } catch (e) {
        console.error('删除云存储文件失败', e)
      }
    }

    return { code: 0, msg: '删除成功' }
  } catch (e) {
    console.error('adminDeleteActivitySection error:', e)
    return { code: 500, msg: '删除失败' }
  }
}
