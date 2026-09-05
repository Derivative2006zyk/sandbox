/**
 * 添加活动照片（管理员）
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @param fileID 照片云存储 fileID
 * @param section 分组标题（如「选手图片」「大合照」，缺省归入「未分组」）
 * @param caption 文字说明（可选）
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

  const { activityId, fileID, section, caption } = event
  if (!activityId || !fileID) return { code: 400, msg: '参数不完整' }

  try {
    const res = await db.collection('photos').add({
      data: {
        activityId,
        fileID,
        section: (section && section.trim()) ? section.trim() : '未分组',
        caption: (caption && caption.trim()) ? caption.trim() : '',
        createTime: db.serverDate()
      }
    })
    return { code: 0, msg: '添加成功', data: { _id: res._id } }
  } catch (e) {
    console.error('adminAddActivityPhoto error:', e)
    return { code: 500, msg: '添加失败' }
  }
}
