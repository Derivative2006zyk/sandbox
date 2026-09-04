const app = getApp()

Page({
  data: {
    bgUrl: '',
    activityId: '',
    activity: null,
    isSignedUp: false,
    loading: true,
    submitting: false,
    comments: [],
    commentText: '',
    commentImage: '',            // 图片 fileID 或本地临时路径
    commentImagePreview: '',     // 用于预览的临时链接
    uploadOrigin: false,
    myOpenid: '',
    editingCommentId: '',
    uploadVisible: false,
    uploadProgress: 0,
    showEmojiPanel: false,
    emojiList: []               // 表情列表，每个元素含 fileID 和 imageUrl
  },

  onLoad(options) {
    const activityId = options.id
    if (!activityId) {
      wx.showToast({ title: '缺少活动参数', icon: 'none' })
      return
    }
    this.setData({ activityId })
    this.fetchBgUrl()
    this.initMyOpenid()
    this.loadDetail()
    this.loadEmojiList()
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  async initMyOpenid() {
    try {
      if (app.globalData.userInfo && app.globalData.userInfo._openid) {
        this.setData({ myOpenid: app.globalData.userInfo._openid })
      } else {
        const data = await app.login()
        this.setData({ myOpenid: data.user._openid })
      }
    } catch (err) {
      console.error('获取用户openid失败', err)
    }
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityDetail',
        data: { activityId: this.data.activityId }
      })
      if (res.result && res.result.code === 0) {
        this.setData({
          activity: res.result.data.activity,
          isSignedUp: res.result.data.isSignedUp,
          loading: false
        })
        this.loadComments()
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('获取活动详情失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadComments() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityComments',
        data: { activityId: this.data.activityId }
      })
      if (res.result && res.result.code === 0) {
        const comments = res.result.data.map(comment => ({
          ...comment,
          timeText: this.formatCommentTime(comment.createTime)
        }))
        this.setData({ comments })
      } else {
        console.error('加载评论失败', res.result)
        wx.showToast({ title: '评论加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('加载评论异常', err)
    }
  },

  // 加载表情列表
  async loadEmojiList() {
    try {
      const res = await wx.cloud.callFunction({ name: 'getEmojiList' })
      if (res.result && res.result.code === 0) {
        this.setData({ emojiList: res.result.data })
      } else {
        this.setData({ emojiList: [] })
      }
    } catch (err) {
      console.error('加载表情失败', err)
      this.setData({ emojiList: [] })
    }
  },

  formatCommentTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return String(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) return '刚刚'
    if (diff < hour) return Math.floor(diff / minute) + '分钟前'
    if (diff < day) return Math.floor(diff / hour) + '小时前'
    if (diff < 7 * day) return Math.floor(diff / day) + '天前'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayNum = String(date.getDate()).padStart(2, '0')
    const hourNum = String(date.getHours()).padStart(2, '0')
    const minuteNum = String(date.getMinutes()).padStart(2, '0')
    if (year === now.getFullYear()) {
      return `${month}-${dayNum} ${hourNum}:${minuteNum}`
    }
    return `${year}-${month}-${dayNum} ${hourNum}:${minuteNum}`
  },

  goBack() {
    app.navigateBack({ fail: () => app.reLaunch({ url: '/pages/index/index' }) })
  },

  goSignup() {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.name || !userInfo.studentId || !userInfo.phone) {
      wx.showModal({
        title: '提示',
        content: '请先完善个人资料',
        confirmText: '去完善',
        success: (res) => { if (res.confirm) app.navigateTo({ url: '/pages/user/edit-profile/index' }) }
      })
      return
    }
    app.navigateTo({ url: `/pages/activity/signup/index?activityId=${this.data.activityId}` })
  },

  cancelSignup() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ submitting: true })
          try {
            const result = await wx.cloud.callFunction({
              name: 'cancelSignup',
              data: { activityId: this.data.activityId }
            })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已取消', icon: 'success' })
              this.loadDetail()
            } else {
              wx.showToast({ title: result.result.msg || '取消失败', icon: 'none' })
            }
          } catch (err) {
            console.error('取消报名失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          } finally {
            this.setData({ submitting: false })
          }
        }
      }
    })
  },

  toggleOrigin(e) { this.setData({ uploadOrigin: e.detail.value }) },
  onCommentInput(e) { this.setData({ commentText: e.detail.value }) },

  // 切换表情面板
  toggleEmojiPanel() {
    this.setData({ showEmojiPanel: !this.data.showEmojiPanel })
  },

  // 选择表情
  selectEmoji(e) {
    const fileID = e.currentTarget.dataset.fileid
    const url = e.currentTarget.dataset.url
    this.setData({
      commentImage: fileID,
      commentImagePreview: url,
      showEmojiPanel: false
    })
  },

  // 上传表情
  uploadEmoji() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        const size = res.tempFiles[0].size || 0
        if (size > 5 * 1024 * 1024) { // 限制5MB
          wx.showToast({ title: '表情图片不能超过5MB', icon: 'none' })
          return
        }
        wx.showLoading({ title: '上传中...' })
        try {
          const cloudPath = `emoji/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`
          const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempFilePath })
          const fileID = uploadRes.fileID
          // 调用云函数保存记录
          const saveRes = await wx.cloud.callFunction({
            name: 'uploadEmoji',
            data: { imageFileID: fileID }
          })
          wx.hideLoading()
          if (saveRes.result && saveRes.result.code === 0) {
            wx.showToast({ title: '表情上传成功', icon: 'success' })
            this.loadEmojiList() // 刷新表情列表
          } else {
            wx.showToast({ title: saveRes.result.msg || '保存失败', icon: 'none' })
          }
        } catch (err) {
          wx.hideLoading()
          console.error('上传表情失败', err)
          wx.showToast({ title: '上传失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('选择图片失败', err)
        wx.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  },

  // 选择普通评论图片
  chooseCommentImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        const size = res.tempFiles[0].size || 0
        if (size > 10 * 1024 * 1024) {
          wx.showToast({ title: '图片不能超过10MB', icon: 'none' })
          return
        }
        this.setData({ commentImage: tempFilePath, commentImagePreview: tempFilePath })
      },
      fail: (err) => {
        console.error('选择图片失败', err)
        wx.showToast({ title: '选择图片失败', icon: 'none' })
      }
    })
  },

  removeCommentImage() {
    this.setData({ commentImage: '', commentImagePreview: '' })
  },

  // 压缩图片
  async compressImage(src, maxWidth, quality) {
    return new Promise((resolve) => {
      wx.compressImage({
        src: src,
        quality: quality || 80,
        compressedWidth: maxWidth,
        success: (res) => resolve(res.tempFilePath),
        fail: (err) => {
          console.warn('wx.compressImage 失败，使用原图', err)
          resolve(src)
        }
      })
    })
  },

  // 上传文件
  async uploadFileWithProgress(cloudPath, filePath) {
    this.setData({ uploadVisible: true, uploadProgress: 0 })
    try {
      const res = await wx.cloud.uploadFile({ cloudPath, filePath })
      this.setData({ uploadVisible: false })
      return res.fileID
    } catch (err) {
      this.setData({ uploadVisible: false })
      throw err
    }
  },

  async submitComment() {
    const { commentText, commentImage, uploadOrigin } = this.data
    if (!commentText.trim() && !commentImage) {
      wx.showToast({ title: '内容不能为空', icon: 'none' })
      return
    }

    wx.showLoading({ title: '处理中...' })

    try {
      let imageFileID = ''

      if (commentImage) {
        if (commentImage.startsWith('cloud://')) {
          imageFileID = commentImage
        } else {
          // 本地路径，需要上传
          let uploadPath = commentImage
          if (!uploadOrigin) {
            uploadPath = await this.compressImage(commentImage, 1280, 80)
          }
          const cloudPath = `activity-comments/${this.data.activityId}/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
          imageFileID = await this.uploadFileWithProgress(cloudPath, uploadPath)
        }
      } else if (this.data.editingCommentId) {
        imageFileID = ''
      }

      let res
      if (this.data.editingCommentId) {
        res = await wx.cloud.callFunction({
          name: 'updateActivityComment',
          data: { commentId: this.data.editingCommentId, content: commentText.trim(), imageFileID }
        })
      } else {
        res = await wx.cloud.callFunction({
          name: 'submitActivityComment',
          data: { activityId: this.data.activityId, content: commentText.trim(), imageFileID }
        })
      }

      wx.hideLoading()
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: this.data.editingCommentId ? '修改成功' : '发布成功', icon: 'success' })
        this.setData({ commentText: '', commentImage: '', commentImagePreview: '', uploadOrigin: false, editingCommentId: '', showEmojiPanel: false })
        await this.loadComments()
      } else {
        wx.showToast({ title: res.result.msg || '操作失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('操作失败', err)
      wx.showToast({ title: err.errMsg || '操作失败，请重试', icon: 'none' })
    }
  },

  editComment(e) {
    const commentId = e.currentTarget.dataset.id
    const comment = this.data.comments.find(c => c._id === commentId)
    if (!comment) return
    this.setData({
      editingCommentId: commentId,
      commentText: comment.content || '',
      commentImage: comment.imageFileID || '',
      commentImagePreview: comment.imageUrl || comment.imageFileID || '',
      uploadOrigin: false,
      showEmojiPanel: false
    })
    wx.pageScrollTo({ selector: '.comment-form', duration: 300 })
  },

  cancelEdit() {
    this.setData({ editingCommentId: '', commentText: '', commentImage: '', commentImagePreview: '', uploadOrigin: false, showEmojiPanel: false })
  },

  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({ name: 'deleteActivityComment', data: { commentId } })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.loadComments()
            } else {
              wx.showToast({ title: result.result.msg || '删除失败', icon: 'none' })
            }
          } catch (err) {
            console.error('删除评论失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      }
    })
  },

  previewCommentImage(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.previewImage({ urls: [url] })
    }
  }
})