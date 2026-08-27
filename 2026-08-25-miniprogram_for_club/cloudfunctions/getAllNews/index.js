const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  try {
    // 管理员权限校验
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    const res = await db.collection('news')
      .orderBy('createTime', 'desc')
      .limit(100)   // 最多100条
      .get()

    return { code: 0, data: res.data }
  } catch (e) {
    console.error('getAllNews error:', e)
    return { code: 500, msg: '获取新闻列表失败' }
  }
}