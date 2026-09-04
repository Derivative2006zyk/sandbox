const app = getApp()

Page({
  data: {
    bgUrl: '',
    userInfo: null,
    loading: false,
    listLoading: false,
    currentHomeTab: 'activity',   // 当前选项卡：activity/news/announcement
    displayList: [],               // 当前显示的列表
    keyword: '',                   // 搜索关键词（仅活动选项卡使用）
    page: 1,
    pageSize: 20,
    hasMore: true,
    refreshing: false,
    // 原始数据
    activityList: [],
    newsList: [],
    announcementList: []
  },

  onLoad() {
    this.fetchBgUrl()
    this.checkLogin()
    this.loadCurrentTab(true)
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  async checkLogin() {
    try {
      const data = await app.login()
      if (data.isNew) {
        app.navigateTo({ url: '/pages/user/edit-profile/index' })
      } else {
        this.setData({ userInfo: data.user, loading: false })
      }
    } catch (err) {
      console.error('登录检查失败', err)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  // 切换选项卡
  switchHomeTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentHomeTab) return
    this.setData({
      currentHomeTab: tab,
      page: 1,
      hasMore: true,
      keyword: '',
      displayList: [],
      listLoading: false
    })
    this.loadCurrentTab(true)
  },

  // 加载当前选项卡数据
  async loadCurrentTab(reset = false) {
    if (this.data.listLoading) return
    this.setData({ listLoading: true })

    const page = reset ? 1 : this.data.page
    try {
      let res
      if (this.data.currentHomeTab === 'activity') {
        res = await wx.cloud.callFunction({
          name: 'getActivityList',
          data: { page, pageSize: this.data.pageSize }
        })
        if (res.result && res.result.code === 0) {
          const activities = res.result.data.list
          const mapped = activities.map(item => ({
            _id: item._id,
            type: 'activity',
            title: item.title,
            time: item.startTime,
            location: item.location,
            participantCount: `${item.currentParticipants}/${item.maxParticipants}`,
            coverThumb: item.coverThumb || item.cover || '',
            tagText: item.type || '活动',
            tagClass: 'activity'
          }))
          const newActivityList = reset ? mapped : this.data.activityList.concat(mapped)
          this.setData({
            activityList: newActivityList,
            displayList: newActivityList,
            hasMore: res.result.data.hasMore,
            page: page + 1,
            listLoading: false,
            refreshing: false
          })
        } else {
          this.showError(res.result.msg || '加载失败')
          this.setData({ displayList: [], listLoading: false })
        }
      } else {
        // 新闻或公告
        res = await wx.cloud.callFunction({
          name: 'getNewsList',
          data: { category: this.data.currentHomeTab, page, pageSize: this.data.pageSize }
        })
        if (res.result && res.result.code === 0) {
          const newsItems = res.result.data.list
          const mapped = newsItems.map(item => ({
            _id: item._id,
            type: 'news',
            title: item.title,
            date: item.date || this.formatDate(item.createTime),
            tagText: item.tag || (item.category === 'announcement' ? '公告' : '新闻'),
            tagClass: item.category === 'announcement' ? 'announcement' : 'news',
            coverThumb: item.imageThumb || item.image || '',
            isDraftProposal: item.isDraftProposal || false
          }))
          if (this.data.currentHomeTab === 'news') {
            const newNewsList = reset ? mapped : this.data.newsList.concat(mapped)
            this.setData({
              newsList: newNewsList,
              displayList: newNewsList,
              hasMore: res.result.data.hasMore,
              page: page + 1,
              listLoading: false,
              refreshing: false
            })
          } else if (this.data.currentHomeTab === 'announcement') {
            const newAnnouncementList = reset ? mapped : this.data.announcementList.concat(mapped)
            this.setData({
              announcementList: newAnnouncementList,
              displayList: newAnnouncementList,
              hasMore: res.result.data.hasMore,
              page: page + 1,
              listLoading: false,
              refreshing: false
            })
          }
        } else {
          this.showError(res.result.msg || '加载失败')
          this.setData({ displayList: [], listLoading: false })
        }
      }
    } catch (err) {
      console.error('加载数据失败', err)
      this.showError('网络异常，请重试')
      this.setData({ listLoading: false, refreshing: false })
    }
  },

  // 搜索输入（仅活动）
  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({ keyword })
    this.filterActivities()
  },

  filterActivities() {
    if (this.data.currentHomeTab !== 'activity') return
    const keyword = this.data.keyword.toLowerCase()
    const filtered = this.data.activityList.filter(item => {
      const title = (item.title || '').toLowerCase()
      const location = (item.location || '').toLowerCase()
      return title.includes(keyword) || location.includes(keyword)
    })
    this.setData({ displayList: filtered })
  },

  // 点击列表项
  onItemTap(e) {
    const { id, type } = e.currentTarget.dataset
    if (type === 'activity' && id) {
      app.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
    } else if (type === 'news' && id) {
      app.navigateTo({ url: `/pages/news/detail/index?id=${id}` })
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadCurrentTab(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.listLoading) {
      this.loadCurrentTab(false)
    }
  },

  goBackToMenu() {
    app.navigateTo({ url: '/pages/menu/index/index' })
  },

  formatDate(dateObj) {
    if (!dateObj) return ''
    const d = new Date(dateObj)
    if (isNaN(d.getTime())) return String(dateObj)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  },

  showError(msg) {
    wx.showToast({ title: msg, icon: 'none' })
  }
})