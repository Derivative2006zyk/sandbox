/**
 * 导出报名名单为 CSV（管理员）
 *
 * 入参说明：
 * @param activityId 活动 ID
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }
  const { activityId } = event
  if (!activityId) return { code: 400, msg: '缺少活动ID' }

  // 校验管理员权限
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
    return { code: 403, msg: '无权限操作' }
  }

  try {
    const signupsRes = await db.collection('signups')
      .where({ activityId, status: 1 })
      .orderBy('createTime', 'asc')
      .limit(1000)
      .get()

    const list = signupsRes.data
    if (list.length === 0) {
      return { code: 404, msg: '暂无报名数据' }
    }

    // 构建 CSV（仅导出昵称与报名时间，不涉及身份信息）
    const header = '昵称,报名时间\n'
    const rows = list.map(item => {
      const nickname = (item.formData && (item.formData.nickname || item.formData.name)) || '微信用户'
      const time = item.createTime || ''
      return [nickname, time].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    })
    const csvContent = header + rows.join('\n')

    // 上传 CSV 到云存储
    const cloudPath = `exports/signups_${activityId}_${Date.now()}.csv`
    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: Buffer.from(csvContent, 'utf8')
    })

    // 获取临时下载链接
    const tempRes = await cloud.getTempFileURL({ fileList: [uploadRes.fileID] })
    const downloadUrl = tempRes.fileList[0].tempFileURL

    return { code: 0, data: { downloadUrl, fileName: `signups_${activityId}.csv` } }
  } catch (e) {
    console.error('exportSignups error:', e)
    return { code: 500, msg: '导出失败' }
  }
}