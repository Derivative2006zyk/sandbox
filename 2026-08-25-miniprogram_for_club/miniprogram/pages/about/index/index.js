const app = getApp()

Page({
  data: {},

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/welcome/index/index' })
      }
    })
  }
})