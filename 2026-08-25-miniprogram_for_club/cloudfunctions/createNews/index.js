const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { title, category, content, date, image, imageThumb } = event
  if (!title || !category || !content) {
    return { code: 400, msg: '请填写标题、分类和内容' }
  }
  if (!['news', 'announcement'].includes(category)) {
    return { code: 400, msg: '分类无效' }
  }

  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    const addRes = await db.collection('news').add({
      data: {
        title: title.trim(),
        category,
        content: content.trim(),
        date: date || new Date().toISOString().slice(0, 10),
        tag: category === 'news' ? '新闻' : '公告',
        image: image || '',
        imageThumb: imageThumb || '',   // 新增缩略图字段
        isTop: false,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return { code: 0, msg: '创建成功', data: { _id: addRes._id } }
  } catch (e) {
    console.error('createNews error:', e)
    return { code: 500, msg: '创建失败' }
  }
}