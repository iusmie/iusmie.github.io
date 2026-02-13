/**
 * AddIdeaModal 组件 - 添加新想法的表单模态框
 */
class IdeasAddIdeaModal {
  constructor(containerId, config, options = {}) {
    this.container = document.getElementById(containerId);
    this.config = config;
    this.onSubmit = options.onSubmit || (() => {});
    this.onClose = options.onClose || (() => {});
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ideas-add-modal" id="addIdeaModal">
        <div class="ideas-add-modal-content" onclick="event.stopPropagation()">
          <div class="ideas-add-modal-header">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #1a1a1a;">添加新想法</h2>
            <button class="ideas-modal-close" id="addModalClose">×</button>
          </div>
          <div class="ideas-add-modal-body">
            <form id="addIdeaForm">
              <div class="form-group">
                <label for="ideaTitle">想法标题 *</label>
                <input type="text" id="ideaTitle" name="title" required placeholder="输入想法标题" />
              </div>
              
              <div class="form-group">
                <label for="ideaDesc">简短描述</label>
                <textarea id="ideaDesc" name="description" rows="3" placeholder="输入简短描述"></textarea>
              </div>
              
              <div class="form-group">
                <label for="ideaCategory">分类</label>
                <select id="ideaCategory" name="category">
                  <option value="product">📱 产品</option>
                  <option value="content">📝 内容</option>
                  <option value="tool">🛠️ 工具</option>
                  <option value="business">💼 商业</option>
                  <option value="lifestyle">✨ 生活方式</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="ideaStatus">状态</label>
                <select id="ideaStatus" name="status">
                  <option value="seed">🌱 种子期</option>
                  <option value="sprout">🌿 发芽期</option>
                  <option value="growing">🌳 生长期</option>
                  <option value="fruit">🍎 结果期</option>
                  <option value="withered">🍂 已归档</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="ideaTags">标签（用逗号分隔）</label>
                <input type="text" id="ideaTags" name="tags" placeholder="例如：AI, 工具, 效率" />
              </div>
              
              <div class="form-actions">
                <button type="button" class="ideas-form-btn cancel" id="cancelBtn">取消</button>
                <button type="submit" class="ideas-form-btn submit">添加</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const modal = document.getElementById('addIdeaModal');
    const closeBtn = document.getElementById('addModalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('addIdeaForm');

    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => this.close());
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  handleSubmit() {
    const form = document.getElementById('addIdeaForm');
    const formData = new FormData(form);
    
    const ideaData = {
      title: formData.get('title'),
      description: formData.get('description') || '暂无描述',
      category: formData.get('category') || 'product',
      status: formData.get('status') || 'seed',
      tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t) : ['新想法']
    };

    if (!ideaData.title) {
      alert('请输入想法标题');
      return;
    }

    this.onSubmit(ideaData);
    this.close();
  }

  show() {
    document.getElementById('addIdeaModal').classList.add('active');
    // 聚焦到标题输入框
    setTimeout(() => {
      document.getElementById('ideaTitle').focus();
    }, 100);
  }

  close() {
    document.getElementById('addIdeaModal').classList.remove('active');
    // 清空表单
    const form = document.getElementById('addIdeaForm');
    if (form) {
      form.reset();
    }
    this.onClose();
  }
}
