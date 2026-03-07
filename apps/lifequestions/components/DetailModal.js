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
          <button class="modal-close" id="modalCloseBtn" aria-label="关闭">×</button>
          <div id="modalQuestionNumber" class="modal-question-number"></div>
          <h2 id="modalQuestionTitle" class="modal-question-title"></h2>
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
          <div class="answer-content">${this.renderAnswerContent(answer, question)}</div>
        </div>
      `).join('');
      // 001 的 markdown-file 仅展示文档链接，不加载全文
      if (question.number !== '001') {
        this.loadMarkdownAnswers(bodyEl);
      }
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

  renderAnswerContent(answer, question) {
    if (answer.type === 'markdown-file' && answer.path) {
      // 001 仅展示关联文档链接，不加载全文
      if (question && question.number === '001') {
        const docName = answer.label.replace(/^正文[（(]\d+[）)]\s*/, '') || '查看文档';
        return `<a href="${answer.path}" target="_blank" rel="noopener" class="doc-link-card">
          <span class="doc-link-icon">📄</span>
          <span class="doc-link-title">${this.escapeHtml(docName)}</span>
          <span class="doc-link-arrow">→</span>
        </a>`;
      }
      return `<div class="markdown-file-block" data-markdown-path="${answer.path}" style="font-size: 0.95rem; color: #666;">正在加载文档内容...</div>`;
    }
    return answer.content || '';
  }

  async loadMarkdownAnswers(container) {
    const blocks = container.querySelectorAll('.markdown-file-block[data-markdown-path]');
    if (!blocks.length) return;

    for (const block of blocks) {
      const path = block.dataset.markdownPath;
      if (!path) continue;
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const markdown = await response.text();
        block.innerHTML = this.renderMarkdown(markdown);
      } catch (error) {
        block.innerHTML = `<div style="color: #c62828;">文档加载失败：${this.escapeHtml(path)}</div>`;
      }
    }
  }

  // 简单的Markdown渲染器
  renderMarkdown(markdown) {
    let html = markdown;
    
    // 转义HTML（但保留代码块）
    const codeBlocks = [];
    html = html.replace(/```[\s\S]*?```/g, (match) => {
      const idx = codeBlocks.length;
      codeBlocks.push(match);
      return `%%CODEBLOCK${idx}%%`;
    });
    
    // 转义HTML标签
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // 恢复代码块
    codeBlocks.forEach((block, idx) => {
      html = html.replace(`%%CODEBLOCK${idx}%%`, block);
    });
    
    // 标题
    html = html.replace(/^### (.*$)/gm, '<h3 style="margin: 1.5rem 0 0.75rem; font-size: 1.1rem; font-weight: 600; color: #1a1a1a;">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 style="margin: 2rem 0 1rem; font-size: 1.3rem; font-weight: 700; color: #1a1a1a; border-bottom: 2px solid #e8e8e8; padding-bottom: 0.5rem;">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 style="margin: 2rem 0 1rem; font-size: 1.5rem; font-weight: 700; color: #1a1a1a;">$1</h1>');
    
    // 粗体和斜体
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 代码（行内）
    html = html.replace(/`([^`]+)`/g, '<code style="background: #f0f0f0; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.9em; font-family: Menlo, Monaco, monospace; color: #e53935;">$1</code>');
    
    // 代码块
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="markdown-pre"><code>${code.trim()}</code></pre>`;
    });

    // 表格 - 支持多列，提取表格块再解析
    const tableBlocks = [];
    html = html.replace(/(?:^|\n)((?:\|[^\n]+\|\n?)+)/gm, (match, tableText) => {
      const lines = tableText.trim().split('\n').filter(l => l.trim());
      if (lines.length < 1) return match;
      const rows = lines.map(line => {
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        return cells;
      });
      const isHeaderSeparator = (cells) => cells.every(c => /^[-:]+$/.test(c));
      let thead = '';
      let tbody = '';
      let start = 0;
      if (rows.length > 1 && isHeaderSeparator(rows[1])) {
        thead = `<thead><tr>${rows[0].map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
        start = 2;
      }
      tbody = `<tbody>${rows.slice(start).map(row =>
        `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`
      ).join('')}</tbody>`;
      const idx = tableBlocks.length;
      tableBlocks.push(`<div class="table-wrapper"><table>${thead}${tbody}</table></div>`);
      return `%%TABLE${idx}%%`;
    });
    tableBlocks.forEach((block, idx) => {
      html = html.replace(`%%TABLE${idx}%%`, block);
    });
    
    // 引用块
    html = html.replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #667eea; padding-left: 1rem; margin: 1rem 0; color: #555; font-style: italic;">$1</blockquote>');
    
    // 无序列表
    html = html.replace(/^- (.*$)/gm, '<li style="margin: 0.4rem 0; padding-left: 0.5rem;">$1</li>');
    html = html.replace(/(<li.*?>.*?<\/li>\n?)+/g, '<ul style="margin: 0.75rem 0; padding-left: 1.25rem;">$&</ul>');
    
    // 有序列表
    html = html.replace(/^\d+\. (.*$)/gm, '<li style="margin: 0.4rem 0; padding-left: 0.5rem;">$1</li>');
    
    // 分隔线
    html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 2rem 0;">');
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #667eea; text-decoration: none;" target="_blank">$1</a>');
    
    // 段落（排除已有块级元素）
    html = html.replace(/^(?!<[huoplb]|<pre|<table|<blockquote|<div)(.+)$/gm, '<p style="margin: 0.75rem 0; line-height: 1.8; color: #333;">$1</p>');
    
    // 清理空段落
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
