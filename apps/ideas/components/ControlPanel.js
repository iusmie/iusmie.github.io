/**
 * 控制面板组件 - 过滤器和视图切换
 */
class IdeasControlPanel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onFilterChange = options.onFilterChange || (() => {});
    this.onViewChange = options.onViewChange || (() => {});
    this.onCompareToggle = options.onCompareToggle || (() => {});
    this.currentView = 'grid';
    this.filters = {
      status: 'all',
      category: 'all',
      sort: 'newest'
    };
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ideas-control-panel">
        <div class="ideas-filters">
          <select class="ideas-filter-select" id="statusFilter">
            <option value="all">全部状态</option>
            <option value="seed">🌱 种子期</option>
            <option value="sprout">🌿 发芽期</option>
            <option value="growing">🌳 生长期</option>
            <option value="fruit">🍎 结果期</option>
            <option value="withered">🍂 已归档</option>
          </select>
          <select class="ideas-filter-select" id="categoryFilter">
            <option value="all">全部分类</option>
            <option value="product">产品</option>
            <option value="content">内容</option>
            <option value="tool">工具</option>
            <option value="business">商业</option>
            <option value="lifestyle">生活方式</option>
          </select>
          <select class="ideas-filter-select" id="sortFilter">
            <option value="newest">最新创建</option>
            <option value="updated">最近更新</option>
            <option value="progress">进度优先</option>
          </select>
        </div>
        <div class="ideas-view-toggle">
          <button class="ideas-view-btn active" data-view="grid">⊞ 网格</button>
          <button class="ideas-view-btn" data-view="list">☰ 列表</button>
          <button class="ideas-view-btn" id="compareToggle">⚖ 对比</button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // 过滤器事件
    document.getElementById('statusFilter').addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.onFilterChange(this.filters);
    });

    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      this.filters.category = e.target.value;
      this.onFilterChange(this.filters);
    });

    document.getElementById('sortFilter').addEventListener('change', (e) => {
      this.filters.sort = e.target.value;
      this.onFilterChange(this.filters);
    });

    // 视图切换事件
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.switchView(view);
      });
    });

    // 对比模式切换
    document.getElementById('compareToggle').addEventListener('click', () => {
      this.onCompareToggle();
    });
  }

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    this.onViewChange(view);
  }

  getFilters() {
    return this.filters;
  }
}
