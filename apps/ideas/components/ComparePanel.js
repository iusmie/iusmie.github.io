/**
 * ComparePanel 组件 - 想法对比面板
 */
class IdeasComparePanel {
  constructor(containerId, config, options = {}) {
    this.container = document.getElementById(containerId);
    this.config = config;
    this.onClose = options.onClose || (() => {});
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ideas-compare-panel" id="comparePanel" onclick="event.stopPropagation()">
        <div class="ideas-compare-content">
          <div class="ideas-compare-header">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #1a1a1a;">⚖ 想法对比分析</h2>
            <button class="ideas-modal-close" id="compareClose">×</button>
          </div>
          <div class="ideas-compare-grid" id="compareGrid"></div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const panel = document.getElementById('comparePanel');
    const closeBtn = document.getElementById('compareClose');

    closeBtn.addEventListener('click', () => this.close());
    panel.addEventListener('click', (e) => {
      if (e.target === panel) this.close();
    });
  }

  show(ideas) {
    if (!ideas || ideas.length === 0) return;

    // 计算总分
    const ideasWithScore = ideas.map(idea => {
      const totalScore = Object.values(idea.metrics).reduce((sum, val) => sum + val, 0);
      return { ...idea, totalScore };
    });

    // 找出最高分
    const maxScore = Math.max(...ideasWithScore.map(i => i.totalScore));
    const winner = ideasWithScore.find(i => i.totalScore === maxScore);

    const compareHtml = ideasWithScore.map(idea => {
      const isWinner = idea.id === winner.id;
      const statusConfig = this.config.statusConfig[idea.status];
      
      return `
        <div class="ideas-compare-card ${isWinner ? 'winner' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
            <h3 style="font-size: 1.1rem; font-weight: 600; color: #1a1a1a; line-height: 1.3;">${idea.title}</h3>
            <span class="idea-status status-${idea.status}">${statusConfig.icon} ${statusConfig.label}</span>
          </div>
          <p style="color: #666; margin-bottom: 1rem; line-height: 1.5; font-size: 0.9rem;">${idea.description}</p>
          
          <div style="margin-bottom: 1rem;">
            ${Object.entries(idea.metrics).map(([key, value]) => {
              const label = this.config.metricLabels[key] || key;
              return `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                  <span style="color: #666; font-size: 0.85rem;">${label}</span>
                  <span style="font-family: 'JetBrains Mono', monospace; color: #1a1a1a; font-size: 0.85rem;">${value}/10</span>
                </div>
              `;
            }).join('')}
          </div>

          <div style="border-top: 1px solid #f0f0f0; padding-top: 0.75rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #666; font-size: 0.9rem;">总评分</span>
              <span style="font-size: 1.25rem; font-weight: 700; color: ${isWinner ? '#10b981' : '#1a1a1a'};">${idea.totalScore}/50</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 0.4rem;">
              <span style="color: #666; font-size: 0.9rem;">进度</span>
              <span style="font-weight: 600; color: #1a1a1a; font-size: 0.9rem;">${idea.progress}%</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('compareGrid').innerHTML = compareHtml;
    document.getElementById('comparePanel').classList.add('active');
  }

  close() {
    document.getElementById('comparePanel').classList.remove('active');
    this.onClose();
  }
}
