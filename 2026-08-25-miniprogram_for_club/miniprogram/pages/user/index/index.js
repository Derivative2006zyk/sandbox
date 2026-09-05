const app = getApp()

Page({
  data: {
    bgUrl: '',
    userInfo: null
  },

  onLoad() {
    this.fetchBgUrl()
  },

  onShow() {
    this.setData({ userInfo: app.globalData.userInfo })
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  goMySignups() {
    app.navigateTo({ url: '/pages/user/signups/index' })
  },

  goFund() {
    app.navigateTo({ url: '/pages/fund/index/index' })
  },

  goAdmin() {
    app.navigateTo({ url: '/pages/admin/index/index' })
  },

  goEditProfile() {
    app.navigateTo({ url: '/pages/user/edit-profile/index' })
  },

  goFeedback() {
    app.navigateTo({ url: '/pages/feedback/index/index' })
  }
})