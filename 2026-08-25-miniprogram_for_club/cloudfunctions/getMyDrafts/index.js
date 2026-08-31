const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  try {
    const res = await db.collection('drafts')
      .where({ submitterOpenid: OPENID })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()

    return { code: 0, data: res.data }
  } catch (e) {
    console.error('getMyDrafts error:', e)
    return { code: 500, msg: '获取我的草案失败' }
  }
}