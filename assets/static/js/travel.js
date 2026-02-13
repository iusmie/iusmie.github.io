/**
 * Travel Page 主脚本
 * 负责初始化页面和组件
 */

let visaComponent = null;
let guideComponent = null;

/**
 * 加载数据并初始化组件
 */
async function initTravelPage() {
  try {
    // 加载签证数据
    const visaResponse = await fetch('../../apps/travel/data/visa-data.json');
    if (!visaResponse.ok) {
      throw new Error('Failed to load visa data');
    }
    const visaData = await visaResponse.json();

    // 加载攻略数据
    const guideResponse = await fetch('../../apps/travel/data/travel-guides-data.json');
    if (!guideResponse.ok) {
      throw new Error('Failed to load guide data');
    }
    const guideData = await guideResponse.json();

    // 初始化签证组件
    visaComponent = new VisaComponent('visaContainer', visaData.visas);
    visaComponent.render();

    // 初始化攻略组件
    guideComponent = new TravelGuideComponent('guideContainer', guideData.guides);
    guideComponent.render();

    // 更新标签页计数
    updateTabCounts(visaData.visas.length, guideData.guides.length);

    // 初始化标签页切换功能
    initTabSwitching();

  } catch (error) {
    console.error('加载数据失败:', error);
    showErrorMessage('visaContainer', '加载签证数据失败，请刷新页面重试');
    showErrorMessage('guideContainer', '加载攻略数据失败，请刷新页面重试');
  }
}

/**
 * 初始化标签页切换功能
 */
function initTabSwitching() {
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
function updateTabCounts(visaCount, guideCount) {
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
function showErrorMessage(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = 
      `<div style="text-align: center; padding: 3rem; color: #999;">${message}</div>`;
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTravelPage);
} else {
  initTravelPage();
}
