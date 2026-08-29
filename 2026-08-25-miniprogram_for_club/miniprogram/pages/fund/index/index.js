const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
    currentBalance: 0,
    records: [],
    loading: false,
    isAdmin: false,
    showForm: false,
    amount: '',
    note: '',
    submitting: false
  },

  onLoad() {
    this.fetchBgUrl();
    const userInfo = app.globalData.userInfo;
    this.setData({ isAdmin: userInfo && userInfo.role === 1 });
    this.loadFundInfo();
  },

  onShow() {
    if (this.data._loaded) {
      this.loadFundInfo();
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
        wx.reLaunch({ url: '/pages/index/index' });
      }
    });
  },

  async loadFundInfo() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'getFundInfo' });
      if (res.result && res.result.code === 0) {
        this.setData({
          currentBalance: res.result.data.currentBalance,
          records: res.result.data.records,
          loading: false,
          _loaded: true
        });
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('获取社费信息失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  toggleForm() {
    this.setData({ showForm: !this.data.showForm });
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  async submitUpdate() {
    const amount = parseFloat(this.data.amount);
    const note = this.data.note.trim();

    if (isNaN(amount) || amount === 0) {
      wx.showToast({ title: '请输入有效的金额（正负均可）', icon: 'none' });
      return;
    }
    if (!note) {
      wx.showToast({ title: '请填写备注', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateFund',
        data: { amount, note }
      });
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '更新成功', icon: 'success' });
        this.setData({ showForm: false, amount: '', note: '' });
        this.loadFundInfo();
      } else {
        wx.showToast({ title: res.result.msg || '更新失败', icon: 'none' });
      }
    } catch (err) {
      console.error('更新社费失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});