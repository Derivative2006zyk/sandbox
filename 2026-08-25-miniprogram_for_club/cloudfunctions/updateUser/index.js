/**
 * 更新用户资料
 *
 * 入参说明：
 * @param name 姓名
 * @param studentId 学号
 * @param phone 手机号
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { name, studentId, phone } = event
  if (!name || !studentId || !phone) return { code: 400, msg: '请填写完整信息' }
  try {
    const users = db.collection('users')
    const res = await users.where({ _openid: OPENID }).get()
    if (res.data.length === 0) return { code: 404, msg: '用户不存在，请先登录' }
    const userId = res.data[0]._id
    await users.doc(userId).update({
      data: { name, studentId, phone, updateTime: db.serverDate() }
    })
    const newUser = await users.doc(userId).get()
    return { code: 0, msg: '更新成功', data: { user: newUser.data } }
  } catch (e) {
    console.error('updateUser error:', e)
    return { code: 500, msg: '更新失败' }
  }
}