/**
 * 获取某活动的照片，按分组（section）归类返回
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 *          data.sections 为 [{ section, photos: [{ _id, url, caption }] }]
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { activityId } = event
  if (!activityId) return { code: 400, msg: '缺少活动 ID' }

  try {
    const res = await db.collection('photos')
      .where({ activityId })
      .orderBy('createTime', 'asc')
      .limit(500)
      .get()

    // 将 cloud:// fileID 批量转换为临时下载链接
    const fileIDs = res.data.map(item => item.fileID).filter(v => typeof v === 'string' && v.startsWith('cloud://'))
    const urlMap = {}
    if (fileIDs.length > 0) {
      const tempRes = await cloud.getTempFileURL({ fileList: [...new Set(fileIDs)] })
      ;(tempRes.fileList || []).forEach(item => {
        if (item.fileID && item.tempFileURL) urlMap[item.fileID] = item.tempFileURL
      })
    }

    // 按 section 分组，保持分组出现的先后顺序
    const sectionMap = {}
    const sectionOrder = []
    res.data.forEach(item => {
      const section = (item.section && item.section.trim()) ? item.section.trim() : '未分组'
      if (!sectionMap[section]) {
        sectionMap[section] = []
        sectionOrder.push(section)
      }
      sectionMap[section].push({
        _id: item._id,
        url: urlMap[item.fileID] || '',
        caption: item.caption || ''
      })
    })

    const sections = sectionOrder.map(section => ({
      section,
      photos: sectionMap[section]
    }))

    return { code: 0, data: { sections } }
  } catch (e) {
    console.error('getActivityPhotos error:', e)
    return { code: 500, msg: '获取照片失败' }
  }
}
