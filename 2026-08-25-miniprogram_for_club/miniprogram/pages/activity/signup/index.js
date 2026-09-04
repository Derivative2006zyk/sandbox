const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
    activityId: '',
    name: '',
    studentId: '',
    phone: '',
    submitting: false
  },

  onLoad(options) {
    this.fetchBgUrl()
    const activityId = options.activityId
    if (!activityId) {
      wx.showToast({ title: '缺少活动参数', icon: 'none' })
      return
    }
    this.setData({ activityId })

    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        name: userInfo.name || '',
        studentId: userInfo.studentId || '',
        phone: userInfo.phone || ''
      })
    }
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => {
      this.setData({ bgUrl: url })
    }).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  async submit() {
    const { name, studentId, phone, activityId } = this.data
    if (!name.trim()) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return; }
    if (!studentId.trim()) { wx.showToast({ title: '请输入学号', icon: 'none' }); return; }
    if (!/^1\d{10}$/.test(phone.trim())) { wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return; }

    this.setData({ submitting: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'signup',
        data: {
          activityId,
          formData: { name: name.trim(), studentId: studentId.trim(), phone: phone.trim() }
        }
      })
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '报名成功', icon: 'success' })
        setTimeout(() => {
          const pages = getCurrentPages()
          const prevPage = pages[pages.length - 2]
          if (prevPage) prevPage.loadDetail()
          app.navigateBack()
        }, 1000)
      } else {
        wx.showToast({ title: res.result.msg || '报名失败', icon: 'none' })
      }
    } catch (err) {
      console.error('报名失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})