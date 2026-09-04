const app = getApp()

Page({
  data: {
    bgUrl: '',
    drafts: [],
    loading: false,
    selectedDraft: null,
    errorMsg: ''
  },

  onLoad() {
    this.fetchBgUrl()
    this.loadDrafts()
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  goBack() {
    app.navigateBack({ fail: () => app.reLaunch({ url: '/pages/admin/index/index' }) })
  },

  async loadDrafts() {
    this.setData({ loading: true, errorMsg: '' })
    try {
      const res = await wx.cloud.callFunction({ name: 'getPendingDrafts' })
      console.log('getPendingDrafts res:', res)

      if (res.result && res.result.code === 0) {
        // 确保 data 是数组
        const drafts = Array.isArray(res.result.data) ? res.result.data : []
        this.setData({ drafts, loading: false, errorMsg: drafts.length === 0 ? '暂无待审核草案' : '' })
      } else {
        this.setData({ loading: false, errorMsg: res.result.msg || '加载失败' })
      }
    } catch (err) {
      console.error('加载待审核草案异常', err)
      this.setData({ loading: false, errorMsg: '网络异常，请重试' })
    }
  },

  viewDraftDetail(e) {
    const id = e.currentTarget.dataset.id
    const draft = this.data.drafts.find(d => d._id === id)
    if (draft) {
      this.setData({ selectedDraft: draft })
    }
  },

  closeDetail() {
    this.setData({ selectedDraft: null })
  },

  noop() {},

  approveDraft() {
    if (this.data.selectedDraft) {
      this.reviewDraft(this.data.selectedDraft._id, 'approve')
    }
  },

  rejectDraft() {
    if (this.data.selectedDraft) {
      this.reviewDraft(this.data.selectedDraft._id, 'reject')
    }
  },

  async reviewDraft(draftId, action) {
    const confirmText = action === 'approve' ? '确定批准该草案？' : '确定拒绝该草案？'
    wx.showModal({
      title: '确认',
      content: confirmText,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'reviewDraft',
              data: { draftId, action }
            })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: result.result.msg, icon: 'success' })
              this.setData({ selectedDraft: null })
              this.loadDrafts()
            } else {
              wx.showToast({ title: result.result.msg || '操作失败', icon: 'none' })
            }
          } catch (err) {
            console.error('审核失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      }
    })
  }
})