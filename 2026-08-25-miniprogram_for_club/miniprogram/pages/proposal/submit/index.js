const app = getApp()

Page({
  data: {
    bgUrl: '',
    type: 'activity',
    title: '',
    content: '',
    location: '',
    startTime: '',
    endTime: '',
    signupDeadline: '',
    maxParticipants: '',
    activityType: '',
    description: '',
    emojiImage: '',
    emojiPreview: '',
    submitting: false,
    editDraftId: '',       // 编辑模式下保存原草案ID（未通过修改时使用）
    myDrafts: [],          // 我的提交历史
    loadingHistory: false  // 历史加载状态
  },

  onLoad(options) {
    this.fetchBgUrl();
    this.loadMyDrafts();
    if (options.draftId) {
      this.setData({ editDraftId: options.draftId });
      this.loadDraftDetail(options.draftId);
    }
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  // 加载我的提交历史
  async loadMyDrafts() {
    this.setData({ loadingHistory: true });
    try {
      const res = await wx.cloud.callFunction({ name: 'getMyDrafts' });
      if (res.result && res.result.code === 0) {
        const drafts = res.result.data;
        // 简单处理，如果表情有图片，暂时不转换临时链接（可能需要云函数返回临时链接，但先保证不白屏）
        this.setData({ myDrafts: drafts, loadingHistory: false });
      } else {
        this.setData({ myDrafts: [], loadingHistory: false });
      }
    } catch (err) {
      console.error('加载我的草案失败', err);
      this.setData({ myDrafts: [], loadingHistory: false });
    }
  },

  // 加载指定草案详情用于编辑（修改未通过草案时预填）
  async loadDraftDetail(draftId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getDraftDetail',
        data: { draftId }
      });
      if (res.result && res.result.code === 0) {
        const draft = res.result.data;
        const data = {
          type: draft.type,
          title: draft.title || '',
          content: draft.content || '',
          emojiImage: draft.imageFileID || '',
          emojiPreview: draft.imageFileID || ''
        };
        if (draft.type === 'activity' && draft.formData) {
          Object.assign(data, {
            location: draft.formData.location || '',
            startTime: draft.formData.startTime || '',
            endTime: draft.formData.endTime || '',
            signupDeadline: draft.formData.signupDeadline || '',
            maxParticipants: draft.formData.maxParticipants ? String(draft.formData.maxParticipants) : '',
            activityType: draft.formData.type || '',
            description: draft.formData.description || ''
          });
        }
        this.setData(data);
      } else {
        wx.showToast({ title: res.result.msg || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载草案详情失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/user/index/index' }) });
  },

  onTypeChange(e) {
    this.setData({ type: e.detail.value });
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onContentInput(e) { this.setData({ content: e.detail.value }); },
  onFormDataInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  uploadEmojiImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const size = res.tempFiles[0].size || 0;
        if (size > 5 * 1024 * 1024) {
          wx.showToast({ title: '图片不能超过5MB', icon: 'none' });
          return;
        }
        this.setData({ emojiPreview: tempFilePath });
        wx.showLoading({ title: '上传中...' });
        try {
          const cloudPath = `proposal-emoji/${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
          const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tempFilePath });
          this.setData({ emojiImage: uploadRes.fileID });
          wx.hideLoading();
          wx.showToast({ title: '上传成功', icon: 'success' });
        } catch (err) {
          wx.hideLoading();
          console.error('上传表情失败', err);
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('选择图片失败', err);
        wx.showToast({ title: '选择图片失败', icon: 'none' });
      }
    });
  },

  async submitDraft() {
    const { type, title, content, location, startTime, endTime, signupDeadline, maxParticipants, activityType, description, emojiImage } = this.data;
    if (type === 'emoji') {
      if (!emojiImage) {
        wx.showToast({ title: '请上传表情图片', icon: 'none' });
        return;
      }
    } else {
      if (!title.trim()) {
        wx.showToast({ title: '请输入标题', icon: 'none' });
        return;
      }
      if (type === 'news' && !content.trim()) {
        wx.showToast({ title: '请输入内容', icon: 'none' });
        return;
      }
      if (type === 'activity') {
        if (!location.trim() || !startTime.trim() || !endTime.trim() || !signupDeadline.trim() || !maxParticipants.trim()) {
          wx.showToast({ title: '请填写完整活动信息', icon: 'none' });
          return;
        }
      }
    }

    this.setData({ submitting: true });
    try {
      const data = { type };
      if (type === 'activity') {
        data.title = title.trim();
        data.formData = {
          location: location.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          signupDeadline: signupDeadline.trim(),
          maxParticipants: Number(maxParticipants),
          type: activityType.trim(),
          description: description.trim()
        };
      } else if (type === 'news') {
        data.title = title.trim();
        data.content = content.trim();
      } else if (type === 'emoji') {
        data.imageFileID = emojiImage;
      }

      const res = await wx.cloud.callFunction({ name: 'submitDraft', data });
      if (res.result && res.result.code === 0) {
        wx.showToast({ title: '提交成功', icon: 'success' });
        // 重置表单，刷新历史列表
        this.setData({
          type: 'activity',
          title: '',
          content: '',
          location: '',
          startTime: '',
          endTime: '',
          signupDeadline: '',
          maxParticipants: '',
          activityType: '',
          description: '',
          emojiImage: '',
          emojiPreview: '',
          editDraftId: ''
        });
        this.loadMyDrafts();
      } else {
        wx.showToast({ title: res.result.msg || '提交失败', icon: 'none' });
      }
    } catch (err) {
      console.error('提交草案失败', err);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 修改未通过的草案：加载到表单并滚动到顶部
  editDraft(e) {
    const draftId = e.currentTarget.dataset.id;
    this.setData({ editDraftId: draftId });
    this.loadDraftDetail(draftId);
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  }
});