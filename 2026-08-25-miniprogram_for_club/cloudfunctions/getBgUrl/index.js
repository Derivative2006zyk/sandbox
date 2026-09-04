/**
 * 获取云存储文件临时下载链接
 *
 * 入参说明：
 * @param fileID 云存储文件标识
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { fileID } = event
  if (!fileID) return { code: 400, msg: '缺少文件ID' }

  try {
    const res = await cloud.getTempFileURL({ fileList: [fileID] })
    if (res.fileList && res.fileList.length > 0 && res.fileList[0].tempFileURL) {
      return { code: 0, data: { url: res.fileList[0].tempFileURL } }
    } else {
      return { code: 500, msg: '获取临时链接失败' }
    }
  } catch (e) {
    console.error('getBgUrl error:', e)
    return { code: 500, msg: '获取失败' }
  }
}