/**
 * Hero 组件
 */
class Hero {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(stats, xiaohongshu) {
    if (!this.container) return;

    const xhsLink = xiaohongshu ? `
      <a href="${xiaohongshu.url}" target="_blank" class="xhs-link">
        📕 小红书：${xiaohongshu.username}
      </a>
    ` : '';

    this.container.innerHTML = `
      <h1 class="hero-title hero-formula">
        <span class="formula-item">${stats.cats}只猫</span>
        <span class="formula-operator">+</span>
        <span class="formula-item">${stats.dogs}个狗</span>
        <span class="formula-operator">+</span>
        <span class="formula-item">${stats.personalities}个个性</span>
        <span class="formula-operator">=</span>
        <span class="formula-result">∞份快乐</span>
      </h1>
      <p class="hero-desc">
      ${xhsLink}
      </p>
    `;
  }
}
