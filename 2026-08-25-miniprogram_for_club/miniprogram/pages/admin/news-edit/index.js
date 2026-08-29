Page({
  data: {
    newsId: '',
    title: '',
    category: 'news',
    content: '',
    date: '',
    image: '',           // 压缩后原图 fileID
    imageThumb: '',      // 缩略图 fileID
    submitting: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ newsId: options.id });
      this.loadNews();
    }
  },

  async loadNews() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getNewsDetail',
        data: { newsId: this.data.newsId }
      });
      if (res.result && res.result.code === 0) {
        const news = res.result.data;
        this.setData({
          title: news.title,
          category: news.category,
          content: news.content,
          date: news.date,
          image: news.image || '',
          imageThumb: news.imageThumb || ''
        });
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  onCategoryChange(e) {
    this.setData({ category: e.detail.value });
  },

  // 检查网络状态
  checkNetwork() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          resolve(res.networkType !== 'none')
        },
        fail: () => {
          resolve(false)
        }
      })
    });
  },

  // 压缩图片（使用 canvas 调整尺寸和品质）
  compressImage(src, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src,
        success: (info) => {
          let { width, height } = info
          if (width > maxWidth) {
            const ratio = maxWidth / width
            width = maxWidth
            height = Math.round(height * ratio)
          }
          const ctx = wx.createCanvasContext('compressCanvasNews', this)
          ctx.clearRect(0, 0, width, height)
          ctx.drawImage(src, 0, 0, width, height)
          ctx.draw(false, () => {
            wx.canvasToTempFilePath({
              canvasId: 'compressCanvasNews',
              x: 0,
              y: 0,
              width: width,
              height: height,
              destWidth: width,
              destHeight: height,
              fileType: 'jpg',
              quality: quality,
              success: (res) => {
                resolve(res.tempFilePath)
              },
              fail: reject
            }, this)
          })
        },
        fail: reject
      })
    })
  },

  // 上传新闻配图（优化版：网络检查 + 压缩 + 缩略图）
  async uploadImage() {
    const hasNetwork = await this.checkNetwork()
    if (!hasNetwork) {
      wx.showToast({ title: '网络不可用，请联网后重试', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '处理中...' })

        try {
          const compressedPath = await this.compressImage(tempFilePath, 1280, 0.8)
          const thumbPath = await this.compressImage(tempFilePath, 300, 0.6)

          wx.showLoading({ title: '上传中...' })
          const imageUpload = await wx.cloud.uploadFile({
            cloudPath: `news-images/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`,
            filePath: compressedPath
          })
          const thumbUpload = await wx.cloud.uploadFile({
            cloudPath: `news-images/thumb/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`,
            filePath: thumbPath
          })

          this.setData({
            image: imageUpload.fileID,
            imageThumb: thumbUpload.fileID
          })

          wx.hideLoading()
          wx.showToast({ title: '上传成功', icon: 'success' })
        } catch (err) {
          wx.hideLoading()
          console.error('图片处理或上传失败', err)
          wx.showToast({ title: '上传失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('选择图片失败', err)
      }
    })
  },

  async submit() {
    const { newsId, title, category, content, date, image, imageThumb } = this.data;
    if (!title.trim() || !content.trim()) {
      wx.showToast({ title: '请填写标题和内容', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      if (newsId) {
        const res = await wx.cloud.callFunction({
          name: 'updateNews',
          data: { newsId, title: title.trim(), category, content: content.trim(), date, image, imageThumb }
        });
        this.handleResult(res);
      } else {
        const res = await wx.cloud.callFunction({
          name: 'createNews',
          data: { title: title.trim(), category, content: content.trim(), date, image, imageThumb }
        });
        this.handleResult(res);
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  handleResult(res) {
    if (res.result && res.result.code === 0) {
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } else {
      wx.showToast({ title: res.result.msg || '操作失败', icon: 'none' });
    }
  }
});