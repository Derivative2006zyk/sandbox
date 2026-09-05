/**
 * 用户登录
 *
 * 入参说明：
 * @param 无
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }
  try {
    const users = db.collection('users')
    const res = await users.where({ _openid: OPENID }).get()
    if (res.data.length === 0) {
      const addRes = await users.add({
        data: {
          _openid: OPENID,
          nickname: '',
          bio: '',
          role: 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      return { code: 0, data: { _id: addRes._id, isNew: true, user: { nickname: '', bio: '', role: 0 } } }
    } else {
      return { code: 0, data: { _id: res.data[0]._id, isNew: false, user: res.data[0] } }
    }
  } catch (e) {
    console.error('login error:', e)
    return { code: 500, msg: '登录失败' }
  }
}