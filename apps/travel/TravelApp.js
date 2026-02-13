/**
 * Travel Page 主应用
 * 负责加载数据和初始化组件
 */
class TravelApp {
  constructor() {
    this.visaData = null;
    this.guideData = null;
    this.visaComponent = null;
    this.guideComponent = null;
  }

  async init() {
    try {
      // 加载数据
      await this.loadData();

      // 初始化组件
      this.initComponents();

      // 更新标签页计数
      this.updateTabCounts();

      // 初始化标签页切换功能
      this.initTabSwitching();
    } catch (error) {
      console.error('TravelApp: 初始化过程中出错', error);
      this.showErrorMessage('visaContainer', '加载签证数据失败，请刷新页面重试');
      this.showErrorMessage('guideContainer', '加载攻略数据失败，请刷新页面重试');
    }
  }

  async loadData() {
    try {
      // 加载签证数据
      const visaResponse = await fetch('../apps/travel/data/visa-data.json');
      if (!visaResponse.ok) {
        throw new Error('Failed to load visa data');
      }
      this.visaData = await visaResponse.json();

      // 加载攻略数据
      const guideResponse = await fetch('../apps/travel/data/travel-guides-data.json');
      if (!guideResponse.ok) {
        throw new Error('Failed to load guide data');
      }
      this.guideData = await guideResponse.json();

      console.log('TravelApp: 数据加载成功');
    } catch (error) {
      console.error('TravelApp: 加载数据失败', error);
      throw error;
    }
  }

  initComponents() {
    // 初始化签证组件
    if (this.visaData && this.visaData.visas) {
      this.visaComponent = new VisaComponent('visaContainer', this.visaData.visas);
      this.visaComponent.render();
    }

    // 初始化攻略组件
    if (this.guideData && this.guideData.guides) {
      this.guideComponent = new TravelGuideComponent('guideContainer', this.guideData.guides);
      this.guideComponent.render();
    }
  }

  /**
   * 初始化标签页切换功能
   */
  initTabSwitching() {
    const tabs = document.querySelectorAll('.travel-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        // 如果点击的是按钮内部的元素，找到按钮元素
        const tabButton = e.target.closest('.travel-tab');
        if (!tabButton) return;
        
        const tabName = tabButton.dataset.tab;
        
        // 更新标签状态
        tabs.forEach(t => t.classList.remove('active'));
        tabButton.classList.add('active');

        // 更新内容显示
        document.querySelectorAll('.travel-tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        if (tabName === 'visa') {
          document.getElementById('visaContent').classList.add('active');
        } else if (tabName === 'guide') {
          document.getElementById('guideContent').classList.add('active');
        }
      });
    });
  }

  /**
   * 更新标签页计数
   */
  updateTabCounts() {
    const visaCount = this.visaData?.visas?.length || 0;
    const guideCount = this.guideData?.guides?.length || 0;

    const visaTabCount = document.getElementById('visaTabCount');
    const guideTabCount = document.getElementById('guideTabCount');
    
    if (visaTabCount) {
      visaTabCount.textContent = visaCount;
    }
    if (guideTabCount) {
      guideTabCount.textContent = guideCount;
    }
  }

  /**
   * 显示错误信息
   */
  showErrorMessage(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = 
        `<div style="text-align: center; padding: 3rem; color: #999;">${message}</div>`;
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  console.log('TravelApp: DOM 已加载，开始初始化');
  const app = new TravelApp();
  app.init().catch(error => {
    console.error('TravelApp: 初始化失败', error);
  });
});
