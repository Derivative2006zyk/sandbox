/**
 * 获取活动评论列表
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { activityId } = event
  if (!activityId) return { code: 400, msg: '缺少活动ID' }

  try {
    // 查询评论列表
    const res = await db.collection('activity_comments')
      .where({ activityId })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()

    const comments = res.data

    // 收集所有需要转换的 fileID（图片和视频）
    const fileIDs = []
    comments.forEach(comment => {
      if (comment.imageFileID) fileIDs.push(comment.imageFileID)
      if (comment.videoFileID) fileIDs.push(comment.videoFileID)
    })

    // 去重
    const uniqueFileIDs = [...new Set(fileIDs)]

    // 批量获取临时链接
    let tempUrlMap = {}
    if (uniqueFileIDs.length > 0) {
      const tempRes = await cloud.getTempFileURL({ fileList: uniqueFileIDs })
      tempRes.fileList.forEach(item => {
        tempUrlMap[item.fileID] = item.tempFileURL
      })
    }

    // 为每条评论附加 imageUrl 和 videoUrl
    const enrichedComments = comments.map(comment => {
      const enriched = { ...comment }
      if (comment.imageFileID) {
        enriched.imageUrl = tempUrlMap[comment.imageFileID] || ''
      }
      if (comment.videoFileID) {
        enriched.videoUrl = tempUrlMap[comment.videoFileID] || ''
      }
      return enriched
    })

    return { code: 0, data: enrichedComments }
  } catch (e) {
    console.error('getActivityComments error:', e)
    return { code: 500, msg: '获取评论失败' }
  }
}