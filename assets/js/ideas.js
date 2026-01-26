// Ideas 管理功能
// Idea 对象结构: { id, name, date, status: 'thinking' | 'completed' | 'abandoned', description }

// 获取所有想法
function getIdeas() {
  const stored = localStorage.getItem('ideas');
  return stored ? JSON.parse(stored) : [];
}

// 保存想法
function saveIdeas(ideas) {
  localStorage.setItem('ideas', JSON.stringify(ideas));
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 渲染想法列表
function renderIdeasList(containerId, status) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const ideas = getIdeas().filter(idea => idea.status === status);
  
  if (ideas.length === 0) {
    const lang = localStorage.getItem('lang') || 'en';
    const emptyText = lang === 'zh' ? '暂无想法' : 'No ideas';
    container.innerHTML = `<div style="text-align: center; color: #999; padding: 40px;">${emptyText}</div>`;
    return;
  }

  // 按时间倒序排序
  ideas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lang = localStorage.getItem('lang') || 'en';
  const actionTexts = {
    zh: { complete: '完成', abandon: '放弃' },
    en: { complete: 'Complete', abandon: 'Abandon' }
  };

  container.innerHTML = ideas.map(idea => {
    // 如果是 thinking 状态，添加操作按钮
    const actionButtons = status === 'thinking' ? `
      <div class="idea-actions">
        <button class="btn-action btn-complete" data-id="${idea.id}" data-action="completed">
          ${actionTexts[lang].complete}
        </button>
        <button class="btn-action btn-abandon" data-id="${idea.id}" data-action="abandoned">
          ${actionTexts[lang].abandon}
        </button>
      </div>
    ` : '';

    return `
      <div class="idea-item">
        <div class="idea-header">
          <div>
            <div class="idea-title">${escapeHtml(idea.name)}</div>
            <div class="idea-meta">
              <span>${formatDate(idea.date)}</span>
              <span class="idea-status ${idea.status}">${getStatusText(idea.status)}</span>
            </div>
          </div>
          ${actionButtons}
        </div>
        <div class="idea-description">${escapeHtml(idea.description).replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }).join('');

  // 绑定操作按钮事件（仅在 thinking 状态下）
  if (status === 'thinking') {
    container.querySelectorAll('.btn-action').forEach(btn => {
      btn.addEventListener('click', function() {
        const ideaId = this.getAttribute('data-id');
        const newStatus = this.getAttribute('data-action');
        updateIdeaStatus(ideaId, newStatus);
      });
    });
  }
}

// 转义HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const lang = localStorage.getItem('lang') || 'en';
  if (lang === 'zh') {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

// 获取状态文本
function getStatusText(status) {
  const lang = localStorage.getItem('lang') || 'en';
  if (lang === 'zh') {
    if (status === 'thinking') return '思考中';
    if (status === 'completed') return '已完成';
    return '已放弃';
  } else {
    if (status === 'thinking') return 'Thinking';
    if (status === 'completed') return 'Completed';
    return 'Abandoned';
  }
}

// 打开弹层
function openModal() {
  const modal = document.getElementById('ideasModal');
  if (modal) {
    modal.classList.add('show');
    renderIdeasList('thinkingList', 'thinking');
    renderIdeasList('completedList', 'completed');
    renderIdeasList('abandonedList', 'abandoned');
    renderIdeasStats();
  }
}

// 关闭弹层
function closeModal() {
  const modal = document.getElementById('ideasModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// 打开表单弹层
function openFormModal(idea) {
  const formModal = document.getElementById('ideaFormModal');
  const form = document.getElementById('ideaForm');
  const formTitle = document.getElementById('formTitle');
  
  if (!formModal || !form || !formTitle) return;

  const lang = localStorage.getItem('lang') || 'en';
  const texts = {
    zh: { add: '新增想法', edit: '编辑想法' },
    en: { add: 'Add Idea', edit: 'Edit Idea' }
  };

  if (idea) {
    // 编辑模式
    formTitle.textContent = texts[lang].edit;
    document.getElementById('ideaName').value = idea.name;
    document.getElementById('ideaDate').value = idea.date;
    document.getElementById('ideaStatus').value = idea.status;
    document.getElementById('ideaDescription').value = idea.description;
    form.dataset.editId = idea.id;
  } else {
    // 新增模式
    formTitle.textContent = texts[lang].add;
    form.reset();
    document.getElementById('ideaDate').value = new Date().toISOString().split('T')[0];
    delete form.dataset.editId;
  }

  formModal.classList.add('show');
}

// 关闭表单弹层
function closeFormModal() {
  const formModal = document.getElementById('ideaFormModal');
  if (formModal) {
    formModal.classList.remove('show');
  }
}

// 切换Tab
function switchTab(tabName) {
  // 更新tab按钮状态
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 更新tab内容
  document.querySelectorAll('.tab-content').forEach(content => {
    if (content.id === `${tabName}Tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// 更新想法状态
function updateIdeaStatus(ideaId, newStatus) {
  const ideas = getIdeas();
  const index = ideas.findIndex(idea => idea.id === ideaId);
  
  if (index !== -1) {
    ideas[index].status = newStatus;
    saveIdeas(ideas);
    
    // 刷新所有列表
    renderIdeasList('thinkingList', 'thinking');
    renderIdeasList('completedList', 'completed');
    renderIdeasList('abandonedList', 'abandoned');
    
    // 刷新统计图
    renderIdeasStats();
    
    // 切换到对应的tab
    switchTab(newStatus);
  }
}

// 保存想法
function saveIdea(event) {
  event.preventDefault();
  
  const form = event.target;
  const name = document.getElementById('ideaName').value;
  const date = document.getElementById('ideaDate').value;
  const status = document.getElementById('ideaStatus').value;
  const description = document.getElementById('ideaDescription').value;

  const ideas = getIdeas();
  const editId = form.dataset.editId;
  const statusValue = status;

  if (editId) {
    // 编辑
    const index = ideas.findIndex(idea => idea.id === editId);
    if (index !== -1) {
      ideas[index] = { id: editId, name, date, status: statusValue, description };
    }
  } else {
    // 新增
    ideas.push({ id: generateId(), name, date, status: statusValue, description });
  }

  saveIdeas(ideas);
  closeFormModal();
  
  // 刷新列表
  renderIdeasList('thinkingList', 'thinking');
  renderIdeasList('completedList', 'completed');
  renderIdeasList('abandonedList', 'abandoned');
  
  // 刷新统计图
  renderIdeasStats();
  
  // 切换到对应的tab
  switchTab(statusValue);
}

// 渲染 Ideas 统计柱形图
function renderIdeasStats() {
  const container = document.getElementById('ideasStatsBar');
  if (!container) return;

  const ideas = getIdeas();
  const stats = {
    thinking: ideas.filter(idea => idea.status === 'thinking').length,
    completed: ideas.filter(idea => idea.status === 'completed').length,
    abandoned: ideas.filter(idea => idea.status === 'abandoned').length
  };

  const total = stats.thinking + stats.completed + stats.abandoned;
  
  if (total === 0) {
    container.innerHTML = '';
    return;
  }

  const lang = localStorage.getItem('lang') || 'en';
  const labels = {
    zh: { thinking: '思考', completed: '完成', abandoned: '放弃' },
    en: { thinking: 'Thinking', completed: 'Completed', abandoned: 'Abandoned' }
  };

  // 计算百分比
  const thinkingPercent = (stats.thinking / total) * 100;
  const completedPercent = (stats.completed / total) * 100;
  const abandonedPercent = (stats.abandoned / total) * 100;

  container.innerHTML = `
    <div class="stats-bar-container" title="${lang === 'zh' ? '思考' : 'Thinking'}: ${stats.thinking}, ${lang === 'zh' ? '完成' : 'Completed'}: ${stats.completed}, ${lang === 'zh' ? '放弃' : 'Abandoned'}: ${stats.abandoned}">
      <div class="stats-bar">
        ${stats.thinking > 0 ? `<div class="stats-segment stats-thinking" style="width: ${thinkingPercent}%"></div>` : ''}
        ${stats.completed > 0 ? `<div class="stats-segment stats-completed" style="width: ${completedPercent}%"></div>` : ''}
        ${stats.abandoned > 0 ? `<div class="stats-segment stats-abandoned" style="width: ${abandonedPercent}%"></div>` : ''}
      </div>
      <div class="stats-labels">
        ${stats.thinking > 0 ? `<span class="stats-label"><span class="stats-dot stats-dot-thinking"></span>${labels[lang].thinking}: ${stats.thinking}</span>` : ''}
        ${stats.completed > 0 ? `<span class="stats-label"><span class="stats-dot stats-dot-completed"></span>${labels[lang].completed}: ${stats.completed}</span>` : ''}
        ${stats.abandoned > 0 ? `<span class="stats-label"><span class="stats-dot stats-dot-abandoned"></span>${labels[lang].abandoned}: ${stats.abandoned}</span>` : ''}
      </div>
    </div>
  `;
}

// 绑定 Ideas 触发事件
function bindIdeasTrigger() {
  document.querySelectorAll('.ideas-trigger').forEach(trigger => {
    // 移除旧的事件监听器
    const newTrigger = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(newTrigger, trigger);
    // 绑定新的事件
    newTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 渲染统计图
  renderIdeasStats();
  
  // 绑定打开弹层事件
  bindIdeasTrigger();
  
  // 延迟绑定，确保在 i18n.js 执行后
  setTimeout(() => {
    bindIdeasTrigger();
    renderIdeasStats();
  }, 200);

  // 绑定关闭弹层事件
  const closeBtn = document.getElementById('closeModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // 点击背景关闭弹层
  const modal = document.getElementById('ideasModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // 绑定Tab切换事件
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // 绑定新增按钮事件
  const addBtn = document.getElementById('addIdeaBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openFormModal();
    });
  }

  // 绑定表单提交事件
  const form = document.getElementById('ideaForm');
  if (form) {
    form.addEventListener('submit', saveIdea);
  }

  // 绑定关闭表单事件
  const closeFormBtn = document.getElementById('closeFormBtn');
  const cancelFormBtn = document.getElementById('cancelFormBtn');
  if (closeFormBtn) {
    closeFormBtn.addEventListener('click', closeFormModal);
  }
  if (cancelFormBtn) {
    cancelFormBtn.addEventListener('click', closeFormModal);
  }

  // 点击表单背景关闭
  const formModal = document.getElementById('ideaFormModal');
  if (formModal) {
    formModal.addEventListener('click', (e) => {
      if (e.target === formModal) {
        closeFormModal();
      }
    });
  }
});
