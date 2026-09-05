const app = getApp()

Page({
  data: {
    bgUrl: '',
    activityId: '',
    activity: null,
    isSignedUp: false,
    loading: true,
    submitting: false,
    sections: [],
    isAdmin: false
  },

  onLoad(options) {
    const activityId = options.id
    if (!activityId) {
      wx.showToast({ title: '缺少活动参数', icon: 'none' })
      return
    }
    this.setData({ activityId })
    this.fetchBgUrl()
    this.loadDetail()
    this.loadPhotos()
  },

  onShow() {
    const userInfo = app.globalData.userInfo
    this.setData({ isAdmin: !!(userInfo && userInfo.role === 1) })
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityDetail',
        data: { activityId: this.data.activityId }
      })
      if (res.result && res.result.code === 0) {
        this.setData({
          activity: res.result.data.activity,
          isSignedUp: res.result.data.isSignedUp,
          loading: false
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取活动详情失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadPhotos() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityPhotos',
        data: { activityId: this.data.activityId }
      })
      if (res.result && res.result.code === 0) {
        this.setData({ sections: res.result.data.sections || [] })
      }
    } catch (err) {
      console.error('获取活动照片失败', err)
    }
  },

  previewPhoto(e) {
    const { url } = e.currentTarget.dataset
    const urls = []
    this.data.sections.forEach(group => {
      group.photos.forEach(p => { if (p.url) urls.push(p.url) })
    })
    if (urls.length === 0) return
    wx.previewImage({ current: url, urls })
  },

  goBack() {
    app.navigateBack({ fail: () => app.reLaunch({ url: '/pages/index/index' }) })
  },

  goManagePhotos() {
    app.navigateTo({ url: `/pages/admin/photo-manage/index?activityId=${this.data.activityId}` })
  },

  goSignup() {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.nickname) {
      wx.showModal({
        title: '提示',
        content: '请先设置昵称',
        confirmText: '去设置',
        success: (res) => { if (res.confirm) app.navigateTo({ url: '/pages/user/edit-profile/index' }) }
      })
      return
    }
    app.navigateTo({ url: `/pages/activity/signup/index?activityId=${this.data.activityId}` })
  },

  cancelSignup() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ submitting: true })
          try {
            const result = await wx.cloud.callFunction({
              name: 'cancelSignup',
              data: { activityId: this.data.activityId }
            })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已取消', icon: 'success' })
              this.loadDetail()
            } else {
              wx.showToast({ title: result.result.msg || '取消失败', icon: 'none' })
            }
          } catch (err) {
            console.error('取消报名失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          } finally {
            this.setData({ submitting: false })
          }
        }
      }
    })
  }
})
