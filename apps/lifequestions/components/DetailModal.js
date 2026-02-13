/**
 * 详情模态框组件
 * 负责显示问题的详细信息和答案
 */
class DetailModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.isOpen = false;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <button class="modal-close" id="modalCloseBtn">×</button>
          <div id="modalQuestionNumber" style="font-size: 0.85rem; color: #999; margin-bottom: 0.5rem; letter-spacing: 0.1em;"></div>
          <h2 id="modalQuestionTitle" style="font-size: 2rem; font-weight: 700;"></h2>
        </div>
        <div class="modal-body" id="modalBody">
          <!-- 动态内容 -->
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // 关闭按钮
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // 点击背景关闭
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(question) {
    if (!this.container) return;

    // 更新标题
    const numberEl = document.getElementById('modalQuestionNumber');
    const titleEl = document.getElementById('modalQuestionTitle');
    const bodyEl = document.getElementById('modalBody');

    if (numberEl) numberEl.textContent = `QUESTION ${question.number}`;
    if (titleEl) titleEl.textContent = question.title;

    // 构建答案内容
    if (bodyEl && question.answers && question.answers.length > 0) {
      bodyEl.innerHTML = question.answers.map(answer => `
        <div class="answer-section">
          <div class="answer-label">${answer.label}</div>
          <div class="answer-content">${answer.content}</div>
        </div>
      `).join('');
    } else if (bodyEl) {
      bodyEl.innerHTML = '<div class="answer-section"><div class="answer-content" style="color: #999; text-align: center; padding: 2rem;">暂无答案内容</div></div>';
    }

    // 显示模态框
    this.container.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
  }

  close() {
    if (!this.container) return;

    this.container.classList.remove('active');
    document.body.style.overflow = '';
    this.isOpen = false;
  }

  isModalOpen() {
    return this.isOpen;
  }
}
