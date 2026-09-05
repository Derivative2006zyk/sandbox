const app = getApp()

Page({
  data: {
    bgUrl: '',
    newsId: '',
    news: null,
    loading: true
  },

  onLoad(options) {
    this.setData({ bgUrl: '/images/background.jpg' })

    const newsId = options.id
    if (!newsId) {
      wx.showToast({ title: '缺少新闻ID', icon: 'none' })
      return
    }
    this.setData({ newsId })
    this.fetchBgUrl()
    this.loadDetail()
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('获取背景图超时')), 3000)
    })
    Promise.race([app.getBgUrl(fileID), timeout])
      .then(url => this.setData({ bgUrl: url }))
      .catch(err => {
        console.warn('背景图获取失败，使用本地占位', err)
        this.setData({ bgUrl: '/images/background.jpg' })
      })
  },

  goBack() {
    app.navigateBack({
      fail: () => {
        app.reLaunch({ url: '/pages/index/index' })
      }
    })
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时')), 8000)
      })
      const callPromise = wx.cloud.callFunction({
        name: 'getNewsDetail',
        data: { newsId: this.data.newsId }
      })
      const res = await Promise.race([callPromise, timeoutPromise])

      if (res.result && res.result.code === 0) {
        this.setData({
          news: res.result.data,
          loading: false
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('获取新闻详情失败', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
      this.setData({ loading: false })
    }
  }
})