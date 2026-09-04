/**
 * 上传表情包
 *
 * 入参说明：
 * @param imageFileID 图片文件标识
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { imageFileID } = event
  if (!imageFileID) return { code: 400, msg: '缺少表情图片' }

  // 简单校验 fileID 格式
  if (!imageFileID.startsWith('cloud://')) {
    return { code: 400, msg: '无效的图片文件' }
  }

  try {
    const res = await db.collection('emoji').add({
      data: {
        imageFileID,
        uploaderOpenid: OPENID,
        createTime: db.serverDate()
      }
    })
    return { code: 0, msg: '上传成功', data: { _id: res._id } }
  } catch (e) {
    console.error('uploadEmoji error:', e)
    return { code: 500, msg: '上传失败' }
  }
}