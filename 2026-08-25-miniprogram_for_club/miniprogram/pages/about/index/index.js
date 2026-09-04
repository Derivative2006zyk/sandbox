const app = getApp()

Page({
  data: {},

  goBack() {
    app.navigateBack({
      fail: () => {
        app.reLaunch({ url: '/pages/welcome/index/index' })
      }
    })
  }
})