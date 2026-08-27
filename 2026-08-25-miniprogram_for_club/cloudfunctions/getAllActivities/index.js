const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { page = 1, pageSize = 100 } = event

  try {
    const res = await db.collection('activities')
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: res.data,
        hasMore: res.data.length === pageSize
      }
    }
  } catch (e) {
    console.error('getAllActivities error:', e)
    return { code: 500, msg: '获取活动列表失败' }
  }
}