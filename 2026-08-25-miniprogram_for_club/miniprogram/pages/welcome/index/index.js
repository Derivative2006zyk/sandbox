Page({
  data: {
    spriteBg: '',
    touchStartY: 0
  },

  onLoad() {},

  onReady() {
    this.initAnimation();
  },

  onShow() {
    // 如果动画状态存在但定时器已停止，则重新启动动画
    if (this.animationState && !this.animTimer) {
      this.startAnimation();
    }
  },

  onHide() {
    this.stopAnimation();
  },

  onUnload() {
    this.stopAnimation();
    this.animationState = null;
  },

  // 初始化动画状态并启动
  initAnimation() {
    if (!this.animationState) {
      this.animationState = {
        currentFrame: 0,
        direction: 1,
        totalFrames: 100,
        fps: 15,
        sheets: 5,
        cols: 5,
        rows: 4,
        framesPerSheet: 20
      };
    }
    this.startAnimation();
  },

  // 启动动画（若未运行）
  startAnimation() {
    if (this.animTimer) return;

    const state = this.animationState;
    const frameInterval = 1000 / state.fps;

    const updateFrame = () => {
      // 防御：定时器被清除后不再执行
      if (!this.animTimer) return;

      const sheetIndex = Math.floor(state.currentFrame / state.framesPerSheet);
      const frameInSheet = state.currentFrame % state.framesPerSheet;
      const col = frameInSheet % state.cols;
      const row = Math.floor(frameInSheet / state.cols);

      const xPercent = (col / (state.cols - 1)) * 100;
      const yPercent = (row / (state.rows - 1)) * 100;

      const bgUrl = `/subpackages/anim${sheetIndex + 1}/sheet_${String(sheetIndex + 1).padStart(2, '0')}.png`;

      this.setData({
        spriteBg: `background-image: url('${bgUrl}'); background-position: ${xPercent}% ${yPercent}%;`
      });

      // 乒乓循环
      state.currentFrame += state.direction;
      if (state.currentFrame >= state.totalFrames) {
        state.currentFrame = state.totalFrames - 2;
        state.direction = -1;
      } else if (state.currentFrame < 0) {
        state.currentFrame = 1;
        state.direction = 1;
      }
    };

    // 立即渲染第一帧
    updateFrame();

    // 设置定时器
    this.animTimer = setInterval(updateFrame, frameInterval);
  },

  // 停止动画
  stopAnimation() {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
      // 清空背景样式，释放渲染层
      this.setData({ spriteBg: '' });
    }
  },

  // 触摸开始
  onTouchStart(e) {
    this.setData({ touchStartY: e.touches[0].clientY });
  },

  // 触摸结束：上滑判断
  onTouchEnd(e) {
    const startY = this.data.touchStartY;
    const endY = e.changedTouches[0].clientY;
    const distance = startY - endY;

    if (distance > 80) {
      this.goToNextPage();
    }
  },

  // 跳转到下一个页面（占位页）
  goToNextPage() {
    // 防止短时间内重复触发
    if (this.isNavigating) return;
    this.isNavigating = true;

    // 停止动画，避免跳转时资源占用
    this.stopAnimation();

    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/menu/index/index',
        fail: () => {
          wx.showToast({ title: '页面开发中', icon: 'none' });
        },
        complete: () => {
          this.isNavigating = false;
        }
      });
    }, 300);
  },

  // 进入主界面（按钮点击）
  enterApp() {
    this.stopAnimation();
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});