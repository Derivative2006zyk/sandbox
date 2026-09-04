/**
 * 获取新闻/公告分页列表
 *
 * 入参说明：
 * @param category 分类
 * @param page 页码
 * @param pageSize 每页数量
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  // 从 event 中解构参数：category 分类，page 页码，pageSize 每页数量
  const { category = 'latest', page = 1, pageSize = 20 } = event

  try {
    const newsCollection = db.collection('news')

    // 构建查询条件：如果是 latest，则查询所有；否则按 category 过滤
    let whereCondition = {}
    if (category !== 'latest') {
      whereCondition.category = category
    }

    // 查询数据，按创建时间倒序排列（最新在前）
    const res = await newsCollection
      .where(whereCondition)
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
    console.error('getNewsList error:', e)
    return { code: 500, msg: '获取新闻列表失败' }
  }
}