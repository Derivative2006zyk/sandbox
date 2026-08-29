const app = getApp()

Page({
  data: { userInfo: null },
  onShow() {
    this.setData({ userInfo: app.globalData.userInfo })
  },
  goEditProfile() {
    wx.navigateTo({ url: '/pages/user/edit-profile/index' })
  },
  goMySignups() {
    wx.navigateTo({
      url: '/pages/user/signups/index'
    })
  },
  goFund() {
    wx.navigateTo({
      url: '/pages/fund/index/index'
    })
  },
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/index/index' })
  }
})