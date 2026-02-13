/**
 * 浮动操作按钮组件
 * 负责添加新问题的按钮
 */
class FAB {
  constructor(containerId, onClick) {
    this.container = document.getElementById(containerId);
    this.onClick = onClick;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <button class="fab" id="fabBtn" title="添加新问题">+</button>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const btn = document.getElementById('fabBtn');
    if (btn && this.onClick) {
      btn.addEventListener('click', () => {
        if (this.onClick) {
          this.onClick();
        }
      });
    }
  }
}
