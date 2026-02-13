/**
 * Ideas 主应用
 */
class IdeasApp {
  constructor(options = {}) {
    this.data = null;
    this.filteredIdeas = [];
    this.config = null;
    this.components = {};
    
    // 加载配置
    this.loadConfig();
    
    // 加载数据
    this.loadData().then(() => {
      this.init();
    });
  }

  async loadConfig() {
    // 动态导入配置（如果使用 ES6 模块）
    // 这里使用内联配置，实际可以从文件加载
    this.config = {
      statusConfig: {
        seed: { label: '种子期', color: '#f59e0b', icon: '🌱' },
        sprout: { label: '发芽期', color: '#3b82f6', icon: '🌿' },
        growing: { label: '生长期', color: '#10b981', icon: '🌳' },
        fruit: { label: '结果期', color: '#8b5cf6', icon: '🍎' },
        withered: { label: '已归档', color: '#6b7280', icon: '🍂' }
      },
      categoryConfig: {
        product: { label: '产品', icon: '📱' },
        content: { label: '内容', icon: '📝' },
        tool: { label: '工具', icon: '🛠️' },
        business: { label: '商业', icon: '💼' },
        lifestyle: { label: '生活方式', icon: '✨' }
      },
      metricLabels: {
        feasibility: '可行性',
        marketPotential: '市场潜力',
        personalInterest: '个人兴趣',
        timeCost: '时间成本',
        maintenance: '维护成本'
      },
      // 添加密钥配置（可以从环境变量或配置文件读取）
      accessKey: 'ideas2026' // 默认密钥，可以修改
    };
  }

  verifyAccessKey() {
    // 每次点击都需要输入密钥验证
    const inputKey = prompt('请输入访问密钥以添加新想法：');
    if (!inputKey) {
      // 用户取消输入，不显示表单
      return false;
    }

    // 验证密钥
    if (inputKey === this.config.accessKey) {
      // 验证成功，允许显示添加表单
      return true;
    } else {
      // 密钥错误，提示并阻止显示表单
      alert('密钥错误，无法添加新想法');
      return false;
    }
  }

  async loadData() {
    // 优先从 localStorage 加载数据
    const savedData = localStorage.getItem('ideas-data');
    if (savedData) {
      try {
        this.data = JSON.parse(savedData);
        this.filteredIdeas = [...this.data.ideas];
        return;
      } catch (error) {
        console.error('解析 localStorage 数据失败:', error);
        localStorage.removeItem('ideas-data');
      }
    }

    // 如果没有 localStorage 数据，从 JSON 文件加载
    try {
      const response = await fetch('../apps/ideas/data/ideas-data.json');
      this.data = await response.json();
      this.filteredIdeas = [...this.data.ideas];
      // 保存到 localStorage
      this.saveData();
    } catch (error) {
      console.error('加载数据失败:', error);
      // 使用默认数据
      this.data = {
        version: "1.0.0",
        lastUpdate: new Date().toISOString().split('T')[0],
        ideas: []
      };
      this.filteredIdeas = [];
    }
  }

  saveData() {
    try {
      localStorage.setItem('ideas-data', JSON.stringify(this.data));
    } catch (error) {
      console.error('保存数据到 localStorage 失败:', error);
    }
  }

  init() {
    // 初始化组件
    this.initComponents();
    
    // 渲染初始视图
    this.render();
  }

  initComponents() {
    // 控制面板
    this.components.controlPanel = new IdeasControlPanel('controlPanelContainer', {
      onFilterChange: (filters) => this.applyFilters(filters),
      onViewChange: (view) => this.switchView(view),
      onCompareToggle: () => this.toggleCompareMode()
    });

    // 详情模态框
    this.components.detailModal = new IdeasDetailModal('detailModalContainer', this.config, {
      onClose: () => {}
    });

    // 对比面板
    this.components.comparePanel = new IdeasComparePanel('comparePanelContainer', this.config, {
      onClose: () => {}
    });

    // 对比栏
    this.components.compareBar = new IdeasCompareBar('compareBarContainer', {
      onCompare: () => this.showComparison(),
      onClear: () => this.clearCompare()
    });

    // FAB
    this.components.fab = new IdeasFAB('fabContainer', {
      onClick: () => this.showAddIdeaModal()
    });

    // 添加想法模态框
    this.components.addIdeaModal = new IdeasAddIdeaModal('addIdeaModalContainer', this.config, {
      onSubmit: (ideaData) => this.addNewIdea(ideaData),
      onClose: () => {}
    });
   
  }

  render() {
    // 渲染所有组件
    Object.values(this.components).forEach(component => {
      if (component && typeof component.render === 'function') {
        component.render();
      }
    });

    // 渲染想法列表
    this.renderIdeas();


    // 更新对比栏
    this.updateCompareBar();
  }

