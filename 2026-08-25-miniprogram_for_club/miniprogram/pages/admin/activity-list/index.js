const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
    list: [],
    loading: false
  },

  onLoad() {
    this.fetchBgUrl()
    this.loadActivities()
  },

  onShow() {
    if (this.data._loaded) {
      this.loadActivities()
    }
  },

  // 获取背景图临时链接
  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => {
      this.setData({ bgUrl: url })
    }).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  goBack() {
    app.navigateBack({
      fail: () => {
        app.reLaunch({ url: '/pages/admin/index/index' })
      }
    })
  },

  async loadActivities() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getAllActivities',
        data: { page: 1, pageSize: 100 }
      })
      if (res.result && res.result.code === 0) {
        this.setData({
          list: res.result.data.list,
          loading: false,
          _loaded: true
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('加载活动列表失败', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  editActivity(e) {
    const id = e.currentTarget.dataset.id
    app.navigateTo({ url: `/pages/admin/activity-edit/index?id=${id}` })
  },

  createActivity() {
    app.navigateTo({ url: '/pages/admin/activity-edit/index' })
  },

  viewSignups(e) {
    const id = e.currentTarget.dataset.id
    app.navigateTo({ url: `/pages/admin/signup-list/index?id=${id}` })
  },

  deleteActivity(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后用户将无法查看该活动，确定？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteActivity',
              data: { activityId: id }
            })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' })
              this.loadActivities()
            } else {
              wx.showToast({ title: result.result.msg || '删除失败', icon: 'none' })
            }
          } catch (err) {
            console.error('删除活动失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      }
    })
  }
})