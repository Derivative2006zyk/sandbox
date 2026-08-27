Page({
  data: {},
  goActivityManage() {
    wx.navigateTo({ url: '/pages/admin/activity-list/index' })
  },
  goFundManage() {
    wx.navigateTo({ url: '/pages/fund/index/index' })
  },
  goNewsManage() {
    wx.navigateTo({
      url: '/pages/admin/news-list/index'
    });
  }
})