  applyFilters(filters) {
    let filtered = [...this.data.ideas];

    // 状态过滤
    if (filters.status !== 'all') {
      filtered = filtered.filter(idea => idea.status === filters.status);
    }

    // 分类过滤
    if (filters.category !== 'all') {
      filtered = filtered.filter(idea => idea.category === filters.category);
    }

    // 排序
    switch (filters.sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'updated':
        filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
      case 'progress':
        filtered.sort((a, b) => b.progress - a.progress);
        break;
    }

    this.filteredIdeas = filtered;
    this.renderIdeas();
  }

  switchView(view) {
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');

    if (view === 'grid') {
      gridView.style.display = 'grid';
      listView.classList.remove('active');
    } else {
      gridView.style.display = 'none';
      listView.classList.add('active');
      this.renderListView();
    }
  }

  renderIdeas() {
    const gridView = document.getElementById('gridView');
    if (!gridView) return;

    const cardsHtml = this.filteredIdeas.map(idea => {
      const card = new IdeaCard(idea, this.config, {
        onClick: (idea) => this.showDetail(idea),
        onCompareToggle: (idea) => this.toggleCompare(idea)
      });
      return card.render();
    }).join('');

    gridView.innerHTML = cardsHtml;

    // 附加事件
    this.filteredIdeas.forEach(idea => {
      const element = document.querySelector(`[data-id="${idea.id}"]`);
      if (element) {
        const card = new IdeaCard(idea, this.config, {
          onClick: (idea) => this.showDetail(idea),
          onCompareToggle: (idea) => this.toggleCompare(idea)
        });
        card.attachEvents(element);
      }
    });
  }

  renderListView() {
    const listContent = document.getElementById('listContent');
    if (!listContent) return;

    const rowsHtml = this.filteredIdeas.map(idea => {
      const statusConfig = this.config.statusConfig[idea.status];
      const categoryConfig = this.config.categoryConfig[idea.category];
      
      return `
        <div class="ideas-list-row" data-id="${idea.id}">
          <div>
            <div class="ideas-list-title">${idea.title}</div>
            <div class="ideas-list-desc">${idea.description}</div>
          </div>
          <div>${categoryConfig.icon} ${categoryConfig.label}</div>
          <div><span class="idea-status status-${idea.status}">${statusConfig.label}</span></div>
          <div>${idea.updatedAt}</div>
          <div>${idea.progress}%</div>
        </div>
      `;
    }).join('');

    listContent.innerHTML = rowsHtml;

    // 附加点击事件
    document.querySelectorAll('.ideas-list-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        const idea = this.data.ideas.find(i => i.id === id);
        if (idea) this.showDetail(idea);
      });
    });
  }

  showDetail(idea) {
    this.components.detailModal.show(idea);
  }

  toggleCompareMode() {
    const compareBar = document.getElementById('compareBar');
    compareBar.classList.toggle('active');
  }

  toggleCompare(idea) {
    // 更新对比状态已在 IdeaCard 组件中处理
    // 保存数据到 localStorage
    this.saveData();
    this.updateCompareBar();
  }

  updateCompareBar() {
    const selectedIdeas = this.data.ideas.filter(i => i.compareSelected);
    this.components.compareBar.update(selectedIdeas.length);
  }

  showComparison() {
    const selectedIdeas = this.data.ideas.filter(i => i.compareSelected);
    if (selectedIdeas.length > 0) {
      this.components.comparePanel.show(selectedIdeas);
    }
  }

  clearCompare() {
    this.data.ideas.forEach(idea => {
      idea.compareSelected = false;
    });
    
    // 保存数据到 localStorage
    this.saveData();
    
    this.renderIdeas();
    this.updateCompareBar();
  }

  showAddIdeaModal() {
    // 必须先验证访问密钥，验证通过后才能显示添加表单
    if (!this.verifyAccessKey()) {
      // 密钥验证失败，不显示添加表单
      return;
    }
    
    // 密钥验证成功，显示添加想法模态框
    this.components.addIdeaModal.show();
  }

  addNewIdea(ideaData) {
    const newIdea = {
      id: `IDEA-${String(this.data.ideas.length + 1).padStart(3, '0')}`,
      title: ideaData.title,
      description: ideaData.description || '暂无描述',
      status: ideaData.status || 'seed',
      category: ideaData.category || 'product',
      progress: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      metrics: {
        feasibility: 5,
        marketPotential: 5,
        personalInterest: 5,
        timeCost: 5,
        maintenance: 5
      },
      tags: ideaData.tags || ['新想法'],
      timeline: [
        { date: new Date().toISOString().split('T')[0], content: '想法诞生' }
      ],
      nextStep: '完善想法细节',
      resources: [],
      compareSelected: false
    };
    
    this.data.ideas.unshift(newIdea);
    this.data.lastUpdate = new Date().toISOString().split('T')[0];
    this.filteredIdeas = [...this.data.ideas];
    
    // 保存数据到 localStorage
    this.saveData();
    
    // 重新渲染页面
    this.render();
  }

  importData(newData) {
    this.data = newData;
    this.data.lastUpdate = new Date().toISOString().split('T')[0];
    this.filteredIdeas = [...this.data.ideas];
    
    // 保存数据到 localStorage
    this.saveData();
    
    this.render();
  }
}
