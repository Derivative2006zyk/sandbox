const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { newsId } = event
  if (!newsId) return { code: 400, msg: '缺少新闻ID' }

  try {
    const res = await db.collection('news').doc(newsId).get()
    if (!res.data) return { code: 404, msg: '新闻不存在' }
    return { code: 0, data: res.data }
  } catch (e) {
    console.error('getNewsDetail error:', e)
    return { code: 500, msg: '获取详情失败' }
  }
}