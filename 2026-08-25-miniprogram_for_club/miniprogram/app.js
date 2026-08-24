App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      // TODO: 替换为您的实际云环境ID
      const cloudEnvId = 'cloudbase-d4gsr6mb93c4808e3'
      wx.cloud.init({
        env: cloudEnvId,
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
        fail: err => { console.error('调用 login 云函数失败', err); reject(err) }
      })
    })
  },
  globalData: { userInfo: null, isNew: false }
})