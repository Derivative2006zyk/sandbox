const app = getApp()

Page({
  data: {
    bgUrl: '',
    drafts: [],
    loading: false,
    selectedDraft: null   // 当前查看的草案详情
  },

  onLoad() {
    this.fetchBgUrl();
    this.loadDrafts();
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/admin/index/index' }) });
  },

  async loadDrafts() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'getPendingDrafts' });
      if (res.result && res.result.code === 0) {
        this.setData({ drafts: res.result.data, loading: false });
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
        this.setData({ loading: false });
      }
    } catch (err) {
      console.error('加载待审核草案失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 点击草案查看详情
  viewDraftDetail(e) {
    const id = e.currentTarget.dataset.id;
    const draft = this.data.drafts.find(d => d._id === id);
    if (draft) {
      this.setData({ selectedDraft: draft });
    }
  },

  // 关闭详情弹窗
  closeDetail() {
    this.setData({ selectedDraft: null });
  },

  // 阻止冒泡
  noop() {},

  // 批准当前查看的草案
  approveDraft() {
    if (this.data.selectedDraft) {
      this.reviewDraft(this.data.selectedDraft._id, 'approve');
    }
  },

  // 拒绝当前查看的草案
  rejectDraft() {
    if (this.data.selectedDraft) {
      this.reviewDraft(this.data.selectedDraft._id, 'reject');
    }
  },

  // 审核操作
  async reviewDraft(draftId, action) {
    const confirmText = action === 'approve' ? '确定批准该草案？' : '确定拒绝该草案？';
    wx.showModal({
      title: '确认',
      content: confirmText,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'reviewDraft',
              data: { draftId, action }
            });
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: result.result.msg, icon: 'success' });
              this.setData({ selectedDraft: null }); // 关闭弹窗
              this.loadDrafts(); // 刷新列表
            } else {
              wx.showToast({ title: result.result.msg || '操作失败', icon: 'none' });
            }
          } catch (err) {
            console.error('审核失败', err);
            wx.showToast({ title: '网络异常', icon: 'none' });
          }
        }
      }
    });
  }
});