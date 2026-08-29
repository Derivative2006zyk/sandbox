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