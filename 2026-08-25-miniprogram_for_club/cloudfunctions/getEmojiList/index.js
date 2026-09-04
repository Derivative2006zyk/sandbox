/**
 * 获取表情包列表
 *
 * 入参说明：
 * @param 无
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 查询所有表情，按创建时间倒序
    const res = await db.collection('emoji')
      .orderBy('createTime', 'desc')
      .limit(200)   // 最多200个
      .get()

    const emojiList = res.data

    if (emojiList.length === 0) {
      return { code: 0, data: [] }
    }

    // 收集所有 fileID
    const fileIDs = emojiList.map(item => item.imageFileID).filter(Boolean)
    const uniqueFileIDs = [...new Set(fileIDs)]

    // 批量获取临时链接
    const tempRes = await cloud.getTempFileURL({ fileList: uniqueFileIDs })
    const tempUrlMap = {}
    tempRes.fileList.forEach(item => {
      tempUrlMap[item.fileID] = item.tempFileURL
    })

    // 组装返回数据
    const result = emojiList.map(item => ({
      _id: item._id,
      fileID: item.imageFileID,
      imageUrl: tempUrlMap[item.imageFileID] || '',
      createTime: item.createTime
    }))

    return { code: 0, data: result }
  } catch (e) {
    console.error('getEmojiList error:', e)
    return { code: 500, msg: '获取表情失败', data: [] }
  }
}