// 多语言配置
const translations = {
  zh: {
    experiences: 'Experiences',
    exp_desc: `项目描述和主要功能。这是一个XXX项目，实现了XXX功能。
              <ul>
                <li>使用XXX技术栈开发</li>
                <li>实现了XXX功能，提升了XX%的效率</li>
                <li>项目链接：<a href="#" target="_blank">GitHub</a></li>
              </ul>`,
    tools: '工具',
    tools_projects: 'Tools & Projects',
    remarks: '备注',
    study_tools: '🌍 生活工具',
    world_clock: '多时区时钟',
    exchange_rate: '汇率工具',
    visa: '签证办理',
    dev_tools: '🛠️ 开发工具',
    markdown_tool: 'Markdown工具',
    timestamp: '时间戳转换',
    ideas: '💡 一些YY',
    thinking: '思考中',
    completed: '已完成',
    abandoned: '已放弃',
    add: '新增',
    add_idea: '新增想法',
    idea_name: '想法名称',
    idea_date: '时间',
    idea_status: '状态',
    idea_description: '想法说明',
    cancel: '取消',
    save: '保存'
  },
  en: {
    experiences: 'Experiences',
    exp_desc: `Project description and main features. This is an XXX project that implements XXX functionality.
              <ul>
                <li>Developed using XXX tech stack</li>
                <li>Implemented XXX feature, improving efficiency by XX%</li>
                <li>Project link: <a href="#" target="_blank">GitHub</a></li>
              </ul>`,
    tools: 'Tools',
    tools_projects: 'Tools & Projects',
    remarks: 'Remarks',
    study_tools: '🌍 Life Tools',
    world_clock: 'World Clock',
    exchange_rate: 'Exchange Rate',
    visa: 'Visa Guide',
    dev_tools: '🛠️ Dev Tools',
    markdown_tool: 'Markdown Tools',
    timestamp: 'Timestamp',
    ideas: '💡 Ideas',
    thinking: 'Thinking',
    completed: 'Completed',
    abandoned: 'Abandoned',
    add: 'Add',
    add_idea: 'Add Idea',
    idea_name: 'Idea Name',
    idea_date: 'Date',
    idea_status: 'Status',
    idea_description: 'Description',
    cancel: 'Cancel',
    save: 'Save'
  }
};

// 获取当前语言
function getCurrentLang() {
  return localStorage.getItem('lang') || 'en';
}

// 设置语言
function setLang(lang) {
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  updateContent(lang);
  updateLangButtons(lang);
}

// 更新内容
function updateContent(lang) {
  const texts = translations[lang];
  
  // 更新所有带有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (texts[key]) {
      if (element.tagName === 'A' || element.tagName === 'BUTTON') {
        element.textContent = texts[key];
      } else {
        element.innerHTML = texts[key];
      }
    }
  });
  
  // 更新 select 选项
  const thinkingOption = document.querySelector('#ideaStatus option[value="thinking"]');
  const completedOption = document.querySelector('#ideaStatus option[value="completed"]');
  const abandonedOption = document.querySelector('#ideaStatus option[value="abandoned"]');
  if (thinkingOption && texts.thinking) {
    thinkingOption.textContent = texts.thinking;
  }
  if (completedOption && texts.completed) {
    completedOption.textContent = texts.completed;
  }
  if (abandonedOption && texts.abandoned) {
    abandonedOption.textContent = texts.abandoned;
  }
  
  // 如果弹层打开，刷新想法列表
  const modal = document.getElementById('ideasModal');
  if (modal && modal.classList.contains('show')) {
    if (typeof renderIdeasList === 'function') {
      renderIdeasList('thinkingList', 'thinking');
      renderIdeasList('completedList', 'completed');
      renderIdeasList('abandonedList', 'abandoned');
    }
  }
  
  // 刷新统计图
  if (typeof renderIdeasStats === 'function') {
    renderIdeasStats();
  }
  
  // 重新绑定 ideas trigger 事件（在 i18n 更新后）
  if (typeof bindIdeasTrigger === 'function') {
    setTimeout(bindIdeasTrigger, 50);
  }
}

// 更新语言按钮状态
function updateLangButtons(lang) {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const currentLang = getCurrentLang();
  setLang(currentLang);
  
  // 绑定语言切换按钮事件
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLang(lang);
    });
  });
});
