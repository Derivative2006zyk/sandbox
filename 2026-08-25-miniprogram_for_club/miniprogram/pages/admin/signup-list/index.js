const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
    activityId: '',
    list: [],
    loading: false
  },

  onLoad(options) {
    this.fetchBgUrl();
    const activityId = options.id;
    if (activityId) {
      this.setData({ activityId });
      this.loadList();
    } else {
      wx.showToast({ title: '缺少活动ID', icon: 'none' });
    }
  },

  // 获取背景图临时链接
  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => {
      this.setData({ bgUrl: url });
    }).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/admin/activity-list/index' });
      }
    });
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getSignupList',
        data: { activityId: this.data.activityId }
      });
      if (res.result && res.result.code === 0) {
        this.setData({ list: res.result.data.list, loading: false });
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载报名名单失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});