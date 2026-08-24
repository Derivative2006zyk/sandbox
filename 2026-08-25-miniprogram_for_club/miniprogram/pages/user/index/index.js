const app = getApp()

Page({
  data: { userInfo: null },
  onShow() {
    this.setData({ userInfo: app.globalData.userInfo })
  },
  goEditProfile() {
    wx.navigateTo({ url: '/pages/user/edit-profile/index' })
  }
})