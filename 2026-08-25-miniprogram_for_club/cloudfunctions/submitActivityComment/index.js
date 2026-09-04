/**
 * 发布活动评论
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @param content 文本
 * @param imageFileID 图片
 * @param videoFileID 视频
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }
  const { activityId, content, imageFileID, videoFileID } = event
  if (!activityId) return { code: 400, msg: '缺少活动ID' }
  if (!content && !imageFileID && !videoFileID) return { code: 400, msg: '内容不能为空' }
  try {
    const data = {
      activityId,
      openid: OPENID,
      content: content ? content.trim() : '',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
    if (imageFileID) data.imageFileID = imageFileID
    if (videoFileID) data.videoFileID = videoFileID
    const addRes = await db.collection('activity_comments').add({ data })
    return { code: 0, msg: '发布成功', data: { _id: addRes._id } }
  } catch (e) {
    console.error('submitActivityComment error:', e)
    return { code: 500, msg: '发布失败' }
  }
}