const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  // 校验管理员权限
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
    return { code: 403, msg: '无权限操作' }
  }

  try {
    const res = await db.collection('drafts')
      .where({ status: 'pending' })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()

    // 对于表情草案，获取临时链接以便展示
    const emojiDrafts = res.data.filter(d => d.type === 'emoji')
    const fileIDs = emojiDrafts.map(d => d.imageFileID).filter(Boolean)
    let tempUrlMap = {}
    if (fileIDs.length > 0) {
      const tempRes = await cloud.getTempFileURL({ fileList: fileIDs })
      tempRes.fileList.forEach(item => {
        tempUrlMap[item.fileID] = item.tempFileURL
      })
    }

    const enriched = res.data.map(draft => {
      if (draft.type === 'emoji' && draft.imageFileID) {
        return { ...draft, imageUrl: tempUrlMap[draft.imageFileID] || '' }
      }
      return draft
    })

    return { code: 0, data: enriched }
  } catch (e) {
    console.error('getPendingDrafts error:', e)
    return { code: 500, msg: '获取待审核草案失败' }
  }
}