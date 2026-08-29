App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloudbase-d4gsr6mb93c4808e3',
        traceUser: true
      })
    }
  },

  login() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login',
        success: res => {
          if (res.result && res.result.code === 0) {
            this.globalData.userInfo = res.result.data.user
            this.globalData.isNew = res.result.data.isNew
            resolve(res.result.data)
          } else {
            reject(res.result)
          }
        },
        fail: err => {
          console.error('调用 login 云函数失败', err)
          reject(err)
        }
      })
    })
  },

  // 获取云存储背景图临时链接（通过云函数）
getBgUrl(fileID) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getBgUrl',
      data: { fileID },
      success: res => {
        if (res.result && res.result.code === 0) {
          resolve(res.result.data.url)
        } else {
          reject(res.result.msg || '获取失败')
        }
      },
      fail: err => reject(err)
    })
  })
},

  navigateTo(options) {
    if (typeof options === 'string') {
      options = { url: options }
    }
    options.animationType = 'fade-in'
    options.animationDuration = 200
    wx.navigateTo(options)
  },

  switchTab(options) {
    if (typeof options === 'string') {
      options = { url: options }
    }
    options.animationType = 'fade-in'
    options.animationDuration = 200
    wx.switchTab(options)
  },

  globalData: {
    userInfo: null,
    isNew: false,
    assets: {
      background: 'cloud://cloudbase-d4gsr6mb93c4808e3.636c-cloudbase-d4gsr6mb93c4808e3-1474355921/assets/background.jpg'
    }
  }
})