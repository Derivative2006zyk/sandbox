const app = getApp()

Page({
  data: {
    bgUrl: '',
    nickname: '',
    bio: '',
    submitting: false
  },

  onLoad() {
    this.fetchBgUrl()
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        nickname: userInfo.nickname || '',
        bio: userInfo.bio || ''
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
    const { nickname, bio } = this.data
    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'updateUser',
        data: {
          nickname: nickname.trim(),
          bio: bio.trim()
        }
      })

      if (res.result && res.result.code === 0) {
        app.globalData.userInfo = res.result.data.user
        app.globalData.isNew = false

        wx.showToast({ title: '保存成功', icon: 'success' })

        setTimeout(() => {
          app.navigateBack({
            fail: () => {
              app.switchTab({ url: '/pages/index/index' })
            }
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