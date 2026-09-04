// cloudfunctions/adminUpdateMascot/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
    return { code: 403, msg: '无权限操作' }
  }

  const { mascotId, name, category, imageFileID } = event
  if (!mascotId) return { code: 400, msg: '缺少吉祥物ID' }

  try {
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (imageFileID !== undefined) updateData.imageFileID = imageFileID
    updateData.updateTime = db.serverDate()

    await db.collection('mascots').doc(mascotId).update({ data: updateData })
    return { code: 0, msg: '修改成功' }
  } catch (e) {
    console.error('adminUpdateMascot error:', e)
    return { code: 500, msg: '修改失败' }
  }
}