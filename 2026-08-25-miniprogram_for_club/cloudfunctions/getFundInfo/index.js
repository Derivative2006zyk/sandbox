/**
 * 获取社费余额与流水
 *
 * 入参说明：
 * @param page 页码
 * @param pageSize 每页数量
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20 } = event

  try {
    // 查询最新的记录，获取当前余额
    const latestRes = await db.collection('fund_records')
      .orderBy('createTime', 'desc')
      .limit(1)
      .get()
    const currentBalance = latestRes.data.length > 0 ? latestRes.data[0].afterBalance : 0

    // 分页查询记录列表（按时间倒序）
    const recordsRes = await db.collection('fund_records')
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        currentBalance,
        records: recordsRes.data,
        hasMore: recordsRes.data.length === pageSize
      }
    }
  } catch (e) {
    console.error('getFundInfo error:', e)
    return { code: 500, msg: '获取社费信息失败' }
  }
}