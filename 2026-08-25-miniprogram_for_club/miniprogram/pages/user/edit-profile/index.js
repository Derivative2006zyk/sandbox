const app = getApp()

Page({
  data: {
    name: '',
    studentId: '',
    phone: '',
    submitting: false
  },
  onLoad() {
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
    const { name, studentId, phone } = this.data
    if (!name.trim()) { wx.showToast({ title: '请输入姓名', icon: 'none' }); return }
    if (!studentId.trim()) { wx.showToast({ title: '请输入学号', icon: 'none' }); return }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) { wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return }
    this.setData({ submitting: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateUser',
        data: { name: name.trim(), studentId: studentId.trim(), phone: phone.trim() }
      })
      if (res.result && res.result.code === 0) {
        app.globalData.userInfo = res.result.data.user
        app.globalData.isNew = false
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack({
            fail: () => { wx.switchTab({ url: '/pages/index/index' }) }
          })
        }, 1000)
      } else {
        wx.showToast({ title: res.result.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error('更新用户信息失败', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})