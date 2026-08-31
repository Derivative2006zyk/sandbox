const app = getApp()

Page({
  data: {
    bgUrl: '',
    userInfo: null,
    loading: false,
    listLoading: false,
    activityList: [],        // 原始列表
    filteredList: [],        // 过滤后的列表
    keyword: '',             // 搜索关键词
    page: 1,
    pageSize: 10,
    hasMore: true,
    refreshing: false
  },

  onLoad() {
    this.fetchBgUrl();
    this.checkLogin();
    this.loadActivities(true);
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: `/pages/activity/detail/index?id=${id}` });
    }
  },

  async checkLogin() {
    try {
      const data = await app.login();
      if (data.isNew) {
        wx.navigateTo({ url: '/pages/user/edit-profile/index' });
      } else {
        this.setData({ userInfo: data.user, loading: false });
      }
    } catch (err) {
      console.error('登录检查失败', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 搜索输入事件
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ keyword });
    this.filterActivities();
  },

  // 根据关键词过滤活动
  filterActivities() {
    const keyword = this.data.keyword.toLowerCase();
    const filteredList = this.data.activityList.filter(item => {
      const title = (item.title || '').toLowerCase();
      const location = (item.location || '').toLowerCase();
      return title.includes(keyword) || location.includes(keyword);
    });
    this.setData({ filteredList });
  },

  async loadActivities(reset = false) {
    if (this.data.listLoading) return;
    this.setData({ listLoading: true });

    const page = reset ? 1 : this.data.page;
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityList',
        data: { page, pageSize: this.data.pageSize }
      });

      if (res.result && res.result.code === 0) {
        const { list, hasMore } = res.result.data;
        const newList = reset ? list : this.data.activityList.concat(list);
        this.setData({
          activityList: newList,
          page: page + 1,
          hasMore,
          listLoading: false,
          refreshing: false
        });
        this.filterActivities(); // 应用过滤
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('获取活动列表失败', err);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    } finally {
      this.setData({ listLoading: false, refreshing: false });
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadActivities(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.listLoading) {
      this.loadActivities(false);
    }
  },

  goBackToMenu() {
    wx.navigateTo({ url: '/pages/menu/index/index' });
  }
});