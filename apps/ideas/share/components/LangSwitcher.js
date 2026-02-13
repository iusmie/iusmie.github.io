/**
 * 语言切换组件
 * 独立的语言切换器组件
 */
class LangSwitcher {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      langButtons: options.langButtons || [
        { lang: 'en', text: 'EN' },
        { lang: 'zh', text: '中文' }
      ],
      onLangChange: options.onLangChange || null,
      currentLang: options.currentLang || null,
      ...options
    };
  }

  render() {
    if (!this.container) return;

    const currentLang = this.options.currentLang || localStorage.getItem('lang') || 'en';

    this.container.innerHTML = `
      <div class="nav-lang-switcher">
        ${this.options.langButtons.map(btn => {
          const activeClass = btn.lang === currentLang ? 'active' : '';
          return `<button class="nav-lang-btn ${activeClass}" data-lang="${btn.lang}">${btn.text}</button>`;
        }).join('')}
      </div>
    `;

    // 绑定事件
    const langButtons = this.container.querySelectorAll('.nav-lang-btn');
    langButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        
        // 更新按钮状态
        langButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // 调用回调
        if (this.options.onLangChange) {
          this.options.onLangChange(lang);
        }
      });
    });
  }

  updateActiveLang(lang) {
    const langButtons = this.container.querySelectorAll('.nav-lang-btn');
    langButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.lang === lang) {
        btn.classList.add('active');
      }
    });
  }
}
