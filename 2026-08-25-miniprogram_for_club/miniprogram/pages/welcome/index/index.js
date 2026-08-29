const app = getApp()

Page({
  data: {
    bgUrl: '',            // 背景图临时链接
    spriteBg: '',         // 精灵图背景样式（保留原动画）
    touchStartY: 0,
    isNavigating: false
  },

  onLoad() {
    this.fetchBgUrl();
    this.initAnimation();
  },

  onShow() {
    if (this.frameUrls && this.frameUrls.length > 0 && !this.animTimer && !this.data.isNavigating) {
      this.startAnimation();
    }
  },

  onHide() {
    this.stopAnimation();
  },

  onUnload() {
    this.stopAnimation();
    this.frameUrls = null;
  },

  // 获取背景图临时链接
  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => {
      this.setData({ bgUrl: url });
    }).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  // 初始化精灵图动画（假设您保留了之前的精灵图方案，如果已经改为序列帧可忽略此部分并调整）
  initAnimation() {
    const totalFrames = 100;          // 根据实际情况修改
    const fps = 15;
    const frameInterval = 1000 / fps;
    const sheets = 5;
    const cols = 5;
    const rows = 4;
    const framesPerSheet = 20;
    let currentFrame = 0;
    let direction = 1;

    const updateFrame = () => {
      const sheetIndex = Math.floor(currentFrame / framesPerSheet);
      const frameInSheet = currentFrame % framesPerSheet;
      const col = frameInSheet % cols;
      const row = Math.floor(frameInSheet / cols);
      const xPercent = (col / (cols - 1)) * 100;
      const yPercent = (row / (rows - 1)) * 100;
      const bgUrl = `/subpackages/anim${sheetIndex + 1}/sheet_${String(sheetIndex + 1).padStart(2, '0')}.png`;
      this.setData({
        spriteBg: `background-image: url('${bgUrl}'); background-position: ${xPercent}% ${yPercent}%;`
      });
      currentFrame += direction;
      if (currentFrame >= totalFrames) {
        currentFrame = totalFrames - 2;
        direction = -1;
      } else if (currentFrame < 0) {
        currentFrame = 1;
        direction = 1;
      }
    };

    updateFrame();
    this.animTimer = setInterval(updateFrame, frameInterval);
  },

  startAnimation() {
    // 如果已经有定时器则不重复启动
    if (this.animTimer) return;
    this.initAnimation();
  },

  stopAnimation() {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
    }
  },

  // 触摸事件：上滑跳转
  onTouchStart(e) {
    this.setData({ touchStartY: e.touches[0].clientY });
  },

  onTouchEnd(e) {
    const startY = this.data.touchStartY;
    const endY = e.changedTouches[0].clientY;
    const distance = startY - endY;
    if (distance > 80 && !this.data.isNavigating) {
      this.goToMenu();
    }
  },

  goToMenu() {
    this.setData({ isNavigating: true });
    this.stopAnimation();
    wx.navigateTo({
      url: '/pages/menu/index/index',
      fail: (err) => {
        console.error('跳转失败', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
        this.startAnimation();
      },
      complete: () => {
        this.setData({ isNavigating: false });
      }
    });
  },

  // 进入主界面
  enterApp() {
    this.stopAnimation();
    wx.switchTab({ url: '/pages/index/index' });
  }
});