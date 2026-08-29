const app = getApp()

Page({
  data: {
    activityId: '',
    activity: null,
    isSignedUp: false,
    loading: true,
    submitting: false
  },

  onLoad(options) {
    const activityId = options.id
    if (!activityId) {
      wx.showToast({ title: '缺少活动参数', icon: 'none' })
      return
    }
    this.setData({ activityId })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityDetail',
        data: { activityId: this.data.activityId }
      })
      if (res.result && res.result.code === 0) {
        this.setData({
          activity: res.result.data.activity,
          isSignedUp: res.result.data.isSignedUp,
          loading: false
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取活动详情失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/index/index' })
      }
    })
  },

  goSignup() {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.name || !userInfo.studentId || !userInfo.phone) {
      wx.showModal({
        title: '提示',
        content: '请先完善个人资料',
        confirmText: '去完善',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/user/edit-profile/index' })
          }
        }
      })
      return
    }
    wx.navigateTo({
      url: `/pages/activity/signup/index?activityId=${this.data.activityId}`
    })
  },

  cancelSignup() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ submitting: true })
          try {
            const result = await wx.cloud.callFunction({
              name: 'cancelSignup',
              data: { activityId: this.data.activityId }
            })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已取消', icon: 'success' })
              this.loadDetail()
            } else {
              wx.showToast({ title: result.result.msg || '取消失败', icon: 'none' })
            }
          } catch (err) {
            console.error('取消报名失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          } finally {
            this.setData({ submitting: false })
          }
        }
      }
    })
  }
})