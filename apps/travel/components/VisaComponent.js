/**
 * 签证组件
 * 用于展示不同国家的签证信息
 */
class VisaComponent {
  constructor(containerId, visaData) {
    this.container = document.getElementById(containerId);
    this.visaData = visaData;
    this.filteredData = visaData;
    this.currentFilter = 'all';
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="visa-section">
        <div class="visa-cards-container" id="visaCardsContainer">
          ${this.renderVisaCards(this.filteredData)}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  getUniqueCountries() {
    const countries = [...new Set(this.visaData.map(visa => visa.country))];
    return countries.sort();
  }

  renderVisaCards(visas) {
    if (visas.length === 0) {
      return '<div class="visa-empty">暂无签证信息</div>';
    }

    return visas.map(visa => `
      <div class="visa-card" data-visa-id="${visa.id}">
        <div class="visa-card-header">
          <div class="visa-header-left">
            <div class="visa-country-flag">${this.getCountryFlag(visa.countryCode)}</div>
            <h3 class="visa-card-title">${visa.country}</h3>
          </div>
          <span class="visa-type">${visa.type}</span>
        </div>
        <div class="visa-card-body">
          <p class="visa-description">${visa.description}</p>
          <div class="visa-info-grid">
            <div class="visa-info-item">
              <span class="visa-info-label">签证类型</span>
              <span class="visa-info-value">${visa.typeCode}</span>
            </div>
            <div class="visa-info-item">
              <span class="visa-info-label">处理时长</span>
              <span class="visa-info-value">${visa.processingTime}</span>
            </div>
            <div class="visa-info-item">
              <span class="visa-info-label">有效期</span>
              <span class="visa-info-value">${visa.validity}</span>
            </div>
            <div class="visa-info-item">
              <span class="visa-info-label">费用</span>
              <span class="visa-info-value">${visa.fee}</span>
            </div>
          </div>
          <div class="visa-materials">
            <h4>所需材料</h4>
            ${visa.materials.map(materialGroup => `
              <div class="visa-material-group">
                <strong>${materialGroup.category}：</strong>
                <ul>
                  ${materialGroup.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
          ${visa.notes && visa.notes.length > 0 ? `
            <div class="visa-notes">
              <h4>注意事项</h4>
              <ul>
                ${visa.notes.map(note => `<li>${note}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${visa.officialWebsite ? `
            <div class="visa-actions">
              <a href="${visa.officialWebsite}" target="_blank" class="visa-link-btn">
                官方申请网站 →
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  getCountryFlag(countryCode) {
    const flagMap = {
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'JP': '🇯🇵',
      'EU': '🇪🇺',
      'AU': '🇦🇺',
      'TH': '🇹🇭',
      'CN': '🇨🇳'
    };
    return flagMap[countryCode] || '🌍';
  }

  attachEventListeners() {
    // 筛选器已移除，无需绑定事件
  }

  filterByCountry(country) {
    if (country === 'all') {
      this.filteredData = this.visaData;
    } else {
      this.filteredData = this.visaData.filter(visa => visa.country === country);
    }
    
    const cardsContainer = document.getElementById('visaCardsContainer');
    if (cardsContainer) {
      cardsContainer.innerHTML = this.renderVisaCards(this.filteredData);
    }
  }
}
