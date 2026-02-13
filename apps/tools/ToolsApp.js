/**
 * 工具页面主应用
 * 负责加载数据和渲染工具卡片
 */
class ToolsApp {
  constructor() {
    this.toolsData = null;
    this.container = document.getElementById('toolsContainer');
  }

  async init() {
    try {
      // 加载数据
      await this.loadData();

      // 渲染页面
      this.render();
    } catch (error) {
      console.error('ToolsApp: 初始化过程中出错', error);
    }
  }

  async loadData() {
    try {
      // 从 HTML 文件位置计算相对路径
      const response = await fetch('../apps/tools/data/tools-data.json');
      if (!response.ok) {
        throw new Error(`Failed to load tools data: ${response.status} ${response.statusText}`);
      }
      this.toolsData = await response.json();
      console.log('ToolsApp: 数据加载成功', this.toolsData);
    } catch (error) {
      console.error('加载工具数据失败:', error);
      // 使用默认数据
      this.toolsData = {
        page: {
          title: "🛠️ 效率小工具",
          subtitle: "Efficiency Tools",
          description: ""
        },
        categories: []
      };
    }
  }

  render() {
    if (!this.toolsData) {
      console.error('ToolsApp: 数据未加载');
      return;
    }

    // 渲染分类工具
    this.renderCategories();
  }

  renderCategories() {
    const categoriesContainer = document.getElementById('toolsCategories');
    if (!categoriesContainer) {
      console.error('ToolsApp: 找不到 toolsCategories 元素');
      return;
    }
    
    if (!this.toolsData.categories) {
      console.error('ToolsApp: 分类数据不存在');
      categoriesContainer.innerHTML = '<div style="text-align: center; padding: 4rem; color: #999;">数据格式错误</div>';
      return;
    }

    if (this.toolsData.categories.length === 0) {
      categoriesContainer.innerHTML = '<div style="text-align: center; padding: 4rem; color: #999;">暂无工具分类</div>';
      return;
    }

    categoriesContainer.innerHTML = this.toolsData.categories.map(category => {
      return this.renderCategory(category);
    }).join('');
  }

  renderCategory(category) {
    const toolsHTML = category.tools && category.tools.length > 0
      ? category.tools.map(tool => this.renderTool(tool)).join('')
      : '<div style="text-align: center; padding: 2rem; color: #999;">暂无工具</div>';

    return `
      <div class="tools-category">
        <div class="tools-category-header">
          <h2 class="tools-category-title">${category.title}</h2>
          <p class="tools-category-subtitle">${category.subtitle || ''}</p>
        </div>
        <div class="tools-cards-grid">
          ${toolsHTML}
        </div>
      </div>
    `;
  }

  renderTool(tool) {
    const badgeHTML = tool.badge 
      ? `<span class="tools-card-badge">${tool.badge}</span>`
      : '';

    return `
      <a href="${tool.href}" class="tools-card">
        <span class="tools-card-icon">${tool.icon || '🔧'}</span>
        <div class="tools-card-content">
          <div class="tools-card-header">
            <h3 class="tools-card-name">${tool.name}</h3>
            ${badgeHTML}
          </div>
          <p class="tools-card-description">
            ${tool.description || ''}
          </p>
        </div>
      </a>
    `;
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  console.log('ToolsApp: DOM 已加载，开始初始化');
  const app = new ToolsApp();
  app.init().catch(error => {
    console.error('ToolsApp: 初始化失败', error);
  });
});
