const app = getApp()

Page({
  data: {
    activityId: '',
    name: '',
    studentId: '',
    phone: '',
    submitting: false
  },

  onLoad(options) {
    const activityId = options.activityId
    if (!activityId) {
      wx.showToast({ title: '缺少活动参数', icon: 'none' })
      return
    }
    this.setData({ activityId })

    // 自动填充用户资料
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        name: userInfo.name || '',
        studentId: userInfo.studentId || '',
        phone: userInfo.phone || ''
      })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  async submit() {
    const { name, studentId, phone, activityId } = this.data
    if (!name.trim()) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return }
    if (!studentId.trim()) { wx.showToast({ title: '请输入学号', icon: 'none' }); return }
    if (!/^1\d{10}$/.test(phone.trim())) { wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return }

    this.setData({ submitting: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'signup',
        data: {
          activityId,
          formData: {
            name: name.trim(),
            studentId: studentId.trim(),
            phone: phone.trim()
          }
        }
      })
      console.log('报名云函数返回结果：', res)
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '报名成功', icon: 'success' })
        setTimeout(() => {
          // 返回上一页（详情页），并让详情页刷新
          const pages = getCurrentPages()
          const prevPage = pages[pages.length - 2]
          if (prevPage) {
            prevPage.loadDetail() // 调用详情页的刷新方法
          }
          wx.navigateBack()
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