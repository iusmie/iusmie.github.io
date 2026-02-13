/**
 * 养猫经验组件
 */
class TipsSection {
  constructor(containerId, tips, costs) {
    this.container = document.getElementById(containerId);
    this.tips = tips;
    this.costs = costs;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="tips-section">
        <div class="tips-grid">
          ${this.tips.map(tip => `
            <div class="tip-card">
              <div class="tip-icon">${tip.icon}</div>
              <h3 class="tip-title">${tip.title}</h3>
              <p class="tip-content">${tip.content}</p>
            </div>
          `).join('')}
        </div>

        <div class="costs-section">
          <h3 class="costs-title">💰 6猫1狗年度开销参考</h3>
          <div class="costs-grid">
            <div class="cost-item">
              <div class="cost-amount">¥${this.costs.catFood}</div>
              <div class="cost-label">猫粮</div>
            </div>
            <div class="cost-item">
              <div class="cost-amount">¥${this.costs.catLitter}</div>
              <div class="cost-label">猫砂</div>
            </div>
            <div class="cost-item">
              <div class="cost-amount">¥${this.costs.snacks}</div>
              <div class="cost-label">零食/罐头</div>
            </div>
            <div class="cost-item">
              <div class="cost-amount">¥${this.costs.healthcare}</div>
              <div class="cost-label">医疗保健</div>
            </div>
            <div class="cost-item">
              <div class="cost-amount">¥${this.costs.deviceExpenses}</div>
              <div class="cost-label">设备开销</div>
            </div>
          </div>
          <p class="costs-total">
            总计约 ¥${this.costs.total}/年（不含大病医疗）
          </p>
        </div>
      </div>
    `;
  }
}
