const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  // 从 event 中获取总帧数，默认 101
  const totalFrames = event.totalFrames || 101

  // 云存储中的资源前缀与后缀（请根据实际情况修改）
  const framePrefix = 'cloud://cloudbase-d4gsr6mb93c4808e3.636c-cloudbase-d4gsr6mb93c4808e3-1474355921/shiroko_png8/frame_'
  const frameSuffix = '.png'
  const bgFileID = 'cloud://cloudbase-d4gsr6mb93c4808e3.636c-cloudbase-d4gsr6mb93c4808e3-1474355921/assets/background.jpg'

  try {
    // 构建所有需要获取临时链接的文件 ID 列表
    const fileList = [bgFileID]
    for (let i = 1; i <= totalFrames; i++) {
      const frameIndex = String(i).padStart(6, '0')
      fileList.push(`${framePrefix}${frameIndex}${frameSuffix}`)
    }

    // 分批获取临时链接，每批最多 50 个（微信限制）
    const batchSize = 50
    const tempUrls = []
    for (let i = 0; i < fileList.length; i += batchSize) {
      const batch = fileList.slice(i, i + batchSize)
      const res = await cloud.getTempFileURL({ fileList: batch })
      tempUrls.push(...res.fileList.map(item => item.tempFileURL))
    }

    // 第一个是背景图，其余为动画帧
    const bgUrl = tempUrls[0]
    const frameUrls = tempUrls.slice(1)

    return {
      code: 0,
      data: { bgUrl, frameUrls }
    }
  } catch (e) {
    console.error('getWelcomeAssets error:', e)
    return {
      code: 500,
      msg: '获取资源失败',
      data: { bgUrl: '', frameUrls: [] }
    }
  }
}