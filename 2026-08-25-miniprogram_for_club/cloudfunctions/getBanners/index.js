/**
 * 获取菜单页轮播图（活动 + 新闻/公告混合）
 *
 * 入参说明：
 * @param 无
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 *          data 为数组，每项含 type（activity/news）、id、src、title、subtitle
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 并发拉取已发布活动与新闻/公告
    const [activityRes, newsRes] = await Promise.all([
      db.collection('activities').where({ status: 1 }).orderBy('createTime', 'desc').limit(100).get(),
      db.collection('news').orderBy('createTime', 'desc').limit(100).get()
    ])

    const banners = []
    const fileIDs = []

    // 活动：有封面优先，最多取 3 个
    const withImageActs = []
    const withoutImageActs = []
    activityRes.data.forEach(item => {
      const cover = item.cover || ''
      const coverThumb = item.coverThumb || ''
      const hasImage = (typeof cover === 'string' && cover.trim() !== '') ||
                       (typeof coverThumb === 'string' && coverThumb.trim() !== '')
      if (hasImage) withImageActs.push(item)
      else withoutImageActs.push(item)
    })
    const selectedActs = withImageActs.slice(0, 3)
    if (selectedActs.length < 3) {
      selectedActs.push(...withoutImageActs.slice(0, 3 - selectedActs.length))
    }
    selectedActs.forEach(item => {
      const src = item.coverThumb || item.cover || ''
      banners.push({
        id: item._id,
        type: 'activity',
        src,
        title: item.title,
        subtitle: item.type || '活动'
      })
      if (typeof src === 'string' && src.startsWith('cloud://')) fileIDs.push(src)
    })

    // 新闻/公告：有图才加入，最多补足到 5 个
    newsRes.data.forEach(item => {
      if (banners.length >= 5) return
      const src = item.imageThumb || item.image || ''
      if (typeof src !== 'string' || src.trim() === '') return
      banners.push({
        id: item._id,
        type: 'news',
        src,
        title: item.title,
        subtitle: item.category === 'announcement' ? '公告' : '新闻'
      })
      if (src.startsWith('cloud://')) fileIDs.push(src)
    })

    // 将 cloud:// fileID 批量转换为临时下载链接
    if (fileIDs.length > 0) {
      const tempRes = await cloud.getTempFileURL({ fileList: [...new Set(fileIDs)] })
      const map = {}
      ;(tempRes.fileList || []).forEach(f => {
        if (f.fileID && f.tempFileURL) map[f.fileID] = f.tempFileURL
      })
      banners.forEach(b => {
        if (map[b.src]) b.src = map[b.src]
      })
    }

    return { code: 0, data: banners }
  } catch (e) {
    console.error('getBanners error:', e)
    return { code: 500, msg: '获取轮播图失败', data: [] }
  }
}
