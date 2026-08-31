const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }
  const { content, contact } = event
  if (!content || !content.trim()) {
    return { code: 400, msg: '反馈内容不能为空' }
  }

  try {
    const res = await db.collection('feedback').add({
      data: {
        openid: OPENID,
        content: content.trim(),
        contact: contact ? contact.trim() : '',
        createTime: db.serverDate()
      }
    })
    return { code: 0, msg: '提交成功', data: { _id: res._id } }
  } catch (e) {
    console.error('submitFeedback error:', e)
    return { code: 500, msg: '提交失败' }
  }
}