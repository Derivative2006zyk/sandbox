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

/**
 * 将列表中 cloud:// 开头的图片 fileID 批量转换为临时下载链接，
 * 否则前端 <image> 无法直接加载 fileID。
 */
async function fillTempUrls(list) {
  const fileIDs = []
  list.forEach(item => {
    ;['cover', 'coverThumb'].forEach(key => {
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
    cover: map[item.cover] || item.cover,
    coverThumb: map[item.coverThumb] || item.coverThumb
  }))
}

/**
 * 按「时间状态」对活动排序：
 * 1. 进行中（已开始未结束）与未开始（最接近当前时间）排最前；
 * 2. 已结束活动沉底。
 * 并为每个活动标记 isEnded，供前端叠加灰色毛玻璃遮罩。
 */
function sortByTime(list) {
  const now = Date.now()
  const ongoing = []
  const upcoming = []
  const ended = []

  list.forEach(item => {
    const start = item.startTime ? new Date(item.startTime).getTime() : 0
    const end = item.endTime ? new Date(item.endTime).getTime() : Infinity
    const marked = { ...item, isEnded: now > end }

    if (marked.isEnded) {
      ended.push(marked)
    } else if (now >= start) {
      ongoing.push(marked)
    } else {
      upcoming.push(marked)
    }
  })

  ongoing.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  ended.sort((a, b) => new Date(b.endTime) - new Date(a.endTime))

  return [...ongoing, ...upcoming, ...ended]
}

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10 } = event

  try {
    // 先取已发布活动，再按时间状态在内存中排序（时间状态排序无法用单一 orderBy 表达）
    const res = await db.collection('activities')
      .where({ status: 1 })
      .limit(200)
      .get()

    const sorted = sortByTime(res.data)
    const paged = sorted.slice((page - 1) * pageSize, page * pageSize)
    const list = await fillTempUrls(paged)

    return {
      code: 0,
      data: {
        list,
        page,
        pageSize,
        hasMore: page * pageSize < sorted.length
      }
    }
  } catch (e) {
    console.error('getActivityList error:', e)
    return { code: 500, msg: '获取活动列表失败' }
  }
}