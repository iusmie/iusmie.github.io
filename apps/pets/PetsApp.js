/**
 * 猫咪星球主应用
 */
class PetsApp {
  constructor() {
    this.data = null;
    this.allPets = [];
    this.components = {};
  }

  async init() {
    // 加载数据
    await this.loadData();

    // 初始化组件
    this.initComponents();

    // 渲染页面
    this.render();
  }

  async loadData() {
    try {
      const response = await fetch('../apps/pets/data/pets-data.json');
      const data = await response.json();
      this.data = data;
      this.allPets = [...data.cats, data.dog];
    } catch (error) {
      console.error('加载数据失败:', error);
      this.data = null;
      this.allPets = [];
    }
  }

  initComponents() {
    // Hero 组件
    this.components.hero = new Hero('heroContainer');

    // 标签组件
    this.components.tabs = new Tabs('tabsContainer', (tab) => {
      this.switchTab(tab);
    });

    // 经验组件
    this.components.tips = new TipsSection('tipsContainer', this.data?.tips, this.data?.monthlyCosts);
  }

  render() {
    // 渲染 Hero（包含小红书链接）
    if (this.components.hero && this.data) {
      this.components.hero.render({
        cats: this.data.cats.length,
        dogs: 1,
        personalities: this.data.cats.length + 1
      }, this.data?.xiaohongshu);
    }

    // 渲染标签
    if (this.components.tabs) {
      this.components.tabs.render();
    }

    // 渲染宠物列表
    this.renderPets('all');

    // 渲染经验组件（初始隐藏）
    if (this.components.tips) {
      this.components.tips.render();
    }
    const tipsSection = document.getElementById('tipsSection');
    if (tipsSection) {
      tipsSection.style.display = 'none';
    }
  }

  renderPets(filter = 'all') {
    const grid = document.getElementById('petsGrid');
    if (!grid || !this.data) return;

    let pets = [];
    if (filter === 'all' || filter === 'cats') {
      pets = [...pets, ...this.data.cats];
    }
    if (filter === 'all' || filter === 'dog') {
      pets = [...pets, this.data.dog];
    }

    grid.innerHTML = pets.map((pet, index) => {
      const card = new PetCard(pet, index);
      return card.render();
    }).join('');
  }

  switchTab(tab) {
    const petsSection = document.getElementById('petsSection');
    const tipsSection = document.getElementById('tipsSection');

    if (tab === 'experience') {
      if (petsSection) petsSection.style.display = 'none';
      if (tipsSection) {
        tipsSection.style.display = 'block';
        // 确保经验内容已渲染
        if (this.components.tips && this.data) {
          this.components.tips.render();
        }
      }
    } else {
      if (petsSection) petsSection.style.display = 'block';
      if (tipsSection) tipsSection.style.display = 'none';
      this.renderPets(tab);
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new PetsApp();
  app.init();
});
