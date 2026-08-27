Page({
  data: {
    newsId: '',
    title: '',
    category: 'news',   // 默认新闻
    content: '',
    date: '',
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ newsId: options.id });
      this.loadNews();
    }
  },

  async loadNews() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getNewsDetail',
        data: { newsId: this.data.newsId }
      });
      if (res.result && res.result.code === 0) {
        const news = res.result.data;
        this.setData({
          title: news.title,
          category: news.category,
          content: news.content,
          date: news.date
        });
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  onCategoryChange(e) {
    this.setData({ category: e.detail.value });
  },

  async submit() {
    const { newsId, title, category, content, date } = this.data;
    if (!title.trim() || !content.trim()) {
      wx.showToast({ title: '请填写标题和内容', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      if (newsId) {
        // 编辑
        const res = await wx.cloud.callFunction({
          name: 'updateNews',
          data: { newsId, title: title.trim(), category, content: content.trim(), date }
        });
        this.handleResult(res);
      } else {
        // 新建
        const res = await wx.cloud.callFunction({
          name: 'createNews',
          data: { title: title.trim(), category, content: content.trim(), date }
        });
        this.handleResult(res);
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  handleResult(res) {
    if (res.result && res.result.code === 0) {
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } else {
      wx.showToast({ title: res.result.msg || '操作失败', icon: 'none' });
    }
  }
});