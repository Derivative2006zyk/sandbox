const app = getApp()

Page({
  data: {
    bgUrl: '',
    expanded: false,
    touchStartY: 0
  },

  onLoad() {
    this.fetchBgUrl();
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  onTouchStart(e) {
    this.setData({ touchStartY: e.touches[0].clientY });
  },

  onTouchEnd(e) {
    const startY = this.data.touchStartY;
    const endY = e.changedTouches[0].clientY;
    const distance = startY - endY;

    if (distance > 80) { // 上滑
      if (!this.data.expanded) {
        this.setData({ expanded: true });
      }
    } else if (distance < -80) { // 下滑
      if (this.data.expanded) {
        this.setData({ expanded: false });
      } else {
        this.goBackToMenu();
      }
    }
  },

  goBackToMenu() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/menu/index/index' });
      }
    });
  }
});