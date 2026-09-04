/**
 * 全局应用入口
 *
 * 职责：
 * 1. 初始化微信云开发环境
 * 2. 封装登录、云存储临时链接获取等全局能力
 * 3. 统一页面跳转与切换动画，保证全应用交互一致
 */

// 云开发环境唯一标识
const CLOUD_ENV_ID = 'cloudbase-d4gsr6mb93c4808e3'

// 页面切换动画时长（毫秒）
const PAGE_TRANSITION_DURATION = 200

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      })
    }
  },

  /**
   * 登录
   *
   * 调用 login 云函数，按用户 openid 查询或自动创建用户，
   * 并将用户信息与「是否新用户」写入全局数据。
   *
   * @param {void} 无参数
   * @returns {Promise<Object>} 云函数返回的 data（含 isNew 与 user 字段）
   */
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

  /**
   * 获取云存储文件的临时下载链接
   *
   * @param {string} fileID 云存储文件唯一标识（cloud:// 前缀）
   * @returns {Promise<string>} 文件临时下载链接
   */
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

  /**
   * 页面跳转（保留当前页，入栈）
   *
   * 统一使用淡入动画，保证全应用切换体验一致。
   *
   * @param {string|Object} options 目标地址字符串或 wx.navigateTo 参数对象
   */
  navigateTo(options) {
    const opts = typeof options === 'string'
      ? { url: options }
      : Object.assign({}, options)
    opts.animationType = 'fade-in'
    opts.animationDuration = PAGE_TRANSITION_DURATION
    wx.navigateTo(opts)
  },

  /**
   * 页面返回（关闭当前页，出栈）
   *
   * 使用与 navigateTo 匹配的淡出动画，形成对称的切换过渡。
   *
   * @param {Object} [options] wx.navigateBack 参数对象（可选）
   */
  navigateBack(options) {
    const opts = Object.assign({}, options)
    opts.animationType = 'fade-out'
    opts.animationDuration = PAGE_TRANSITION_DURATION
    wx.navigateBack(opts)
  },

  /**
   * Tab 页切换
   *
   * 注：微信 tabBar 页面不支持自定义切换动画，此处仅做统一封装以约束入口。
   *
   * @param {string|Object} options 目标 Tab 地址字符串或参数对象
   */
  switchTab(options) {
    const opts = typeof options === 'string' ? { url: options } : options
    wx.switchTab(opts)
  },

  /**
   * 重启式跳转（清空页面栈后进入目标页）
   *
   * 注：与 switchTab 相同，reLaunch 亦不支持自定义切换动画。
   *
   * @param {string|Object} options 目标地址字符串或参数对象
   */
  reLaunch(options) {
    const opts = typeof options === 'string' ? { url: options } : options
    wx.reLaunch(opts)
  },

  globalData: {
    userInfo: null,
    isNew: false,
    assets: {
      background: 'cloud://cloudbase-d4gsr6mb93c4808e3.636c-cloudbase-d4gsr6mb93c4808e3-1474355921/assets/background.jpg'
    }
  }
})
