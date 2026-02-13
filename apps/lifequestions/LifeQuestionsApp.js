/**
 * 人生几多问主应用
 * 负责协调各个组件和数据管理
 */
class LifeQuestionsApp {
  constructor() {
    this.questions = [];
    this.filteredQuestions = [];
    this.components = {};
  }

  async init() {
    // 加载数据
    await this.loadData();

    // 初始化组件
    this.initComponents();

    // 渲染页面
    this.render();

    // 绑定事件
    this.attachEventListeners();

    // 添加入场动画
    this.addEntranceAnimation();
  }

  async loadData() {
    try {
      // 从 HTML 文件位置计算相对路径
      const response = await fetch('../apps/lifequestions/data/questions-data.json');
      const data = await response.json();
      this.questions = data.questions || [];
      this.filteredQuestions = [...this.questions];
    } catch (error) {
      console.error('加载数据失败:', error);
      this.questions = [];
      this.filteredQuestions = [];
    }
  }

  initComponents() {
    // Hero 组件
    this.components.hero = new Hero('heroContainer');

    // 模态框组件
    this.components.modal = new DetailModal('detailModal');

    // FAB 组件
    this.components.fab = new FAB('fabContainer', () => {
      this.addNewQuestion();
    });
  }

  render() {
    // 渲染 Hero
    if (this.components.hero) {
      this.components.hero.render();
    }

    // 渲染问题卡片
    this.renderQuestions();

    // 渲染模态框
    if (this.components.modal) {
      this.components.modal.render();
    }

    // 渲染 FAB
    if (this.components.fab) {
      this.components.fab.render();
    }
  }

  renderQuestions() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    if (this.filteredQuestions.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 4rem; color: #999;">暂无问题</div>';
      return;
    }

    container.innerHTML = this.filteredQuestions.map(question => {
      const card = new QuestionCard(question);
      return card.render();
    }).join('');

    // 绑定卡片点击事件
    this.attachCardEvents();
  }

  attachCardEvents() {
    const cards = document.querySelectorAll('.question-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const questionId = parseInt(card.dataset.id);
        const question = this.questions.find(q => q.id === questionId);
        if (question && this.components.modal) {
          this.components.modal.open(question);
        }
      });
    });
  }

  attachEventListeners() {
    // 其他全局事件监听可以在这里添加
  }

  addNewQuestion() {
    const title = prompt('输入你的问题：');
    if (title) {
      alert(`问题 "${title}" 已添加到草稿箱！\n\n你可以稍后补充视频、图片或链接形式的回答。`);
      // 这里可以添加实际的保存逻辑
    }
  }

  addEntranceAnimation() {
    const cards = document.querySelectorAll('.question-card');
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'all 0.5s ease';
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, i * 100);
    });
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new LifeQuestionsApp();
  app.init();
});
