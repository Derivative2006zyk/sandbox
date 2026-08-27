const app = getApp()

Page({
  data: {
    currentBalance: 0,
    records: [],
    loading: false,
    isAdmin: false,        // 是否为管理员
    showForm: false,       // 是否显示修改表单
    amount: '',            // 修改金额（字符串）
    note: '',              // 备注
    submitting: false
  },

  onLoad() {
    // 判断管理员
    const userInfo = app.globalData.userInfo
    this.setData({ isAdmin: userInfo && userInfo.role === 1 })
    this.loadFundInfo()
  },

  onShow() {
    // 如果已加载过，从其他页面返回时刷新
    if (this.data._loaded) {
      this.loadFundInfo()
    }
  },

  // 加载社费信息
  async loadFundInfo() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getFundInfo'
      })
      if (res.result && res.result.code === 0) {
        this.setData({
          currentBalance: res.result.data.currentBalance,
          records: res.result.data.records,
          loading: false,
          _loaded: true
        })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取社费信息失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 切换显示修改表单
  toggleForm() {
    this.setData({ showForm: !this.data.showForm })
  },

  // 输入金额
  onAmountInput(e) {
    this.setData({ amount: e.detail.value })
  },

  // 输入备注
  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  // 提交修改
  async submitUpdate() {
    const amount = parseFloat(this.data.amount)
    const note = this.data.note.trim()

    if (isNaN(amount) || amount === 0) {
      wx.showToast({ title: '请输入有效的金额（正负均可）', icon: 'none' })
      return
    }
    if (!note) {
      wx.showToast({ title: '请填写备注', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateFund',
        data: {
          amount,
          note
        }
      })
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '更新成功', icon: 'success' })
        this.setData({ showForm: false, amount: '', note: '' })
        this.loadFundInfo()  // 刷新
      } else {
        wx.showToast({ title: res.result.msg || '更新失败', icon: 'none' })
      }
    } catch (err) {
      console.error('更新社费失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})