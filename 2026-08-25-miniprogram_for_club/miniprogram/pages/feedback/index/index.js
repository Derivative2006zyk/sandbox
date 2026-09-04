const app = getApp()

Page({
  data: {
    bgUrl: '',
    content: '',
    contact: '',
    submitting: false
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
    app.navigateBack({
      fail: () => {
        app.reLaunch({ url: '/pages/user/index/index' })
      }
    })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  async submitFeedback() {
    const content = this.data.content.trim()
    if (!content) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'submitFeedback',
        data: {
          content: content,
          contact: this.data.contact.trim()
        }
      })
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '感谢您的反馈', icon: 'success' })
        this.setData({ content: '', contact: '' })
      } else {
        wx.showToast({ title: res.result.msg || '提交失败', icon: 'none' })
      }
    } catch (err) {
      console.error('提交反馈失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})