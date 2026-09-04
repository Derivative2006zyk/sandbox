const app = getApp()

Page({
  data: {
    bgUrl: '',
    mascots: [],
    loading: false,
    showModal: false,
    editingId: '',
    name: '',
    category: 'shenren',
    imageFileID: '',
    imagePreview: ''
  },

  onLoad() {
    this.fetchBgUrl();
    this.loadMascots();
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/admin/index/index' }) });
  },

  async loadMascots() {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'getMascots' });
      if (res.result && res.result.code === 0) {
        this.setData({ mascots: res.result.data, loading: false });
      } else {
        this.setData({ mascots: [], loading: false });
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载吉祥物失败', err);
      this.setData({ mascots: [], loading: false });
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  showAddForm() {
    this.setData({
      showModal: true,
      editingId: '',
      name: '',
      category: 'shenren',
      imageFileID: '',
      imagePreview: ''
    });
  },

  editMascot(e) {
    const { id, name, category, image } = e.currentTarget.dataset;
    this.setData({
      showModal: true,
      editingId: id,
      name: name,
      category: category,
      imageFileID: image,
      imagePreview: image   // 直接使用 fileID 显示
    });
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  noop() {},

  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onCategoryChange(e) { this.setData({ category: e.detail.value }); },

  uploadImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        try {
          const cloudPath = `mascots/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
          const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempFilePath });
          this.setData({ imageFileID: uploadRes.fileID, imagePreview: uploadRes.fileID });
          wx.hideLoading();
          wx.showToast({ title: '上传成功', icon: 'success' });
        } catch (err) {
          wx.hideLoading();
          console.error('上传图片失败', err);
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('选择图片失败', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  async saveMascot() {
    if (!this.data.imageFileID) {
      wx.showToast({ title: '请上传图片', icon: 'none' });
      return;
    }
    const { editingId, name, category, imageFileID } = this.data;
    const data = { name, category, imageFileID };
    try {
      if (editingId) {
        await wx.cloud.callFunction({ name: 'adminUpdateMascot', data: { mascotId: editingId, ...data } });
      } else {
        await wx.cloud.callFunction({ name: 'adminAddMascot', data });
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ showModal: false });
      this.loadMascots();
    } catch (err) {
      console.error('保存失败', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  deleteMascot(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定删除该吉祥物？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({ name: 'adminDeleteMascot', data: { mascotId: id } });
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadMascots();
          } catch (err) {
            console.error('删除失败', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});