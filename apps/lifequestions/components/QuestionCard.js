/**
 * 问题卡片组件
 * 负责渲染单个问题卡片
 */
class QuestionCard {
  constructor(question) {
    this.question = question;
  }

  render() {
    return `
      <div class="question-card" data-type="${this.question.type}" data-id="${this.question.id}">
        ${this.renderHeader()}
        ${this.renderMedia()}
        ${this.renderFooter()}
      </div>
    `;
  }

  renderHeader() {
    const statusClass = `status-${this.question.status}`;
    const statusText = {
      'draft': '草稿',
      'published': '已回答',
      'exploring': '探索中'
    }[this.question.status] || '未知';

    return `
      <div class="card-header">
        <div class="card-meta">
          <span class="card-number">QUESTION ${this.question.number}</span>
          <span class="card-status ${statusClass}">${statusText}</span>
        </div>
        <h3 class="card-title">${this.question.title}</h3>
      </div>
    `;
  }

  renderMedia() {
    const media = this.question.media;
    if (!media) return '';

    switch (media.type) {
      case 'video':
        return `
          <div class="card-media">
            <div class="media-video">
              <div class="video-placeholder">
                <div class="play-btn">▶</div>
                <div style="font-size: 0.9rem; opacity: 0.8;">${media.duration || ''}</div>
              </div>
            </div>
          </div>
        `;
      
      case 'image':
        return `
          <div class="card-media">
            <img src="${media.url}" alt="${media.alt || ''}" class="media-image">
          </div>
        `;
      
      case 'link':
        if (media.links && Array.isArray(media.links)) {
          // 多个链接
          return `
            <div class="card-media" style="padding: 1rem; background: #f8f8f8;">
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${media.links.map(link => `
                  <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: white; border-radius: 8px;">
                    <div style="width: 32px; height: 32px; background: #f0f0f0; border-radius: 6px; display: flex; align-items: center; justify-content: center;">${link.icon || '📄'}</div>
                    <div style="font-size: 0.9rem; font-weight: 500;">${link.title}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        } else {
          // 单个链接
          return `
            <div class="card-media">
              <div class="media-link">
                <div class="link-icon">${media.icon || '📄'}</div>
                <div class="link-info">
                  <div class="link-url">${media.url || ''}</div>
                  <div class="link-title">${media.title || ''}</div>
                </div>
              </div>
            </div>
          `;
        }
      
      case 'doc':
        return `
          <div class="card-media">
            <div class="media-doc">
              <div class="doc-preview">${this.escapeHtml(media.preview || '')}</div>
            </div>
          </div>
        `;
      
      case 'audio':
        return `
          <div class="card-media">
            <div class="media-audio">
              <div class="audio-wave">
                ${this.generateWaveBars()}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.9rem;">${media.title || ''}</span>
                <span style="font-size: 0.8rem; opacity: 0.8;">${media.duration || ''}</span>
              </div>
            </div>
          </div>
        `;
      
      case 'quote':
        return `
          <div class="card-media">
            <div class="media-quote">
              <div class="quote-mark">"</div>
              <p class="quote-text">${media.text || ''}</p>
              <div class="quote-author">${media.author || ''}</div>
            </div>
          </div>
        `;
      
      default:
        return '';
    }
  }

  renderFooter() {
    const tagsHtml = this.question.tags.map(tag => 
      `<span class="tag">#${tag}</span>`
    ).join('');

    return `
      <div class="card-footer">
        <div class="card-tags">${tagsHtml}</div>
        <span class="card-date">${this.question.date}</span>
      </div>
    `;
  }

  generateWaveBars() {
    const delays = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    const heights = [40, 70, 100, 60, 80, 40, 90, 50, 70, 100];
    
    return delays.map((delay, i) => 
      `<div class="wave-bar" style="height: ${heights[i]}%; animation-delay: ${delay}s;"></div>`
    ).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
