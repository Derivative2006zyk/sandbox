/**
 * 获取活动详情及当前用户报名状态
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 将单个活动的 cover/coverThumb 由 cloud:// fileID 转换为临时下载链接。
 */
async function fillTempUrls(activity) {
  if (!activity) return activity
  const keys = ['cover', 'coverThumb']
  const fileIDs = keys
    .map(k => activity[k])
    .filter(v => typeof v === 'string' && v.startsWith('cloud://'))

  if (fileIDs.length === 0) return activity

  const res = await cloud.getTempFileURL({ fileList: fileIDs })
  const map = {}
  ;(res.fileList || []).forEach(f => {
    if (f.fileID && f.tempFileURL) map[f.fileID] = f.tempFileURL
  })

  return {
    ...activity,
    cover: map[activity.cover] || activity.cover,
    coverThumb: map[activity.coverThumb] || activity.coverThumb
  }
}

exports.main = async (event, context) => {
  const { activityId } = event
  if (!activityId) return { code: 400, msg: '缺少活动 ID' }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  try {
    // 获取活动详情
    const activityRes = await db.collection('activities').doc(activityId).get()
    if (!activityRes.data) return { code: 404, msg: '活动不存在' }

    const activity = await fillTempUrls(activityRes.data)

    // 查询当前用户是否已报名（status=1）
    const signupRes = await db.collection('signups').where({
      _openid: OPENID,
      activityId,
      status: 1
    }).get()

    return {
      code: 0,
      data: {
        activity,
        isSignedUp: signupRes.data.length > 0,
        signupInfo: signupRes.data.length > 0 ? signupRes.data[0] : null
      }
    }
  } catch (e) {
    console.error('getActivityDetail error:', e)
    return { code: 500, msg: '获取活动详情失败' }
  }
}