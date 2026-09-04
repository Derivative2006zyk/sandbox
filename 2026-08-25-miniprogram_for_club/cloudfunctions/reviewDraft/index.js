/**
 * 审核草案（管理员）
 *
 * 入参说明：
 * @param draftId 草案 ID
 * @param action 操作 approve/reject
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  // 校验管理员权限
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
    return { code: 403, msg: '无权限操作' }
  }

  const { draftId, action } = event
  if (!draftId || !['approve', 'reject'].includes(action)) {
    return { code: 400, msg: '参数错误' }
  }

  try {
    const draftRes = await db.collection('drafts').doc(draftId).get()
    if (!draftRes.data) return { code: 404, msg: '草案不存在' }
    if (draftRes.data.status !== 'pending') return { code: 400, msg: '该草案已审核' }

    const draft = draftRes.data

    if (action === 'approve') {
      if (draft.type === 'activity' || draft.type === 'news') {
        // 活动和新闻草案审批通过后，都只生成一条公告
        let title = draft.title
        let content = draft.content || ''

        if (draft.type === 'activity') {
          // 活动草案公告标题加前缀，内容包含活动信息
          title = `【活动草案】${draft.title}`
          const fd = draft.formData || {}
          content = `活动时间：${fd.startTime || ''} - ${fd.endTime || ''}\n` +
                    `活动地点：${fd.location || ''}\n` +
                    `报名截止：${fd.signupDeadline || ''}\n` +
                    `人数上限：${fd.maxParticipants || ''}\n` +
                    `活动类型：${fd.type || ''}\n` +
                    `活动介绍：${fd.description || '无'}`
        } else {
          // 新闻草案公告标题加前缀
          title = `【新闻草案】${draft.title}`
        }

        await db.collection('news').add({
          data: {
            title: title,
            category: 'announcement',          // 公告分类
            content: content,
            date: new Date().toISOString().slice(0, 10),
            tag: '公告',
            image: (draft.formData && draft.formData.image) || '',
            imageThumb: (draft.formData && draft.formData.imageThumb) || '',
            isTop: false,
            isDraftProposal: true,             // 标记为草案公告
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
      } else if (draft.type === 'emoji') {
        // 表情包批准逻辑保持不变，压缩后入库
        const originalFileID = draft.imageFileID
        if (!originalFileID) return { code: 400, msg: '表情草案缺少图片' }

        const downloadRes = await cloud.downloadFile({ fileID: originalFileID })
        const imageBuffer = downloadRes.fileContent

        // 动态引入 Jimp，避免影响其他类型草案
        const Jimp = require('jimp')
        const image = await Jimp.read(imageBuffer)
        const width = image.getWidth()
        const height = image.getHeight()
        const fileSizeKB = imageBuffer.length / 1024

        let finalFileID = originalFileID
        if (width > 800 || height > 800 || fileSizeKB > 100) {
          if (width >= height) {
            image.resize(800, Jimp.AUTO)
          } else {
            image.resize(Jimp.AUTO, 800)
          }
          image.quality(80)
          const processedBuffer = await image.getBufferAsync(Jimp.MIME_PNG)
          const ext = 'png'
          const newCloudPath = `emoji/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`
          const uploadRes = await cloud.uploadFile({
            cloudPath: newCloudPath,
            fileContent: processedBuffer
          })
          finalFileID = uploadRes.fileID
        }

        await db.collection('emoji').add({
          data: {
            imageFileID: finalFileID,
            uploaderOpenid: draft.submitterOpenid,
            createTime: db.serverDate()
          }
        })
      }
    }

    // 更新草案状态
    await db.collection('drafts').doc(draftId).update({
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewTime: db.serverDate(),
        reviewerOpenid: OPENID
      }
    })

    return { code: 0, msg: action === 'approve' ? '已批准' : '已拒绝' }
  } catch (e) {
    console.error('reviewDraft error:', e)
    return { code: 500, msg: '审核操作失败' }
  }
}