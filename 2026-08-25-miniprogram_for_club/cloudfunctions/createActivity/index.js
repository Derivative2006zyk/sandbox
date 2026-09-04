/**
 * 创建活动（管理员）
 *
 * 入参说明：
 * @param title 标题
 * @param description 介绍
 * @param location 地点
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @param signupDeadline 报名截止
 * @param maxParticipants 人数上限
 * @param type 类型
 * @param status 状态
 * @param cover 封面
 * @param coverThumb 封面缩略图
 * @returns {Object} 统一返回 { code, msg, data }，code 为 0 表示成功
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { code: 401, msg: '无法获取用户身份' }

  const {
    title,
    description,
    location,
    startTime,
    endTime,
    signupDeadline,
    maxParticipants,
    type,
    status,
    cover,
    coverThumb            // 新增缩略图字段
  } = event

  if (!title || !location || !startTime || !endTime || !signupDeadline || !maxParticipants) {
    return { code: 400, msg: '请填写完整活动信息' }
  }
  if (maxParticipants <= 0) return { code: 400, msg: '人数上限必须大于0' }

  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (userRes.data.length === 0 || userRes.data[0].role !== 1) {
      return { code: 403, msg: '无权限操作' }
    }

    const addRes = await db.collection('activities').add({
      data: {
        title: title.trim(),
        description: description ? description.trim() : '',
        location: location.trim(),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        signupDeadline: new Date(signupDeadline),
        maxParticipants: Number(maxParticipants),
        currentParticipants: 0,
        type: type ? type.trim() : '',
        status: status !== undefined ? Number(status) : 1,
        cover: cover || '',
        coverThumb: coverThumb || '',   // 新增
        createBy: OPENID,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return { code: 0, msg: '创建成功', data: { _id: addRes._id } }
  } catch (e) {
    console.error('createActivity error:', e)
    return { code: 500, msg: '创建失败' }
  }
}