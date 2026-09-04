const app = getApp()

Page({
  data: {
    bgUrl: ''
  },

  onLoad() {
    this.fetchBgUrl()
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  goBack() {
    app.navigateBack({ fail: () => app.reLaunch({ url: '/pages/index/index' }) })
  },

  goActivityManage() {
    app.navigateTo({ url: '/pages/admin/activity-list/index' })
  },

  goFundManage() {
    app.navigateTo({ url: '/pages/fund/index/index' })
  },

  goNewsManage() {
    app.navigateTo({ url: '/pages/admin/news-list/index' })
  },

  goAudit() {
    app.navigateTo({ url: '/pages/admin/audit/index' })
  },
  goMascotManage() {
    app.navigateTo({ url: '/pages/admin/mascot-manage/index' })
  }
})