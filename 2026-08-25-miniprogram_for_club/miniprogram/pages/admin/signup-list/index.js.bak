Page({
  data: {
    activityId: '',
    list: [],
    loading: false
  },
  onLoad(options) {
    this.setData({ activityId: options.id })
    this.loadList()
  },
  async loadList() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getSignupList',
        data: { activityId: this.data.activityId }
      })
      if (res.result && res.result.code === 0) {
        this.setData({ list: res.result.data.list, loading: false })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})