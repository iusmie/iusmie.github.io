/**
 * FAB 组件 - 浮动操作按钮（添加新想法）
 */
class IdeasFAB {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onClick = options.onClick || (() => {});
    this.fabButton = null;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <button class="ideas-fab" id="ideasFab" title="添加新想法">+</button>
    `;

    // 延迟绑定事件，确保 DOM 已更新
    setTimeout(() => {
      this.attachEvents();
    }, 0);
  }

  attachEvents() {
    const fab = document.getElementById('ideasFab');
    if (fab) {
      // 移除旧的事件监听器（如果存在）
      const newFab = fab.cloneNode(true);
      fab.parentNode.replaceChild(newFab, fab);
      
      // 绑定新的事件监听器
      newFab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('FAB clicked'); // 调试用
        if (this.onClick && typeof this.onClick === 'function') {
          this.onClick();
        }
      });
      
      this.fabButton = newFab;
    }
  }
}
