/**
 * 获取新闻详情
 *
 * 入参说明：
 * @param newsId 新闻 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/**
 * 将单条新闻的 image/imageThumb 由 cloud:// fileID 转换为临时下载链接。
 */
async function fillTempUrls(news) {
  if (!news) return news
  const keys = ['image', 'imageThumb']
  const fileIDs = keys
    .map(k => news[k])
    .filter(v => typeof v === 'string' && v.startsWith('cloud://'))

  if (fileIDs.length === 0) return news

  const res = await cloud.getTempFileURL({ fileList: fileIDs })
  const map = {}
  ;(res.fileList || []).forEach(f => {
    if (f.fileID && f.tempFileURL) map[f.fileID] = f.tempFileURL
  })

  return {
    ...news,
    image: map[news.image] || news.image,
    imageThumb: map[news.imageThumb] || news.imageThumb
  }
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { newsId } = event
  if (!newsId) return { code: 400, msg: '缺少新闻ID' }

  try {
    const res = await db.collection('news').doc(newsId).get()
    if (!res.data) {
      return { code: 404, msg: '新闻不存在' }
    }

    const news = await fillTempUrls(res.data)

    return { code: 0, data: news }
  } catch (e) {
    console.error('getNewsDetail error:', e)
    return { code: 500, msg: '获取详情失败' }
  }
}