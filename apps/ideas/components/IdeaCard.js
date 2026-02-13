/**
 * IdeaCard 组件 - 单个想法卡片
 */
class IdeaCard {
  constructor(idea, config, options = {}) {
    this.idea = idea;
    this.config = config;
    this.onClick = options.onClick || (() => {});
    this.onCompareToggle = options.onCompareToggle || (() => {});
  }

  render() {
    const statusConfig = this.config.statusConfig[this.idea.status];
    const categoryConfig = this.config.categoryConfig[this.idea.category];
    
    return `
      <div class="idea-card" data-id="${this.idea.id}" style="--status-color: ${statusConfig.color}">
        <div class="idea-card-header">
          <span class="idea-id">${this.idea.id}</span>
          <span class="idea-status status-${this.idea.status}">
            ${statusConfig.icon} ${statusConfig.label}
          </span>
        </div>
        <h3 class="idea-title">${this.idea.title}</h3>
        <p class="idea-desc">${this.idea.description}</p>
        <div class="idea-meta">
          <div class="idea-meta-item">
            <span>📁</span>
            <span>${categoryConfig.label}</span>
          </div>
          <div class="idea-meta-item">
            <span>📅</span>
            <span>${this.idea.updatedAt}</span>
          </div>
        </div>
        ${this.idea.tags && this.idea.tags.length > 0 ? `
          <div class="idea-tags">
            ${this.idea.tags.map(tag => `<span class="idea-tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
        <div class="idea-card-footer">
          <div class="idea-progress-bar">
            <div class="idea-progress-fill" style="width: ${this.idea.progress}%; --status-color: ${statusConfig.color}"></div>
          </div>
          <span class="idea-progress-text">${this.idea.progress}%</span>
        </div>
        ${this.onCompareToggle ? `
          <div class="idea-compare-checkbox">
            <input type="checkbox" id="compare-${this.idea.id}" ${this.idea.compareSelected ? 'checked' : ''}>
            <label for="compare-${this.idea.id}">加入对比</label>
          </div>
        ` : ''}
      </div>
    `;
  }

  attachEvents(element) {
    if (!element) return;

    // 点击卡片查看详情
    element.addEventListener('click', (e) => {
      if (!e.target.closest('.idea-compare-checkbox')) {
        this.onClick(this.idea);
      }
    });

    // 对比复选框
    const checkbox = element.querySelector(`#compare-${this.idea.id}`);
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        this.idea.compareSelected = e.target.checked;
        this.onCompareToggle(this.idea);
      });
    }
  }
}
