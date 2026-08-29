const app = getApp()

Page({
  data: {
    userInfo: null,
    loading: false,
    listLoading: false,
    activityList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    refreshing: false
  },

  onLoad() {
    this.checkLogin();
    this.loadActivities(true);
  },

  onShow() {
    // 确保从其他页面返回时页面正常
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pages/activity/detail/index?id=${id}`
      });
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
      this.setData({ loading: false });
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
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
        this.setData({
          activityList: reset ? list : this.data.activityList.concat(list),
          page: page + 1,
          hasMore,
          listLoading: false,
          refreshing: false
        });
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
    wx.navigateTo({
      url: '/pages/menu/index/index',
      fail: () => {
        wx.showToast({ title: '菜单页打开失败', icon: 'none' });
      }
    });
  }
});