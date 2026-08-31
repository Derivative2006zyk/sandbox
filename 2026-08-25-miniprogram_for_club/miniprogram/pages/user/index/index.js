const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
    userInfo: null
  },

  onLoad() {
    this.fetchBgUrl();
  },

  onShow() {
    this.setData({ userInfo: app.globalData.userInfo });
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

  goMySignups() {
    wx.navigateTo({ url: '/pages/user/signups/index' });
  },

  goFund() {
    wx.navigateTo({ url: '/pages/fund/index/index' });
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/index/index' });
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/user/edit-profile/index' });
  },
  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/index' });
  }
});