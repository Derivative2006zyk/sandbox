// cloudfunctions/adminAddMascot/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  // 管理员权限
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
    return { code: 403, msg: '无权限操作' }
  }

  const { name, category, imageFileID } = event
  if (!category || !imageFileID) {
    return { code: 400, msg: '参数不完整' }
  }

  try {
    const res = await db.collection('mascots').add({
      data: {
        name: name || '',
        category,
        imageFileID,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
    return { code: 0, msg: '添加成功', data: { _id: res._id } }
  } catch (e) {
    console.error('adminAddMascot error:', e)
    return { code: 500, msg: '添加失败' }
  }
}