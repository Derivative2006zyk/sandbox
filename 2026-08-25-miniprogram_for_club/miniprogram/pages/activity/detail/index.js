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
    commentImage: '',
    commentVideo: '',
    uploadOrigin: false,
    myOpenid: '',
    editingCommentId: '',
    uploadVisible: false,
    uploadProgress: 0
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
        this.setData({ comments: res.result.data })
      } else {
        console.error('加载评论失败', res.result)
        wx.showToast({ title: '评论加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('加载评论异常', err)
    }
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index' }) })
  },

  goSignup() {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.name || !userInfo.studentId || !userInfo.phone) {
      wx.showModal({
        title: '提示',
        content: '请先完善个人资料',
        confirmText: '去完善',
        success: (res) => { if (res.confirm) wx.navigateTo({ url: '/pages/user/edit-profile/index' }) }
      })
      return
    }
    wx.navigateTo({ url: `/pages/activity/signup/index?activityId=${this.data.activityId}` })
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

  chooseCommentImage() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: res => this.setData({ commentImage: res.tempFiles[0].tempFilePath }) })
  },

  chooseCommentVideo() {
    wx.chooseMedia({ count: 1, mediaType: ['video'], maxDuration: 30, success: res => this.setData({ commentVideo: res.tempFiles[0].tempFilePath }) })
  },

  removeCommentImage() { this.setData({ commentImage: '' }) },
  removeCommentVideo() { this.setData({ commentVideo: '' }) },

  // 压缩图片：使用 wx.compressImage，保持宽高比，不会裁剪
  async compressImage(src, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: src,
        quality: quality || 80,
        compressedWidth: maxWidth,   // 只指定宽度，高度自动等比缩放
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: (err) => {
          console.warn('wx.compressImage 失败，尝试原图上传', err);
          resolve(src);   // 压缩失败时返回原图，保证流程不中断
        }
      });
    });
  },

  // 上传文件（去掉 onProgressUpdate，避免兼容性问题）
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
    const { commentText, commentImage, commentVideo, uploadOrigin } = this.data
    if (!commentText.trim() && !commentImage && !commentVideo) {
      wx.showToast({ title: '内容不能为空', icon: 'none' })
      return
    }

    wx.showLoading({ title: '处理中...' })

    try {
      let imageFileID = ''
      let videoFileID = ''

      if (commentImage) {
        if (commentImage.startsWith('cloud://')) {
          imageFileID = commentImage
        } else {
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

      if (commentVideo) {
        if (commentVideo.startsWith('cloud://')) {
          videoFileID = commentVideo
        } else {
          const cloudPath = `activity-comments/${this.data.activityId}/${Date.now()}-${Math.floor(Math.random() * 1000)}.mp4`
          videoFileID = await this.uploadFileWithProgress(cloudPath, commentVideo)
        }
      } else if (this.data.editingCommentId) {
        videoFileID = ''
      }

      let res
      if (this.data.editingCommentId) {
        res = await wx.cloud.callFunction({
          name: 'updateActivityComment',
          data: { commentId: this.data.editingCommentId, content: commentText.trim(), imageFileID, videoFileID }
        })
      } else {
        res = await wx.cloud.callFunction({
          name: 'submitActivityComment',
          data: { activityId: this.data.activityId, content: commentText.trim(), imageFileID, videoFileID }
        })
      }

      wx.hideLoading()
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: this.data.editingCommentId ? '修改成功' : '发布成功', icon: 'success' })
        this.setData({ commentText: '', commentImage: '', commentVideo: '', uploadOrigin: false, editingCommentId: '' })
        await this.loadComments()
      } else {
        wx.showToast({ title: res.result.msg || '操作失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('操作失败', err)
      wx.showToast({ title: '操作失败，请重试', icon: 'none' })
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
      commentVideo: comment.videoFileID || '',
      uploadOrigin: false
    })
    wx.pageScrollTo({ selector: '.comment-form', duration: 300 })
  },

  cancelEdit() {
    this.setData({ editingCommentId: '', commentText: '', commentImage: '', commentVideo: '', uploadOrigin: false })
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