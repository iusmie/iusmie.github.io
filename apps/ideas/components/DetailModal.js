/**
 * DetailModal 组件 - 想法详情模态框
 */
class IdeasDetailModal {
  constructor(containerId, config, options = {}) {
    this.container = document.getElementById(containerId);
    this.config = config;
    this.onClose = options.onClose || (() => {});
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ideas-modal" id="detailModal">
        <div class="ideas-modal-content" onclick="event.stopPropagation()">
          <div class="ideas-modal-header">
            <button class="ideas-modal-close" id="modalClose">×</button>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #999;" id="modalId">IDEA-001</span>
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; color: #1a1a1a; line-height: 1.3;" id="modalTitle">想法标题</h2>
            <div style="display: flex; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap;">
              <span class="idea-status" id="modalStatus">状态</span>
              <span style="color: #666; font-size: 0.85rem;" id="modalCategory">分类</span>
            </div>
          </div>
          <div class="ideas-modal-body">
            <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem; font-size: 0.95rem;" id="modalDesc">描述内容</p>
            
            <div style="margin-bottom: 1.5rem;">
              <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: #666;">📊 评估维度</h3>
              <div id="modalMetrics"></div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; color: #666;">📝 进展记录</h3>
              <div class="ideas-timeline" id="modalTimeline"></div>
            </div>

            <div style="background: #fafafa; padding: 1rem; border-radius: 8px; border: 1px solid #f0f0f0;">
              <h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #666;">💭 下一步行动</h3>
              <p style="color: #1a1a1a; font-size: 0.9rem; line-height: 1.5; margin: 0;" id="modalNext">下一步计划...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const modal = document.getElementById('detailModal');
    const closeBtn = document.getElementById('modalClose');

    closeBtn.addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });
  }

  show(idea) {
    const statusConfig = this.config.statusConfig[idea.status];
    const categoryConfig = this.config.categoryConfig[idea.category];

    document.getElementById('modalId').textContent = idea.id;
    document.getElementById('modalTitle').textContent = idea.title;
    document.getElementById('modalDesc').textContent = idea.description;
    document.getElementById('modalStatus').textContent = `${statusConfig.icon} ${statusConfig.label}`;
    document.getElementById('modalStatus').className = `idea-status status-${idea.status}`;
    document.getElementById('modalCategory').textContent = `${categoryConfig.icon} ${categoryConfig.label}`;
    document.getElementById('modalNext').textContent = idea.nextStep || '暂无计划';

    // 渲染评估维度
    const metricsHtml = Object.entries(idea.metrics).map(([key, value]) => {
      const label = this.config.metricLabels[key] || key;
      return `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">
          <span style="color: #666; font-size: 0.9rem;">${label}</span>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 80px; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
              <div style="width: ${value * 10}%; height: 100%; background: #1a1a1a;"></div>
            </div>
            <span style="font-family: 'JetBrains Mono', monospace; color: #1a1a1a; min-width: 30px; font-size: 0.85rem;">${value}/10</span>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('modalMetrics').innerHTML = metricsHtml;

    // 渲染时间线
    const timelineHtml = idea.timeline.map(item => `
      <div class="ideas-timeline-item">
        <div class="ideas-timeline-date">${item.date}</div>
        <div class="ideas-timeline-content">${item.content}</div>
      </div>
    `).join('');
    document.getElementById('modalTimeline').innerHTML = timelineHtml;

    document.getElementById('detailModal').classList.add('active');
  }

  close() {
    document.getElementById('detailModal').classList.remove('active');
    this.onClose();
  }
}
