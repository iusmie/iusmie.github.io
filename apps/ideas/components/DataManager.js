/**
 * DataManager 组件 - 数据维护功能
 */
class IdeasDataManager {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onDataChange = options.onDataChange || (() => {});
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ideas-data-section">
        <div class="ideas-data-header">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">🛠 数据维护</h2>
            <p style="color: #666; font-size: 0.9rem;">复制下方 JSON 进行备份或编辑后导入</p>
          </div>
          <div class="ideas-data-actions">
            <button class="ideas-data-btn" id="copyDataBtn">📋 复制数据</button>
            <button class="ideas-data-btn" id="exportDataBtn">💾 导出 JSON</button>
            <button class="ideas-data-btn primary" id="importDataBtn">📥 导入数据</button>
          </div>
        </div>
        <div class="ideas-json-preview" id="jsonPreview"></div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    document.getElementById('copyDataBtn').addEventListener('click', () => this.copyData());
    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
    document.getElementById('importDataBtn').addEventListener('click', () => this.importData());
  }

  updatePreview(data) {
    document.getElementById('jsonPreview').textContent = JSON.stringify(data, null, 2);
  }

  copyData() {
    const text = document.getElementById('jsonPreview').textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert('数据已复制到剪贴板！');
    }).catch(() => {
      alert('复制失败，请手动选择文本复制');
    });
  }

  exportData() {
    const text = document.getElementById('jsonPreview').textContent;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ideas-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.ideas && Array.isArray(data.ideas)) {
            this.onDataChange(data);
            alert('数据导入成功！');
          } else {
            alert('数据格式错误');
          }
        } catch (err) {
          alert('解析失败：' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
}
