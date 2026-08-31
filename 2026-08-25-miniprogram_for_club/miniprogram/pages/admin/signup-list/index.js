const app = getApp()

Page({
  data: {
    bgUrl: '',
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

  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
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
  },

  async exportCSV() {
    wx.showLoading({ title: '生成中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'exportSignups',
        data: { activityId: this.data.activityId }
      });
      wx.hideLoading();
      if (res.result && res.result.code === 0) {
        const { downloadUrl, fileName } = res.result.data;
        wx.downloadFile({
          url: downloadUrl,
          success: (downloadRes) => {
            if (downloadRes.statusCode === 200) {
              // 保存文件到本地
              wx.saveFile({
                tempFilePath: downloadRes.tempFilePath,
                success: (saveRes) => {
                  wx.showToast({ title: '文件已保存', icon: 'success' });
                  console.log('文件保存路径:', saveRes.savedFilePath);
                },
                fail: (err) => {
                  console.error('保存文件失败', err);
                  wx.showToast({ title: '保存失败', icon: 'none' });
                }
              });
            } else {
              wx.showToast({ title: '下载失败', icon: 'none' });
            }
          },
          fail: (err) => {
            console.error('下载失败', err);
            wx.showToast({ title: '下载失败', icon: 'none' });
          }
        });
      } else {
        wx.showToast({ title: res.result.msg || '导出失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('导出CSV失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  }
});