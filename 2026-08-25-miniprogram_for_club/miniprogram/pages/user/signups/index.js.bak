const app = getApp()

Page({
  data: {
    list: [],
    loading: false,
    hasLoaded: false
  },

  onLoad() {
    this.loadMySignups()
  },

  onShow() {
    if (this.data.hasLoaded) {
      this.loadMySignups()
    }
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/user/index/index' })
      }
    })
  },

  async loadMySignups() {
    if (this.data.loading) return
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getMySignups'
      })

      if (res.result && res.result.code === 0) {
        this.setData({
          list: res.result.data.list,
          loading: false,
          hasLoaded: true
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取我的报名失败', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  cancelSignup(e) {
    const activityId = e.currentTarget.dataset.id
    if (!activityId) return

    wx.showModal({
      title: '取消报名',
      content: '确定要取消该活动的报名吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' })
          try {
            const result = await wx.cloud.callFunction({
              name: 'cancelSignup',
              data: { activityId }
            })
            wx.hideLoading()
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已取消', icon: 'success' })
              this.loadMySignups()
            } else {
              wx.showToast({ title: result.result.msg || '取消失败', icon: 'none' })
            }
          } catch (err) {
            wx.hideLoading()
            console.error('取消报名失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      }
    })
  }
})