const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
    list: [],
    loading: false,
    hasLoaded: false
  },

  onLoad() {
    // 先设置默认背景，避免依赖网络
    this.setData({ bgUrl: '/images/background.jpg' })
    this.fetchBgUrl()
    this.loadMySignups()
  },

  onShow() {
    // 仅在已加载过且有数据时刷新，避免重复加载
    if (this.data.hasLoaded && this.data.list.length > 0) {
      this.loadMySignups()
    }
  },

  // 获取背景图临时链接（带超时保护）
  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('获取背景图超时')), 3000)
    })
    Promise.race([app.getBgUrl(fileID), timeout])
      .then(url => this.setData({ bgUrl: url }))
      .catch(err => {
        console.warn('背景图获取失败，使用本地占位', err)
        this.setData({ bgUrl: '/images/background.jpg' })
      })
  },

  goBack() {
    app.navigateBack({
      fail: () => {
        app.reLaunch({ url: '/pages/user/index/index' })
      }
    })
  },

  async loadMySignups() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({ name: 'getMySignups' })
      if (res.result && res.result.code === 0) {
        this.setData({
          list: res.result.data.list,
          loading: false,
          hasLoaded: true
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('获取我的报名失败', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  cancelSignup(e) {
    const activityId = e.currentTarget.dataset.id
    if (!activityId) return

    wx.showModal({
      title: '取消报名',
      content: '确定要取消该活动的报名吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' })
          try {
            const result = await wx.cloud.callFunction({
              name: 'cancelSignup',
              data: { activityId }
            })
            wx.hideLoading()
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已取消', icon: 'success' })
              this.loadMySignups()
            } else {
              wx.showToast({ title: result.result.msg || '取消失败', icon: 'none' })
            }
          } catch (err) {
            wx.hideLoading()
            console.error('取消报名失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      }
    })
  }
})