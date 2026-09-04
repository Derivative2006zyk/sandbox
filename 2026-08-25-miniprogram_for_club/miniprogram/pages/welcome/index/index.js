/**
 * 欢迎页（启动页）
 *
 * 职责：
 * 1. 加载开屏背景图与 logo
 * 2. 下载并缓存 101 帧逐帧动画到本地，通过 Canvas 循环播放
 * 3. 通过手势（上滑）进入菜单页，或点击按钮直接进入首页
 */
const app = getApp()

// 社团 logo 在云存储中的文件标识
const LOGO_FILE_ID = 'cloud://cloudbase-d4gsr6mb93c4808e3.636c-cloudbase-d4gsr6mb93c4808e3-1474355921/assets/logo.png'

// 动画帧原始宽高比（720 / 1280），用于按屏幕宽度等比换算显示高度
const FRAME_ASPECT_RATIO = 0.5625
// 画布显示宽度占屏幕宽度的比例
const CANVAS_WIDTH_RATIO = 0.8
// 播放帧率（帧/秒）
const ANIMATION_FPS = 12
// 底部白色遮罩在画布高度上的占比，用于柔化动画下边缘
const MASK_HEIGHT_RATIO = 0.122

Page({
  data: {
    bgUrl: '',
    logoUrl: '',
    loading: true,
    loadProgress: 0,
    loadError: false,
    touchStartY: 0,
    isNavigating: false,
    totalFrames: 101,
    canvas: null,
    ctx: null,
    frameImages: [],
    currentFrame: 0,
    animTimer: null,
    canvasWidth: 280,
    canvasHeight: 500
  },

  onLoad() {
    this.setData({ bgUrl: '/images/background.jpg' })
    this.fetchLogo()
    this.initWelcomePage()
  },

  onShow() {
    // 页面显示时，如果资源已加载且动画未运行，则重新启动动画
    if (this.frameImages && this.frameImages.length > 0 && this.ctx && !this.animTimer) {
      this.startAnimation()
    }
  },

  onHide() {
    this.stopAnimation()
  },

  onUnload() {
    this.stopAnimation()
    this.frameImages = []
  },

  fetchLogo() {
    app.getBgUrl(LOGO_FILE_ID).then(url => {
      this.setData({ logoUrl: url })
    }).catch(err => {
      console.error('获取 logo 失败', err)
    })
  },

  async initWelcomePage() {
    this.setData({ loading: true, loadError: false, loadProgress: 0 })
    try {
      const assets = await this.fetchAssets()
      const { bgUrl, frameUrls } = assets
      this.setData({ bgUrl })

      const cached = await this.getCachedFrames()
      if (cached && cached.length === this.data.totalFrames) {
        console.log('使用缓存帧')
        this.setData({ loading: false, loadProgress: 100 })
        this.initCanvasAndLoadImages(cached)
        return
      }

      const localPaths = await this.downloadFrames(frameUrls)
      this.setData({ loading: false, loadProgress: 100 })
      this.initCanvasAndLoadImages(localPaths)
    } catch (err) {
      console.error('欢迎页资源加载失败', err)
      this.setData({ loading: false, loadError: true })
    }
  },

  fetchAssets() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getWelcomeAssets',
        data: { totalFrames: this.data.totalFrames },
        success: (res) => {
          if (res.result && res.result.code === 0) {
            resolve(res.result.data)
          } else {
            reject(res.result)
          }
        },
        fail: reject
      })
    })
  },

  getCachedFrames() {
    return new Promise((resolve) => {
      const cache = wx.getStorageSync('welcome_frames_cache')
      if (cache && cache.paths && cache.paths.length === this.data.totalFrames) {
        const now = Date.now()
        const expireTime = 24 * 60 * 60 * 1000
        if (now - cache.timestamp < expireTime) {
          const fs = wx.getFileSystemManager()
          try {
            fs.accessSync(cache.paths[0])
            resolve(cache.paths)
            return
          } catch (e) {}
        }
      }
      resolve(null)
    })
  },

  /**
   * 逐帧下载动画到本地并缓存
   *
   * 逐帧下载而非一次性请求，避免同时发起大量网络连接；
   * 下载前先校验本地是否已存在该帧，存在则跳过，实现断点续传式复用。
   *
   * @param {string[]} tempUrls 各帧的临时下载链接
   * @returns {Promise<string[]>} 各帧的本地文件路径
   */
  async downloadFrames(tempUrls) {
    const total = tempUrls.length
    const localPaths = []
    const fs = wx.getFileSystemManager()
    const dirPath = `${wx.env.USER_DATA_PATH}/welcome_frames`
    try { fs.mkdirSync(dirPath, true) } catch (e) {}

    for (let i = 0; i < total; i++) {
      const filePath = `${dirPath}/frame_${String(i + 1).padStart(3, '0')}.png`
      try {
        fs.accessSync(filePath)
        localPaths.push(filePath)
        this.updateProgress(i + 1, total)
        continue
      } catch (e) {}

      try {
        const res = await this.downloadFile(tempUrls[i], filePath)
        localPaths.push(res)
        this.updateProgress(i + 1, total)
      } catch (err) {
        console.error(`下载第${i + 1}帧失败`, err)
        throw err
      }
    }

    wx.setStorageSync('welcome_frames_cache', { paths: localPaths, timestamp: Date.now() })
    return localPaths
  },

  downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: url,
        filePath: filePath,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(filePath)
          } else {
            reject(new Error(`下载失败，状态码${res.statusCode}`))
          }
        },
        fail: reject
      })
    })
  },

  updateProgress(current, total) {
    const percent = Math.floor((current / total) * 100)
    this.setData({ loadProgress: percent })
  },

  retryLoad() {
    this.initWelcomePage()
  },

  /**
   * 初始化 Canvas 并预加载全部帧
   *
   * 按设备像素比（dpr）设置画布物理分辨率，避免高分屏下绘制模糊；
   * 显示尺寸按屏幕宽度与帧原始宽高比换算，保证等比缩放不拉伸。
   *
   * @param {string[]} localPaths 各帧的本地文件路径
   */
  async initCanvasAndLoadImages(localPaths) {
    try {
      const query = wx.createSelectorQuery()
      query.select('#welcomeCanvas').fields({ node: true, size: true }).exec(async (res) => {
        if (!res || !res[0]) {
          console.error('Canvas 节点未找到')
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio

        const systemInfo = wx.getSystemInfoSync()
        const screenWidth = systemInfo.windowWidth
        const targetWidth = screenWidth * CANVAS_WIDTH_RATIO
        const targetHeight = targetWidth / FRAME_ASPECT_RATIO

        this.setData({ canvasWidth: targetWidth, canvasHeight: targetHeight })

        canvas.width = targetWidth * dpr
        canvas.height = targetHeight * dpr
        ctx.scale(dpr, dpr)

        this.canvas = canvas
        this.ctx = ctx

        const frameImages = await this.loadImages(localPaths)
        this.frameImages = frameImages
        this.startAnimation()
      })
    } catch (err) {
      console.error('初始化 Canvas 失败', err)
    }
  },

  loadImages(paths) {
    return new Promise((resolve, reject) => {
      const images = []
      let loaded = 0
      for (let i = 0; i < paths.length; i++) {
        const img = this.canvas.createImage()
        img.onload = () => {
          loaded++
          if (loaded === paths.length) {
            resolve(images)
          }
        }
        img.onerror = (e) => {
          console.error('图片加载失败', paths[i], e)
          loaded++
          if (loaded === paths.length) {
            resolve(images)
          }
        }
        img.src = paths[i]
        images.push(img)
      }
    })
  },

  /**
   * 启动逐帧循环动画
   *
   * 采用「乒乓」播放策略（正序到尾后反向播放），避免循环跳帧的视觉突兀；
   * 每帧在绘制角色后，于底部叠加一道白色渐变遮罩，柔和过渡到页面背景色。
   */
  startAnimation() {
    if (this.animTimer) return
    let currentFrame = 0
    let direction = 1
    const interval = 1000 / ANIMATION_FPS

    const drawFrame = () => {
      if (!this.ctx || !this.frameImages.length) return
      const img = this.frameImages[currentFrame]
      const imgW = img.width || 720
      const imgH = img.height || 1280
      // 等比缩放（contain），保持整帧完整居中显示
      const scale = Math.min(this.data.canvasWidth / imgW, this.data.canvasHeight / imgH)
      const drawW = imgW * scale
      const drawH = imgH * scale
      const x = (this.data.canvasWidth - drawW) / 2
      const y = (this.data.canvasHeight - drawH) / 2
      this.ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight)
      this.ctx.drawImage(img, x, y, drawW, drawH)

      // 底部白色渐变遮罩
      const topY = this.data.canvasHeight * (1 - MASK_HEIGHT_RATIO)
      const gradient = this.ctx.createLinearGradient(0, topY, 0, this.data.canvasHeight)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)')

      this.ctx.beginPath()
      this.ctx.moveTo(0, this.data.canvasHeight)
      this.ctx.lineTo(this.data.canvasWidth, this.data.canvasHeight)
      this.ctx.lineTo(this.data.canvasWidth, topY)
      this.ctx.closePath()
      this.ctx.fillStyle = gradient
      this.ctx.fill()

      // 乒乓方向切换
      currentFrame += direction
      if (currentFrame >= this.frameImages.length - 1) {
        currentFrame = this.frameImages.length - 1
        direction = -1
      } else if (currentFrame <= 0) {
        currentFrame = 0
        direction = 1
      }
    }

    drawFrame()
    this.animTimer = setInterval(drawFrame, interval)
  },

  stopAnimation() {
    if (this.animTimer) {
      clearInterval(this.animTimer)
      this.animTimer = null
    }
  },

  goToAbout() {
    app.navigateTo({
      url: '/pages/about/index/index',
      fail: () => {
        app.reLaunch({ url: '/pages/about/index/index' })
      }
    })
  },

  onTouchStart(e) {
    this.setData({ touchStartY: e.touches[0].clientY })
  },

  onTouchEnd(e) {
    const startY = this.data.touchStartY
    const endY = e.changedTouches[0].clientY
    const distance = startY - endY
    if (distance > 80 && !this.data.isNavigating) {
      this.goToMenu()
    }
  },

  goToMenu() {
    this.setData({ isNavigating: true })
    this.stopAnimation()
    app.navigateTo({
      url: '/pages/menu/index/index',
      fail: () => {
        app.reLaunch({ url: '/pages/menu/index/index' })
      },
      complete: () => {
        this.setData({ isNavigating: false })
      }
    })
  },

  enterApp() {
    this.stopAnimation()
    app.switchTab({ url: '/pages/index/index' })
  }
})