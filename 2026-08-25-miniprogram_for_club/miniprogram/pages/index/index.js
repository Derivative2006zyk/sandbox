const app = getApp()

Page({
  data: {
    userInfo: null,
    loading: true,          // 登录/初始加载状态
    listLoading: false,     // 活动列表加载状态（新增）
    activityList: [],       // 活动列表数据
    page: 1,                // 当前页码
    pageSize: 10,           // 每页数量
    hasMore: true,          // 是否还有更多
    refreshing: false       // 是否正在下拉刷新
  },

  onLoad() {
    this.checkLogin()
    this.loadActivities(true)   // 首次加载活动列表
  },

  // 点击活动卡片跳转详情页
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({
        url: `/pages/activity/detail/index?id=${id}`   // 使用反引号，路径正确
      })
    }
  },

  // 检查登录状态（保持原有逻辑，仅微调跳转路径已正确）
  async checkLogin() {
    try {
      const data = await app.login()
      if (data.isNew) {
        wx.navigateTo({ url: '/pages/user/edit-profile/index' })
      } else {
        this.setData({ userInfo: data.user, loading: false })
      }
    } catch (err) {
      console.error('登录检查失败', err)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
      this.setData({ loading: false })   // 失败时也取消 loading，避免卡住
    }
  },

  // 加载活动列表（新增）
  async loadActivities(reset = false) {
    if (this.data.listLoading) return   // 防止重复加载
    this.setData({ listLoading: true })

    const page = reset ? 1 : this.data.page
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityList',
        data: {
          page: page,
          pageSize: this.data.pageSize
        }
      })

      if (res.result && res.result.code === 0) {
        const { list, hasMore } = res.result.data
        this.setData({
          activityList: reset ? list : this.data.activityList.concat(list),
          page: page + 1,
          hasMore: hasMore,
          listLoading: false,
          refreshing: false
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取活动列表失败', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
    } finally {
      this.setData({ listLoading: false, refreshing: false })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadActivities(true)
    wx.stopPullDownRefresh()
  },

  // 上拉触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.listLoading) {
      this.loadActivities(false)
    }
  }
})