const app = getApp()

Page({
  data: {
    bgUrl: '',
    activityId: '',
    submitting: false
  },

  onLoad(options) {
    this.fetchBgUrl()
    const activityId = options.activityId
    if (!activityId) {
      wx.showToast({ title: '缺少活动参数', icon: 'none' })
      return
    }
    this.setData({ activityId })
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => {
      this.setData({ bgUrl: url })
    }).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  async submit() {
    if (this.data.submitting) return
    this.setData({ submitting: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'signup',
        data: {
          activityId: this.data.activityId
          // 不再传递表单数据，云函数会自动读取用户昵称
        }
      })
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '报名成功', icon: 'success' })
        setTimeout(() => {
          const pages = getCurrentPages()
          const prevPage = pages[pages.length - 2]
          if (prevPage && prevPage.loadDetail) prevPage.loadDetail()
          app.navigateBack()
        }, 1000)
      } else {
        wx.showToast({ title: res.result.msg || '报名失败', icon: 'none' })
      }
    } catch (err) {
      console.error('报名失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})