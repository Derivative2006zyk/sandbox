/**
 * 记录一笔社费收支（管理员）
 *
 * 入参说明：
 * @param amount 金额（正负）
 * @param note 备注
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { amount, note } = event
  if (typeof amount !== 'number' || amount === 0) {
    return { code: 400, msg: '金额无效' }
  }
  if (!note || !note.trim()) {
    return { code: 400, msg: '请填写备注' }
  }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  try {
    // 1. 校验管理员权限
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    // 2. 获取当前余额（最新记录 afterBalance，若无记录则为0）
    const latestRes = await db.collection('fund_records')
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()
    const beforeBalance = latestRes.data.length > 0 ? latestRes.data[0].afterBalance : 0
    const afterBalance = beforeBalance + amount
    if (afterBalance < 0) {
      return { code: 400, msg: '余额不足，操作后为负' }
    }

    // 3. 添加记录
    const addRes = await db.collection('fund_records').add({
      data: {
        amount,
        beforeBalance,
        afterBalance,
        note: note.trim(),
        operatorOpenid: OPENID,
        operatorName: userRes.data[0].nickname || '管理员',
        createTime: db.serverDate()
      }
    })

    return {
      code: 0,
      msg: '更新成功',
      data: {
        _id: addRes._id,
        beforeBalance,
        afterBalance
      }
    }
  } catch (e) {
    console.error('updateFund error:', e)
    return { code: 500, msg: '更新失败' }
  }
}