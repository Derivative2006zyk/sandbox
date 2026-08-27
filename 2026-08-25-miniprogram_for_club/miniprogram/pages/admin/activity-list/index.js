const app = getApp()

Page({
  data: {
    list: [],
    loading: false
  },

  onLoad() {
    this.loadActivities()
  },

  onShow() {
    if (this.data._loaded) {
      this.loadActivities()
    }
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

  // 编辑活动
  editActivity(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/activity-edit/index?id=${id}` })
  },

  // 新建活动
  createActivity() {
    wx.navigateTo({ url: '/pages/admin/activity-edit/index' })
  },

  // 查看报名名单
  viewSignups(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/signup-list/index?id=${id}` })
  },

  // 删除活动
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