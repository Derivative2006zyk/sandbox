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

/**
 * 将列表中 cloud:// 开头的图片 fileID 批量转换为临时下载链接，
 * 否则前端 <image> 无法直接加载 fileID。
 */
async function fillTempUrls(list) {
  const fileIDs = []
  list.forEach(item => {
    ;['image', 'imageThumb'].forEach(key => {
      const v = item[key]
      if (typeof v === 'string' && v.startsWith('cloud://')) fileIDs.push(v)
    })
  })
  const unique = [...new Set(fileIDs)]
  if (unique.length === 0) return list

  const res = await cloud.getTempFileURL({ fileList: unique })
  const map = {}
  ;(res.fileList || []).forEach(f => {
    if (f.fileID && f.tempFileURL) map[f.fileID] = f.tempFileURL
  })

  return list.map(item => ({
    ...item,
    image: map[item.image] || item.image,
    imageThumb: map[item.imageThumb] || item.imageThumb
  }))
}

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

    const list = await fillTempUrls(res.data)

    return {
      code: 0,
      data: {
        list,
        hasMore: res.data.length === pageSize
      }
    }
  } catch (e) {
    console.error('getNewsList error:', e)
    return { code: 500, msg: '获取新闻列表失败' }
  }
}