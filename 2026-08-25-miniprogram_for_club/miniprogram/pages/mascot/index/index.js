const app = getApp()

Page({
  data: {
    bgUrl: '',
    currentMenu: 'shenren',
    currentMascotName: '社团吉祥物',   // 初始默认
    roleList: [],               // 实际图片数据
    selectedRoleIndex: -1,      // 当前选中角色索引
    selectedMascot: null,       // 当前选中吉祥物对象（用于主视觉）
    navFade: false,
    expanded: false,
    touchStartY: 0,
    loading: false
  },

  onLoad() {
    this.fetchBgUrl();
    this.loadMascotsByMenu('shenren');
  },

  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  // 左侧菜单切换
  handleMenuClick(e) {
    const menu = e.currentTarget.dataset.menu;
    if (menu === this.data.currentMenu) return;
    this.setData({ currentMenu: menu, navFade: true });
    this.loadMascotsByMenu(menu);
    setTimeout(() => this.setData({ navFade: false }), 300);
  },

  // 加载对应分类的吉祥物列表
  async loadMascotsByMenu(menu) {
    this.setData({ loading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMascots',
        data: { category: menu }
      });
      if (res.result && res.result.code === 0) {
        const mascots = res.result.data;
        const selectedMascot = mascots.length > 0 ? mascots[0] : null;
        const currentMascotName = selectedMascot ? (selectedMascot.name || '未命名') : (menu === 'shenren' ? '神人' : '咕嘎');
        this.setData({
          roleList: mascots,
          selectedRoleIndex: mascots.length > 0 ? 0 : -1,
          selectedMascot: selectedMascot,
          currentMascotName: currentMascotName,
          loading: false
        });
      } else {
        this.setData({
          roleList: [],
          selectedRoleIndex: -1,
          selectedMascot: null,
          currentMascotName: menu === 'shenren' ? '神人' : '咕嘎',
          loading: false
        });
      }
    } catch (err) {
      console.error('加载吉祥物失败', err);
      this.setData({
        roleList: [],
        selectedRoleIndex: -1,
        selectedMascot: null,
        currentMascotName: menu === 'shenren' ? '神人' : '咕嘎',
        loading: false
      });
    }
  },

  // 选中底部角色
  selectRole(e) {
    const index = e.currentTarget.dataset.index;
    const mascot = this.data.roleList[index];
    this.setData({
      selectedRoleIndex: index,
      selectedMascot: mascot,
      currentMascotName: mascot.name || '未命名'
    });
  },

  // 上滑展开版权，下滑折叠/返回
  onTouchStart(e) { this.setData({ touchStartY: e.touches[0].clientY }); },
  onTouchEnd(e) {
    const startY = this.data.touchStartY;
    const endY = e.changedTouches[0].clientY;
    const distance = startY - endY;
    if (distance > 80) {
      if (!this.data.expanded) this.setData({ expanded: true });
    } else if (distance < -80) {
      if (this.data.expanded) this.setData({ expanded: false });
      else this.goBack();
    }
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/menu/index/index' }) });
  }
});