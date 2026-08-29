const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
  },

  onLoad() {
    this.fetchBgUrl();
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
        wx.reLaunch({ url: '/pages/index/index' });
      }
    });
  },

  goActivityManage() {
    wx.navigateTo({ url: '/pages/admin/activity-list/index' });
  },

  goFundManage() {
    wx.navigateTo({ url: '/pages/fund/index/index' });
  },

  goNewsManage() {
    wx.navigateTo({ url: '/pages/admin/news-list/index' });
  }
});