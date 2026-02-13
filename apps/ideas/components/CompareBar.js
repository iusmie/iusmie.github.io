/**
 * CompareBar 组件 - 对比模式悬浮栏
 */
class IdeasCompareBar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onCompare = options.onCompare || (() => {});
    this.onClear = options.onClear || (() => {});
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ideas-compare-mode" id="compareBar">
        <span style="color: #666;">已选择 <span class="ideas-compare-count" id="compareCount">0</span> 个想法</span>
        <button class="ideas-compare-btn" id="compareBtn">开始对比</button>
        <button class="ideas-data-btn" id="clearCompareBtn">清空</button>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    document.getElementById('compareBtn')?.addEventListener('click', () => {
      this.onCompare();
    });

    document.getElementById('clearCompareBtn')?.addEventListener('click', () => {
      this.onClear();
    });
  }

  update(count) {
    const compareCount = document.getElementById('compareCount');
    const compareBar = document.getElementById('compareBar');
    
    if (compareCount) {
      compareCount.textContent = count;
    }
    
    if (compareBar) {
      if (count > 0) {
        compareBar.classList.add('active');
      } else {
        compareBar.classList.remove('active');
      }
    }
  }
}
