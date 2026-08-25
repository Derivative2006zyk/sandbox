const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { activityId } = event
  if (!activityId) return { code: 400, msg: '缺少活动 ID' }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  try {
    // 获取活动详情
    const activityRes = await db.collection('activities').doc(activityId).get()
    if (!activityRes.data) return { code: 404, msg: '活动不存在' }

    // 查询当前用户是否已报名（status=1）
    const signupRes = await db.collection('signups').where({
      _openid: OPENID,
      activityId,
      status: 1
    }).get()

    return {
      code: 0,
      data: {
        activity: activityRes.data,
        isSignedUp: signupRes.data.length > 0,
        signupInfo: signupRes.data.length > 0 ? signupRes.data[0] : null
      }
    }
  } catch (e) {
    console.error('getActivityDetail error:', e)
    return { code: 500, msg: '获取活动详情失败' }
  }
}