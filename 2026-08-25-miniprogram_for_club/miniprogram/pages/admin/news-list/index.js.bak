Page({
  data: {
    newsList: [],
    loading: false
  },

  onLoad() {
    this.loadNews();
  },

  onShow() {
    if (this.data._loaded) {
      this.loadNews();
    }
  },

  async loadNews() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getAllNews'
      });
      if (res.result && res.result.code === 0) {
        this.setData({
          newsList: res.result.data,
          loading: false,
          _loaded: true
        });
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载新闻列表失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 新建新闻
  createNews() {
    wx.navigateTo({ url: '/pages/admin/news-edit/index' });
  },

  // 编辑新闻
  editNews(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/admin/news-edit/index?id=${id}` });
  },

  // 删除新闻
  deleteNews(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteNews',
              data: { newsId: id }
            });
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.loadNews();
            } else {
              wx.showToast({ title: result.result.msg || '删除失败', icon: 'none' });
            }
          } catch (err) {
            wx.showToast({ title: '网络异常', icon: 'none' });
          }
        }
      }
    });
  }
});