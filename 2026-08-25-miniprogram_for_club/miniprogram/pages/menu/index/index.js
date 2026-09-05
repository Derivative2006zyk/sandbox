const app = getApp()

Page({
  data: {
    bgUrl: '',
    banners: [],
    current: 0,
    currentTab: 'latest',
    tabs: [
      { key: 'latest', name: '最新' },
      { key: 'news', name: '新闻' },
      { key: 'announcement', name: '公告' },
      { key: 'activity', name: '活动' }
    ],
    filteredNews: [],
    newsLoading: false,
    hasMore: false,
    page: 1,
    pageSize: 6,
    touchStartX: 0,
    touchStartY: 0
  },

  onLoad() {
    this.fetchBgUrl()
    this.loadBanners()
    this.loadData('latest', true)
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  async loadBanners() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getBanners' })
      if (res.result && res.result.code === 0) {
        this.setData({ banners: res.result.data })
      }
    } catch (err) {
      console.error('获取轮播图失败', err)
      this.setData({ banners: [] })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return
    this.setData({ currentTab: tab })
    this.loadData(tab, true)
  },

  async loadData(category, reset = false) {
    if (this.data.newsLoading) return
    this.setData({ newsLoading: true })

    const page = reset ? 1 : this.data.page
    try {
      if (category === 'activity') {
        const res = await wx.cloud.callFunction({
          name: 'getActivityList',
          data: { page, pageSize: this.data.pageSize }
        })
        if (res.result && res.result.code === 0) {
          const activities = res.result.data.list
          const processedList = activities.map(item => ({
            _id: item._id,
            title: item.title,
            date: this.formatDate(item.startTime),
            tag: '活动',
            tagClass: 'activity',
            activityId: item._id,
            imageThumb: item.coverThumb || item.cover || '',
            isEnded: item.isEnded
          }))
          this.setData({ filteredNews: processedList, hasMore: false, newsLoading: false })
        } else {
          this.showError(res.result.msg || '加载失败')
          this.setData({ filteredNews: [] })
        }
      } else if (category === 'latest') {
        // 「最新」：同时涵盖新闻/公告与活动，按时间倒序混合展示
        const [actRes, newsRes] = await Promise.all([
          wx.cloud.callFunction({ name: 'getActivityList', data: { page: 1, pageSize: this.data.pageSize } }),
          wx.cloud.callFunction({ name: 'getNewsList', data: { category: 'latest', page: 1, pageSize: this.data.pageSize } })
        ])

        const merged = []

        if (actRes.result && actRes.result.code === 0) {
          actRes.result.data.list.forEach(item => {
            merged.push({
              _id: item._id,
              title: item.title,
              date: this.formatDate(item.startTime),
              tag: '活动',
              tagClass: 'activity',
              activityId: item._id,
              imageThumb: item.coverThumb || item.cover || '',
              isEnded: item.isEnded,
              _ts: new Date(item.startTime || item.createTime).getTime() || 0
            })
          })
        }

        if (newsRes.result && newsRes.result.code === 0) {
          newsRes.result.data.list.forEach(item => {
            merged.push({
              _id: item._id,
              title: item.title,
              date: item.date || this.formatDate(item.createTime),
              tag: item.tag || (item.category === 'announcement' ? '公告' : '新闻'),
              tagClass: item.category === 'announcement' ? 'announcement' : 'news',
              imageThumb: item.imageThumb || item.image || '',
              _ts: new Date(item.createTime || item.date).getTime() || 0
            })
          })
        }

        merged.sort((a, b) => b._ts - a._ts)
        const limited = merged.slice(0, this.data.pageSize)
        this.setData({ filteredNews: limited, hasMore: false, newsLoading: false })
      } else {
        const res = await wx.cloud.callFunction({
          name: 'getNewsList',
          data: { category, page, pageSize: this.data.pageSize }
        })
        if (res.result && res.result.code === 0) {
          const newsList = res.result.data.list
          const processedList = newsList.map(item => ({
            _id: item._id,
            title: item.title,
            date: item.date || this.formatDate(item.createTime),
            tag: item.tag || item.category,
            tagClass: item.category === 'announcement' ? 'announcement' : 'news',
            imageThumb: item.imageThumb || item.image || ''
          }))
          this.setData({ filteredNews: processedList, hasMore: false, newsLoading: false })
        } else {
          this.showError(res.result.msg || '加载失败')
          this.setData({ filteredNews: [] })
        }
      }
    } catch (err) {
      console.error('数据加载失败', err)
      this.showError('网络异常，请重试')
      this.setData({ filteredNews: [] })
    } finally {
      this.setData({ newsLoading: false })
    }
  },

  showError(msg) { wx.showToast({ title: msg, icon: 'none' }); },

  formatDate(dateObj) {
    if (!dateObj) return ''
    const d = new Date(dateObj)
    if (isNaN(d.getTime())) return String(dateObj)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  },

  onItemTap(e) {
    const { id, type } = e.currentTarget.dataset
    if (type === 'activity' && id) {
      app.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
    } else if (type === 'news' && id) {
      app.navigateTo({ url: `/pages/news/detail/index?id=${id}` })
    }
  },

  onBannerTap(e) {
    const { id, type } = e.currentTarget.dataset
    if (type === 'activity' && id) {
      app.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
    } else if (type === 'news' && id) {
      app.navigateTo({ url: `/pages/news/detail/index?id=${id}` })
    }
  },

  onSwiperChange(e) { this.setData({ current: e.detail.current }); },
  prevBanner() {
    let index = this.data.current - 1
    if (index < 0) index = this.data.banners.length - 1
    this.setData({ current: index })
  },
  nextBanner() {
    let index = this.data.current + 1
    if (index >= this.data.banners.length) index = 0
    this.setData({ current: index })
  },

  // 触摸事件，优化防误触
  onTouchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY
    })
  },

  onTouchEnd(e) {
    const deltaX = Math.abs(e.changedTouches[0].clientX - this.data.touchStartX)
    const deltaY = e.changedTouches[0].clientY - this.data.touchStartY
    // 降低灵敏度：需明显上滑且以纵向为主，避免滚动页面时误触进入吉祥物页
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && deltaY < -120) {
      this.goMascot()
    }
  },

  goMascot() {
    app.navigateTo({
      url: '/pages/mascot/index/index',
      fail: (err) => {
        console.error('跳转吉祥物页失败', err)
        wx.showToast({ title: '跳转失败', icon: 'none' })
      }
    })
  },

  goHome() {
    app.switchTab({
      url: '/pages/index/index',
      fail: (err) => {
        console.error('跳转首页失败', err)
        wx.showToast({ title: '跳转失败', icon: 'none' })
      }
    })
  },

  // 下拉刷新：返回欢迎页
  onPullDownRefresh() {
    wx.stopPullDownRefresh()
    app.reLaunch({
      url: '/pages/welcome/index/index',
      fail: (err) => {
        console.error('跳转欢迎页失败', err)
        wx.showToast({ title: '跳转失败', icon: 'none' })
      }
    })
  }
})