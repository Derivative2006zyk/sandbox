const app = getApp()

const PAGE_SIZE = 10

Page({
  data: {
    bgUrl: '',
    activities: [],
    page: 1,
    hasMore: false,
    listLoading: false,
    activityId: '',
    sections: [],
    loading: false,
    uploading: false,
    newSection: '',
    showCaptionModal: false,
    editingPhotoId: '',
    editingCaption: ''
  },

  onLoad(options) {
    this.fetchBgUrl()
    this.loadActivities(true)
    // 支持从活动详情页带 activityId 定位到对应活动
    if (options.activityId) {
      this.setData({ activityId: options.activityId })
    }
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err)
      this.setData({ bgUrl: '/images/background.jpg' })
    })
  },

  goBack() {
    app.navigateBack({ fail: () => app.reLaunch({ url: '/pages/admin/index/index' }) })
  },

  async loadActivities(reset = false) {
    if (this.data.listLoading) return
    this.setData({ listLoading: true })

    const page = reset ? 1 : this.data.page
    try {
      const res = await wx.cloud.callFunction({
        name: 'getAllActivities',
        data: { page, pageSize: PAGE_SIZE }
      })
      if (res.result && res.result.code === 0) {
        const { list, hasMore } = res.result.data
        const activities = reset ? list : this.data.activities.concat(list)
        this.setData({
          activities,
          page: page + 1,
          hasMore,
          listLoading: false
        })
        // 首次加载若指定了 activityId，直接展示对应照片
        if (reset && this.data.activityId) {
          this.loadPhotos()
        }
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
        this.setData({ listLoading: false })
      }
    } catch (err) {
      console.error('加载活动失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
      this.setData({ listLoading: false })
    }
  },

  loadMore() {
    if (this.data.hasMore && !this.data.listLoading) {
      this.loadActivities(false)
    }
  },

  selectActivity(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    this.setData({ activityId: id, sections: [], newSection: '' })
    this.loadPhotos()
  },

  async loadPhotos() {
    if (!this.data.activityId) return
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getActivityPhotos',
        data: { activityId: this.data.activityId }
      })
      if (res.result && res.result.code === 0) {
        this.setData({ sections: res.result.data.sections || [], loading: false })
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' })
        this.setData({ sections: [], loading: false })
      }
    } catch (err) {
      console.error('加载照片失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
      this.setData({ sections: [], loading: false })
    }
  },

  onNewSectionInput(e) {
    this.setData({ newSection: e.detail.value })
  },

  addSection() {
    const section = this.data.newSection.trim()
    if (!section) {
      wx.showToast({ title: '请输入分组名称', icon: 'none' })
      return
    }
    // 分组由上传图片时隐式创建；此处仅本地加入一个空分组便于预览
    const exists = this.data.sections.some(s => s.section === section)
    if (exists) {
      wx.showToast({ title: '该分组已存在', icon: 'none' })
      return
    }
    this.setData({
      sections: this.data.sections.concat([{ section, photos: [] }]),
      newSection: ''
    })
  },

  uploadPhoto(e) {
    const section = e.currentTarget.dataset.section
    if (!section) {
      wx.showToast({ title: '请先创建分组', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const files = res.tempFiles
        this.setData({ uploading: true })
        wx.showLoading({ title: '上传中...' })
        try {
          for (const file of files) {
            const cloudPath = `activity-photos/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`
            const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: file.tempFilePath })
            await wx.cloud.callFunction({
              name: 'adminAddActivityPhoto',
              data: { activityId: this.data.activityId, fileID: uploadRes.fileID, section }
            })
          }
          wx.hideLoading()
          wx.showToast({ title: '上传成功', icon: 'success' })
          this.loadPhotos()
        } catch (err) {
          wx.hideLoading()
          console.error('上传照片失败', err)
          wx.showToast({ title: '上传失败', icon: 'none' })
        } finally {
          this.setData({ uploading: false })
        }
      },
      fail: (err) => {
        console.error('选择图片失败', err)
      }
    })
  },

  deletePhoto(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定删除该照片？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'adminDeleteActivityPhoto',
              data: { photoId: id }
            })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' })
              this.loadPhotos()
            } else {
              wx.showToast({ title: result.result.msg || '删除失败', icon: 'none' })
            }
          } catch (err) {
            console.error('删除照片失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      }
    })
  },

  // 打开编辑文字说明弹窗
  editCaption(e) {
    const { id, caption } = e.currentTarget.dataset
    this.setData({ showCaptionModal: true, editingPhotoId: id, editingCaption: caption || '' })
  },

  onCaptionInput(e) {
    this.setData({ editingCaption: e.detail.value })
  },

  closeCaptionModal() {
    this.setData({ showCaptionModal: false, editingPhotoId: '', editingCaption: '' })
  },

  noop() {},

  async saveCaption() {
    const { editingPhotoId, editingCaption } = this.data
    if (!editingPhotoId) return
    try {
      const result = await wx.cloud.callFunction({
        name: 'adminUpdateActivityPhoto',
        data: { photoId: editingPhotoId, caption: editingCaption }
      })
      if (result.result && result.result.code === 0) {
        wx.showToast({ title: '已保存', icon: 'success' })
        this.closeCaptionModal()
        this.loadPhotos()
      } else {
        wx.showToast({ title: result.result.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error('保存说明失败', err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
  },

  deleteSection(e) {
    const section = e.currentTarget.dataset.section
    wx.showModal({
      title: '删除分组',
      content: `将删除「${section}」分组及其所有照片，确定？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'adminDeleteActivitySection',
              data: { activityId: this.data.activityId, section }
            })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' })
              this.loadPhotos()
            } else {
              wx.showToast({ title: result.result.msg || '删除失败', icon: 'none' })
            }
          } catch (err) {
            console.error('删除分组失败', err)
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      }
    })
  }
})
