const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
    banners: [],          // 轮播图数据
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
    hasMore: true,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    this.fetchBgUrl();
    this.loadBanners();
    this.loadData('latest', true);
  },

  // 获取背景图临时链接
  fetchBgUrl() {
    const fileID = app.globalData.assets.background;   // 使用 app.js 中定义的背景图 fileID
    app.getBgUrl(fileID)
      .then(url => this.setData({ bgUrl: url }))
      .catch(err => {
        console.error('获取背景图失败', err);
        this.setData({ bgUrl: '/images/background.jpg' });   // 本地占位
      });
  },

  // 加载轮播图
  async loadBanners() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getBanners' });
      if (res.result && res.result.code === 0) {
        this.setData({ banners: res.result.data });
      }
    } catch (err) {
      console.error('获取轮播图失败', err);
      this.setData({ banners: [] });
    }
  },

  // 切换分类标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;
    this.setData({ currentTab: tab });
    this.loadData(tab, true);
  },

  // 统一数据加载入口
  async loadData(category, reset = false) {
    if (this.data.newsLoading) return;
    this.setData({ newsLoading: true });

    const page = reset ? 1 : this.data.page;

    try {
      if (category === 'activity') {
        const res = await wx.cloud.callFunction({
          name: 'getActivityList',
          data: { page, pageSize: this.data.pageSize }
        });

        if (res.result && res.result.code === 0) {
          const activities = res.result.data.list;
          const processedList = activities.map(item => ({
            _id: item._id,
            title: item.title,
            date: this.formatDate(item.startTime),
            tag: '活动',
            tagClass: 'activity',
            activityId: item._id,
            imageThumb: item.coverThumb || item.cover || ''
          }));
          this.updateList(processedList, res.result.data.hasMore, reset);
        } else {
          this.showError(res.result.msg || '加载失败');
          this.setData({ filteredNews: [] });
        }
      } else {
        const res = await wx.cloud.callFunction({
          name: 'getNewsList',
          data: { category, page, pageSize: this.data.pageSize }
        });

        if (res.result && res.result.code === 0) {
          const newsList = res.result.data.list;
          const processedList = newsList.map(item => ({
            _id: item._id,
            title: item.title,
            date: item.date || this.formatDate(item.createTime),
            tag: item.tag || item.category,
            tagClass: item.category === 'activity' ? 'activity' : 'news',
            imageThumb: item.imageThumb || item.image || ''
          }));
          this.updateList(processedList, res.result.data.hasMore, reset);
        } else {
          this.showError(res.result.msg || '加载失败');
          this.setData({ filteredNews: [] });
        }
      }
    } catch (err) {
      console.error('数据加载失败', err);
      this.showError('网络异常，请重试');
      this.setData({ filteredNews: [] });
    } finally {
      this.setData({ newsLoading: false });
    }
  },

  updateList(newList, hasMore, reset) {
    this.setData({
      filteredNews: reset ? newList : this.data.filteredNews.concat(newList),
      page: this.data.page + 1,
      hasMore,
      newsLoading: false
    });
  },

  showError(msg) {
    wx.showToast({ title: msg, icon: 'none' });
  },

  formatDate(dateObj) {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return String(dateObj);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  },

  onItemTap(e) {
    const { id, type } = e.currentTarget.dataset;
    if (type === 'activity' && id) {
      wx.navigateTo({ url: `/pages/activity/detail/index?id=${id}` });
    } else if (type === 'news' && id) {
      wx.navigateTo({ url: `/pages/news/detail/index?id=${id}` });
    } else {
      wx.showToast({ title: '详情页开发中', icon: 'none' });
    }
  },

  onSwiperChange(e) {
    this.setData({ current: e.detail.current });
  },

  prevBanner() {
    let index = this.data.current - 1;
    if (index < 0) index = this.data.banners.length - 1;
    this.setData({ current: index });
  },

  nextBanner() {
    let index = this.data.current + 1;
    if (index >= this.data.banners.length) index = 0;
    this.setData({ current: index });
  },

  // 更多按钮：跳转首页
  goHome() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: (err) => {
        console.error('跳转首页失败', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },

  // 下拉刷新：返回欢迎页
  onPullDownRefresh() {
    wx.stopPullDownRefresh();
    wx.reLaunch({
      url: '/pages/welcome/index/index',
      fail: (err) => {
        console.error('跳转欢迎页失败', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  }
});