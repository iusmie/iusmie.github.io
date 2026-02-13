/**
 * 标签切换组件
 */
class Tabs {
  constructor(containerId, onTabChange) {
    this.container = document.getElementById(containerId);
    this.onTabChange = onTabChange;
    this.currentTab = 'all';
  }

  render() {
    if (!this.container) return;

    const tabs = [
      { key: 'all', label: '🏠 全部成员' },
      { key: 'cats', label: '🐱 猫咪' },
      { key: 'dog', label: '🐶 狗狗' },
      { key: 'experience', label: '📚 经验分享' }
    ];

    this.container.innerHTML = `
      ${tabs.map(tab => `
        <button class="tab-btn ${tab.key === 'all' ? 'active' : ''}" 
                data-tab="${tab.key}">
          ${tab.label}
        </button>
      `).join('')}
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const buttons = this.container.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.setActiveTab(tab);
        if (this.onTabChange) {
          this.onTabChange(tab);
        }
      });
    });
  }

  setActiveTab(tab) {
    this.currentTab = tab;
    const buttons = this.container.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      }
    });
  }

  getCurrentTab() {
    return this.currentTab;
  }
}
