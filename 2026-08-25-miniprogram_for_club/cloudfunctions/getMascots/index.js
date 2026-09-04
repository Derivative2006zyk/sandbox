// cloudfunctions/getMascots/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { category } = event   // 可选，'shenren' 或 'guga'

  try {
    let query = db.collection('mascots')
    if (category) {
      query = query.where({ category })
    }
    const res = await query.orderBy('createTime', 'desc').limit(50).get()

    // 获取临时链接
    const fileIDs = res.data.map(item => item.imageFileID)
    const tempRes = await cloud.getTempFileURL({ fileList: fileIDs })
    const urlMap = {}
    tempRes.fileList.forEach(item => {
      urlMap[item.fileID] = item.tempFileURL
    })

    const data = res.data.map(item => ({
      ...item,
      imageUrl: urlMap[item.imageFileID] || ''
    }))

    return { code: 0, data }
  } catch (e) {
    console.error('getMascots error:', e)
    return { code: 500, msg: '获取吉祥物失败', data: [] }
  }
}