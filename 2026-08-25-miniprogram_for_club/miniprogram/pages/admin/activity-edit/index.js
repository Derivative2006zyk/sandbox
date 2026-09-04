const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
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
    cover: '',
    coverThumb: '',
    submitting: false
  },

  onLoad(options) {
    this.fetchBgUrl()
    if (options.id) {
      this.setData({ activityId: options.id })
      this.loadActivity()
    }
  },

  // 获取背景图临时链接
  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => {
      this.setData({ bgUrl: url })
    }).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  goBack() {
    app.navigateBack({
      fail: () => {
        app.reLaunch({ url: '/pages/admin/activity-list/index' })
      }
    })
  },

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
          cover: act.cover || '',
          coverThumb: act.coverThumb || ''
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('加载活动失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  onStatusChange(e) {
    this.setData({ status: Number(e.detail.value) })
  },

  async uploadCover() {
    const hasNetwork = await this.checkNetwork()
    if (!hasNetwork) {
      wx.showToast({ title: '网络不可用，请联网后重试', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '处理中...' })

        try {
          const compressedPath = await this.compressImage(tempFilePath, 1280, 0.8)
          const thumbPath = await this.compressImage(tempFilePath, 300, 0.6)

          wx.showLoading({ title: '上传中...' })

          const coverUpload = await wx.cloud.uploadFile({
            cloudPath: `activity-covers/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`,
            filePath: compressedPath
          })
          const thumbUpload = await wx.cloud.uploadFile({
            cloudPath: `activity-covers/thumb/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`,
            filePath: thumbPath
          })

          this.setData({
            cover: coverUpload.fileID,
            coverThumb: thumbUpload.fileID
          })

          wx.hideLoading()
          wx.showToast({ title: '上传成功', icon: 'success' })
        } catch (err) {
          wx.hideLoading()
          console.error('图片处理或上传失败', err)
          wx.showToast({ title: '上传失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('选择图片失败', err)
      }
    })
  },

  async checkNetwork() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => resolve(res.networkType !== 'none'),
        fail: () => resolve(false)
      })
    })
  },

  async compressImage(src, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src,
        success: (info) => {
          let { width, height } = info
          if (width > maxWidth) {
            const ratio = maxWidth / width
            width = maxWidth
            height = Math.round(height * ratio)
          }
          const ctx = wx.createCanvasContext('compressCanvas', this)
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(src, 0, 0, width, height)
          ctx.draw(false, () => {
            wx.canvasToTempFilePath({
              canvasId: 'compressCanvas',
              x: 0, y: 0, width, height,
              destWidth: width, destHeight: height,
              fileType: 'jpg', quality,
              success: (res) => resolve(res.tempFilePath),
              fail: reject
            }, this)
          })
        },
        fail: reject
      })
    })
  },

  async submit() {
    const {
      activityId, title, description, location,
      startTime, endTime, signupDeadline, maxParticipants,
      type, status, cover, coverThumb
    } = this.data

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
        const res = await wx.cloud.callFunction({
          name: 'updateActivity',
          data: {
            activityId,
            title: title.trim(), description: description.trim(), location: location.trim(),
            startTime: startTime.trim(), endTime: endTime.trim(), signupDeadline: signupDeadline.trim(),
            maxParticipants: maxNum, type: type.trim(), status: Number(status),
            cover: cover, coverThumb: coverThumb
          }
        })
        this.handleResult(res)
      } else {
        const res = await wx.cloud.callFunction({
          name: 'createActivity',
          data: {
            title: title.trim(), description: description.trim(), location: location.trim(),
            startTime: startTime.trim(), endTime: endTime.trim(), signupDeadline: signupDeadline.trim(),
            maxParticipants: maxNum, type: type.trim(), status: Number(status),
            cover: cover, coverThumb: coverThumb
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
      setTimeout(() => app.navigateBack(), 1000)
    } else {
      wx.showToast({ title: res.result.msg || '操作失败', icon: 'none' })
    }
  }
})