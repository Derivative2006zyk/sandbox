const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const { type, title, content, formData, imageFileID } = event
  if (!type || !['activity', 'news', 'emoji'].includes(type)) {
    return { code: 400, msg: '无效的草案类型' }
  }

  try {
    const data = {
      type,
      status: 'pending',
      submitterOpenid: OPENID,
      createTime: db.serverDate()
    }
    if (type === 'activity' || type === 'news') {
      if (!title || !title.trim()) return { code: 400, msg: '标题不能为空' }
      data.title = title.trim()
      data.formData = formData || {}
    }
    if (type === 'news') {
      if (!content || !content.trim()) return { code: 400, msg: '内容不能为空' }
      data.content = content.trim()
    }
    if (type === 'emoji') {
      if (!imageFileID) return { code: 400, msg: '请上传表情图片' }
      if (!imageFileID.startsWith('cloud://')) return { code: 400, msg: '无效的图片文件' }
      data.imageFileID = imageFileID
    }

    const res = await db.collection('drafts').add({ data })
    return { code: 0, msg: '提交成功', data: { _id: res._id } }
  } catch (e) {
    console.error('submitDraft error:', e)
    return { code: 500, msg: '提交失败' }
  }
}