const app = getApp()

Page({
  data: {
    userInfo: null,
    loading: true
  },
  onLoad() {
    this.checkLogin()
  },
  async checkLogin() {
    try {
      const data = await app.login()
      if (data.isNew) {
        wx.navigateTo({ url: '/pages/user/edit-profile/index' })  // 注意路径要与你的 app.json 一致
      } else {
        this.setData({ userInfo: data.user, loading: false })
      }
    } catch (err) {
      console.error('登录检查失败', err)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  }
})