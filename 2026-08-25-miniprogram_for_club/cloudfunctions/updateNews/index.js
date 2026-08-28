const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { newsId, title, category, content, date, image } = event
  if (!newsId) return { code: 400, msg: '缺少新闻ID' }

  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    const updateData = {}
    if (title !== undefined) updateData.title = title.trim()
    if (category !== undefined) {
      if (!['news', 'announcement'].includes(category)) {
        return { code: 400, msg: '分类无效' }
      }
      updateData.category = category
      updateData.tag = category === 'news' ? '新闻' : '公告'
    }
    if (content !== undefined) updateData.content = content.trim()
    if (date !== undefined) updateData.date = date
    if (image !== undefined) updateData.image = image   // 新增图片字段
    updateData.updateTime = db.serverDate()

    await db.collection('news').doc(newsId).update({ data: updateData })

    return { code: 0, msg: '更新成功' }
  } catch (e) {
    console.error('updateNews error:', e)
    return { code: 500, msg: '更新失败' }
  }
}