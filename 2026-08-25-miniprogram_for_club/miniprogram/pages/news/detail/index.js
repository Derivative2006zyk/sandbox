Page({
  data: {
    newsId: '',
    news: null,
    loading: true
  },

  onLoad(options) {
    const newsId = options.id;
    if (!newsId) {
      wx.showToast({ title: '缺少新闻ID', icon: 'none' });
      return;
    }
    this.setData({ newsId });
    this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getNewsDetail',
        data: { newsId: this.data.newsId }
      });
      if (res.result && res.result.code === 0) {
        this.setData({
          news: res.result.data,
          loading: false
        });
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('获取新闻详情失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});