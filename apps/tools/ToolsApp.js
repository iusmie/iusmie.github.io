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
    // 渲染弹层并绑定事件
    this.renderModal();
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

    if (tool.type === 'modal' && tool.modalContent) {
      return `
        <div class="tools-card tools-card-modal" data-tool-id="${tool.id}" role="button" tabindex="0">
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
        </div>
      `;
    }

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

  renderModal() {
    const modal = document.getElementById('toolsDetailModal');
    if (modal) return;
    const modalHTML = `
      <div class="tools-modal" id="toolsDetailModal" aria-hidden="true">
        <div class="tools-modal-backdrop"></div>
        <div class="tools-modal-box" role="dialog" aria-modal="true">
          <button type="button" class="tools-modal-close" aria-label="关闭">×</button>
          <div class="tools-modal-content" id="toolsModalContent"></div>
        </div>
      </div>
    `;
    this.container.insertAdjacentHTML('beforeend', modalHTML);
    this.bindModalEvents();
  }

  bindModalEvents() {
    const modal = document.getElementById('toolsDetailModal');
    const closeBtn = modal?.querySelector('.tools-modal-close');
    const backdrop = modal?.querySelector('.tools-modal-backdrop');
    const modalBox = modal?.querySelector('.tools-modal-box');

    const closeModal = () => this.closeModal();

    closeBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);
    modalBox?.addEventListener('click', (e) => e.stopPropagation());
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
    });

    this.container.addEventListener('click', (e) => {
      const card = e.target.closest('.tools-card-modal');
      if (card) {
        const toolId = card.getAttribute('data-tool-id');
        const tool = this.findToolById(toolId);
        if (tool?.modalContent) this.openModal(tool).catch(err => console.error('ToolsApp: 打开弹层失败', err));
      }
    });
    this.container.addEventListener('keydown', (e) => {
      const card = e.target.closest('.tools-card-modal');
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        card.click();
      }
    });
  }

  findToolById(id) {
    for (const cat of this.toolsData.categories || []) {
      const tool = (cat.tools || []).find(t => String(t.id) === String(id));
      if (tool) return tool;
    }
    return null;
  }

  markdownToHtml(text) {
    if (!text) return '';
    if (typeof marked !== 'undefined') {
      return marked.parse(text, { gfm: true, breaks: true });
    }
    return text.replace(/\n/g, '<br>');
  }

  async openModal(tool) {
    const modal = document.getElementById('toolsDetailModal');
    const contentEl = document.getElementById('toolsModalContent');
    if (!modal || !contentEl || !tool.modalContent) return;

    const mc = tool.modalContent;

    // 支持多 tab 弹层
    if (mc.tabs && Array.isArray(mc.tabs) && mc.tabs.length > 0) {
      await this.openTabbedModal(modal, contentEl, tool, mc);
      return;
    }

    const renderMethod = (method) => {
      if (method.content) {
        return `<div class="tools-modal-text tools-modal-markdown">${this.markdownToHtml(method.content)}</div>`;
      }
      if (method.steps && method.steps.length > 0) {
        const stepsHTML = method.steps.map((s, i) => `
          <div class="tools-modal-step">
            <h4 class="tools-modal-step-title">${i + 1}. ${s.title}</h4>
            <div class="tools-modal-step-content tools-modal-markdown">${this.markdownToHtml(s.content)}</div>
          </div>
        `).join('');
        return stepsHTML;
      }
      return '';
    };

    const methodsHTML = (mc.methods && mc.methods.length >= 2) ? `
      <div class="tools-modal-methods">
        <div class="tools-modal-method tools-modal-method-left">
          <h4 class="tools-modal-method-title">${mc.methods[0].title}</h4>
          ${renderMethod(mc.methods[0])}
        </div>
        <div class="tools-modal-method tools-modal-method-right">
          <h4 class="tools-modal-method-title">${mc.methods[1].title}</h4>
          ${renderMethod(mc.methods[1])}
        </div>
      </div>
    ` : (() => {
      const stepsHTML = (mc.steps || []).map((s, i) => `
        <div class="tools-modal-step">
          <h4 class="tools-modal-step-title">${i + 1}. ${s.title}</h4>
          <div class="tools-modal-step-content tools-modal-markdown">${this.markdownToHtml(s.content)}</div>
        </div>
      `).join('');
      return stepsHTML;
    })();

    const photosToolHTML = mc.photosToolIntro ? `
        <section class="tools-modal-section">
          <h2 class="tools-modal-section-title">${mc.photosToolIntro.title || '苹果系统的图片工具'}</h2>
          <div class="tools-modal-text tools-modal-markdown">${this.markdownToHtml(mc.photosToolIntro.content || '')}</div>
        </section>
    ` : '';

    contentEl.innerHTML = `
      <div class="tools-modal-header">
        <h2 class="tools-modal-title">${tool.name}</h2>
      </div>
      <div class="tools-modal-body">
        ${photosToolHTML}
        <section class="tools-modal-section">
          <h2 class="tools-modal-section-title">备份方案</h2>
          ${methodsHTML}
        </section>
        ${mc.otherIssues ? `
        <section class="tools-modal-section">
          <h2 class="tools-modal-section-title">附录</h2>
          <div class="tools-modal-text tools-modal-markdown">${this.markdownToHtml(mc.otherIssues)}</div>
        </section>
        ` : ''}
      </div>
    `;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  async openTabbedModal(modal, contentEl, tool, mc) {
    const dataBase = '../apps/tools/data/';
    const tabs = mc.tabs;

    const tabContents = await Promise.all(tabs.map(async (tab) => {
      let content = tab.content || '';
      if (tab.contentFile) {
        try {
          const res = await fetch(dataBase + tab.contentFile);
          if (res.ok) content = await res.text();
        } catch (e) {
          content = `加载失败: ${tab.contentFile}`;
        }
      }
      return { title: tab.title, content };
    }));

    const tabsHTML = tabs.map((t, i) =>
      `<button type="button" class="tools-modal-tab-btn ${i === 0 ? 'active' : ''}" data-tab-index="${i}" aria-selected="${i === 0}">${t.title}</button>`
    ).join('');

    const panesHTML = tabContents.map((tc, i) =>
      `<div class="tools-modal-tab-pane ${i === 0 ? 'active' : ''}" data-tab-index="${i}"><div class="tools-modal-text tools-modal-markdown">${this.markdownToHtml(tc.content)}</div></div>`
    ).join('');

    contentEl.innerHTML = `
      <div class="tools-modal-header">
        <h2 class="tools-modal-title">${tool.name}</h2>
      </div>
      <div class="tools-modal-tabs">
        ${tabsHTML}
      </div>
      <div class="tools-modal-body tools-modal-body-tabs">
        ${panesHTML}
      </div>
    `;

    contentEl.querySelectorAll('.tools-modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-tab-index');
        contentEl.querySelectorAll('.tools-modal-tab-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-tab-index') === idx);
          b.setAttribute('aria-selected', b.getAttribute('data-tab-index') === idx);
        });
        contentEl.querySelectorAll('.tools-modal-tab-pane').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-tab-index') === idx);
        });
      });
    });

    this.renderMermaid(contentEl);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  renderMermaid(container) {
    if (typeof mermaid === 'undefined') return;
    const blocks = container.querySelectorAll('pre > code.language-mermaid');
    blocks.forEach((code) => {
      const pre = code.closest('pre');
      const wrapper = document.createElement('div');
      wrapper.className = 'tools-mermaid-wrapper';
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = code.textContent;
      wrapper.appendChild(mermaidDiv);
      pre.replaceWith(wrapper);
    });
    mermaid.run({ nodes: container.querySelectorAll('.mermaid') }).catch(() => {});
  }

  closeModal() {
    const modal = document.getElementById('toolsDetailModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
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
