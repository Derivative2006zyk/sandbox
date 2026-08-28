const app = getApp()

Page({
  data: {
    activityId: '',
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    signupDeadline: '',
    maxParticipants: '',
    type: '',
    status: 1,
    cover: '',             // 新增图片字段
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ activityId: options.id })
      this.loadActivity()
    }
  },

  // 加载已有活动信息（编辑模式）
  async loadActivity() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityDetail',
        data: { activityId: this.data.activityId }
      })
      if (res.result && res.result.code === 0) {
        const act = res.result.data.activity
        this.setData({
          title: act.title || '',
          description: act.description || '',
          location: act.location || '',
          startTime: act.startTime || '',
          endTime: act.endTime || '',
          signupDeadline: act.signupDeadline || '',
          maxParticipants: act.maxParticipants ? String(act.maxParticipants) : '',
          type: act.type || '',
          status: act.status !== undefined ? act.status : 1,
          cover: act.cover || ''      // 加载已有封面
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('加载活动失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
  },

  // 输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  // 状态切换
  onStatusChange(e) {
    this.setData({ status: Number(e.detail.value) })
  },

  // 上传封面图片
  uploadCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...' })
        // 生成唯一云端路径
        const cloudPath = `activity-covers/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePath,
          success: (uploadRes) => {
            this.setData({ cover: uploadRes.fileID })
            wx.hideLoading()
            wx.showToast({ title: '上传成功', icon: 'success' })
          },
          fail: (err) => {
            wx.hideLoading()
            console.error('上传失败', err)
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      },
      fail: (err) => {
        console.error('选择图片失败', err)
      }
    })
  },

  // 提交保存（新建或更新）
  async submit() {
    const {
      activityId, title, description, location,
      startTime, endTime, signupDeadline, maxParticipants, type, status, cover
    } = this.data

    // 基础校验
    if (!title.trim() || !location.trim() || !startTime.trim() || !endTime.trim() || !signupDeadline.trim() || !maxParticipants.trim()) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    const maxNum = Number(maxParticipants)
    if (isNaN(maxNum) || maxNum <= 0) {
      wx.showToast({ title: '人数上限必须大于0', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      if (activityId) {
        // 编辑模式
        const res = await wx.cloud.callFunction({
          name: 'updateActivity',
          data: {
            activityId,
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            signupDeadline: signupDeadline.trim(),
            maxParticipants: maxNum,
            type: type.trim(),
            status: Number(status),
            cover: cover        // 传递封面
          }
        })
        this.handleResult(res)
      } else {
        // 新建模式
        const res = await wx.cloud.callFunction({
          name: 'createActivity',
          data: {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            signupDeadline: signupDeadline.trim(),
            maxParticipants: maxNum,
            type: type.trim(),
            status: Number(status),
            cover: cover        // 传递封面
          }
        })
        this.handleResult(res)
      }
    } catch (err) {
      console.error('保存活动失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  handleResult(res) {
    if (res.result && res.result.code === 0) {
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1000)
    } else {
      wx.showToast({ title: res.result.msg || '操作失败', icon: 'none' })
    }
  }
})