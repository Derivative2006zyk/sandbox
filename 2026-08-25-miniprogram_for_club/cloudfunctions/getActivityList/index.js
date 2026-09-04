/**
 * 获取已发布活动分页列表
 *
 * 入参说明：
 * @param page 页码
 * @param pageSize 每页数量
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10 } = event

  try {
    const activities = db.collection('activities')
    // 查询状态为1（已发布）的活动，按开始时间升序排序
    const res = await activities
      .where({ status: 1 })
      .orderBy('startTime', 'asc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: res.data,
        page,
        pageSize,
        hasMore: res.data.length === pageSize
      }
    }
  } catch (e) {
    console.error('getActivityList error:', e)
    return { code: 500, msg: '获取活动列表失败' }
  }
}