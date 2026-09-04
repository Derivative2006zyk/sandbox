/**
 * 获取首页轮播图
 *
 * 入参说明：
 * @param 无
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    // 查询所有已发布活动，按创建时间倒序
    const allActivities = await db.collection('activities')
      .where({ status: 1 })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()

    console.log('活动总数:', allActivities.data.length)

    // 分离有图和无图
    const withImage = []
    const withoutImage = []
    allActivities.data.forEach(item => {
      const cover = item.cover || ''
      const coverThumb = item.coverThumb || ''
      const hasImage = (typeof cover === 'string' && cover.trim() !== '') ||
                       (typeof coverThumb === 'string' && coverThumb.trim() !== '')
      if (hasImage) {
        withImage.push(item)
      } else {
        withoutImage.push(item)
      }
    })

    console.log('有图活动数:', withImage.length, '无图活动数:', withoutImage.length)

    // 合并：先有图，后无图，各取至多5个
    const selected = withImage.slice(0, 5)
    if (selected.length < 5) {
      selected.push(...withoutImage.slice(0, 5 - selected.length))
    }

    const banners = selected.map(item => ({
      id: item._id,
      type: 'activity',
      src: item.coverThumb || item.cover || '',
      title: item.title,
      subtitle: item.type || '活动'
    }))

    console.log('返回轮播图数量:', banners.length)
    return { code: 0, data: banners }
  } catch (e) {
    console.error('getBanners error:', e)
    return { code: 500, msg: '获取轮播图失败', data: [] }
  }
}