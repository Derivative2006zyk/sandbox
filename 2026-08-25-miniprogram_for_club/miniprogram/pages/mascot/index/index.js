const app = getApp()

Page({
  data: {
    bgUrl: '',
    currentMenu: 'shenren',    // 当前选中菜单：shenren / guga
    roleList: [],              // 角色列表，空数组表示无角色
    selectedRoleIndex: 0,      // 当前选中的角色索引，默认第一个
    navFade: false,            // 底部导航切换淡入淡出标记
    expanded: false,           // 版权区域展开状态
    touchStartY: 0
  },

  onLoad() {
    this.fetchBgUrl();
    // 初始化默认菜单对应的数据（预留接口）
    this.updateRoleListByMenu('shenren');
  },

  // 获取背景图临时链接
  fetchBgUrl() {
    const fileID = app.globalData.assets.background;
    app.getBgUrl(fileID).then(url => this.setData({ bgUrl: url })).catch(err => {
      console.error('获取背景图失败', err);
      this.setData({ bgUrl: '/images/background.jpg' });
    });
  },

  // 左侧菜单点击事件（预留接口）
  handleMenuClick(e) {
    const menu = e.currentTarget.dataset.menu;
    if (menu === this.data.currentMenu) return;
    this.setData({ currentMenu: menu, navFade: true });
    // 模拟请求，后续替换为实际 API 调用：fetchRoleList(menu)
    this.updateRoleListByMenu(menu);
    // 移除淡入动画类，防止影响后续切换
    setTimeout(() => {
      this.setData({ navFade: false });
    }, 300);
  },

  // 更新角色列表（预留接口：后续替换为实际请求）
  updateRoleListByMenu(menu) {
    if (menu === 'shenren') {
      // 神人：返回5个占位数据（具体数据可后续填充）
      this.setData({
        roleList: [{}, {}, {}, {}, {}],
        selectedRoleIndex: 0   // 默认选中第一个，可按需调整
      });
    } else if (menu === 'guga') {
      // 咕嘎：空数组，显示空状态
      this.setData({
        roleList: [],
        selectedRoleIndex: -1
      });
    }
  },

  // 底部角色点击（预留接口）
  selectRole(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ selectedRoleIndex: index });
    // 后续可添加实际选中逻辑，如切换主视觉等
  },

  // 返回菜单页
  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/menu/index/index' });
      }
    });
  },

  // 触摸开始
  onTouchStart(e) {
    this.setData({ touchStartY: e.touches[0].clientY });
  },

  // 触摸结束：上滑展开，下滑折叠/返回
  onTouchEnd(e) {
    const startY = this.data.touchStartY;
    const endY = e.changedTouches[0].clientY;
    const distance = startY - endY;

    if (distance > 80) { // 上滑
      if (!this.data.expanded) {
        this.setData({ expanded: true });
      }
    } else if (distance < -80) { // 下滑
      if (this.data.expanded) {
        this.setData({ expanded: false });
      } else {
        this.goBack();
      }
    }
  }
});