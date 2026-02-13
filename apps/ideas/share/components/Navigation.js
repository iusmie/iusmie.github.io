/**
 * 公共导航组件
 * 支持两种模式：
 * 1. 子页面导航模式（默认）- 用于 pages 下的子页面
 * 2. 主页导航模式（homeNav: true）- 用于 index.html 和 CV.html
 */
class Navigation {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      logoIcon: options.logoIcon || '◆',
      logoImage: options.logoImage || null,
      logoText: options.logoText || 'Bits of Life',
      backLinkText: options.backLinkText || '返回首页',
      homePath: options.homePath || '../index.html',
      homeNav: options.homeNav || false, // 主页导航模式
      navLinks: options.navLinks || [], // 导航链接数组 [{text: 'Home', href: '#', active: true}, ...]
      langSwitcher: options.langSwitcher || false, // 是否显示语言切换
      langSwitcherContainer: options.langSwitcherContainer || null, // 语言切换器渲染到的容器ID（如果指定，则渲染到该容器而不是导航栏）
      langButtons: options.langButtons || [{lang: 'en', text: 'EN'}, {lang: 'zh', text: '中文'}], // 语言按钮
      onLangChange: options.onLangChange || null, // 语言切换回调
      ...options
    };
  }

  render() {
    if (!this.container) return;

    if (this.options.homeNav) {
      this.renderHomeNav();
    } else {
      this.renderSubPageNav();
    }
  }

  renderHomeNav() {
    const logoContent = this.options.logoImage
      ? `<img class="home-logo-icon" src="${this.options.logoImage}" alt="${this.options.logoText}" decoding="sync" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; display: block; visibility: visible;" />`
      : `<div class="home-logo-icon">${this.options.logoIcon}</div>`;

    const navLinksHtml = this.options.navLinks.map(link => {
      const activeClass = link.active ? 'active' : '';
      const dataAttrs = link.dataAttr ? ` ${link.dataAttr}` : '';
      return `<a href="${link.href || '#'}" class="home-nav-link ${activeClass}"${dataAttrs}>${link.text}</a>`;
    }).join('');

    const langSwitcherHtml = this.options.langSwitcher ? `
      <div class="nav-lang-switcher">
        ${this.options.langButtons.map(btn => 
          `<button class="nav-lang-btn" data-lang="${btn.lang}">${btn.text}</button>`
        ).join('')}
      </div>
    ` : '';

    // 如果指定了语言切换器容器，则不将其放在导航栏中
    const langSwitcherInNav = !this.options.langSwitcherContainer;
    
    this.container.innerHTML = `
      <nav class="home-nav">
        <div class="home-logo">
        </div>
        <div class="home-nav-links">
          ${navLinksHtml}
          ${langSwitcherInNav ? langSwitcherHtml : ''}
        </div>
      </nav>
    `;

    // 如果指定了语言切换器容器，渲染到指定容器
    if (this.options.langSwitcher && this.options.langSwitcherContainer) {
      const langContainer = document.getElementById(this.options.langSwitcherContainer);
      if (langContainer) {
        langContainer.innerHTML = langSwitcherHtml;
      }
    }

    // 绑定语言切换事件（从导航栏或指定容器中查找按钮）
    if (this.options.langSwitcher && this.options.onLangChange) {
      const langButtons = document.querySelectorAll('.nav-lang-btn');
      langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const lang = e.target.dataset.lang;
          if (this.options.onLangChange) {
            this.options.onLangChange(lang);
          }
        });
      });
    }
  }

  renderSubPageNav() {
    const logoContent = this.options.logoImage
      ? `<img class="logo-icon" src="${this.options.logoImage}" alt="${this.options.logoText}" decoding="sync" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />`
      : `<div class="logo-icon">${this.options.logoIcon}</div>`;

    this.container.innerHTML = `
      <nav>
        <a href="${this.options.homePath}" class="logo">
          ${logoContent}
          <span>${this.options.logoText}</span>
        </a>
        <a href="${this.options.homePath}" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          ${this.options.backLinkText}
        </a>
      </nav>
    `;
  }
}
