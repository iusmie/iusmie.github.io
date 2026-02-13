/**
 * 宠物卡片组件
 */
class PetCard {
  constructor(pet, index) {
    this.pet = pet;
    this.index = index;
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}.${month}.${day}`;
  }

  calculateAge(birthDate, endDate = null) {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    let years = end.getFullYear() - birth.getFullYear();
    let months = end.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years}岁`;
    } else if (months > 0) {
      return `${months}个月`;
    } else {
      const days = Math.floor((end - birth) / (1000 * 60 * 60 * 24));
      return `${days}天`;
    }
  }

  render() {
    const isDog = this.pet.id === 'xiaocai';
    const personalityTags = this.pet.personality.map(p => 
      `<span class="personality-tag">${p}</span>`
    ).join('');

    return `
      <div class="pet-card ${isDog ? 'dog-card' : ''} animate-in" 
           style="animation-delay: ${this.index * 0.1}s">
        <div class="pet-photo-area">
          <img src="${this.pet.avatar}" alt="${this.pet.name}" class="pet-photo">
          <div class="pet-badge">
            ${isDog ? '🐶' : '🐱'} ${this.pet.breed}
          </div>
          <div class="pet-rank">${this.pet.rank}</div>
          <div class="personality-tags">
            ${personalityTags}
          </div>
        </div>
        
        <div class="pet-info">
          <div class="pet-header">
            <div>
              <h3 class="pet-name">${this.pet.englishName} ${this.pet.gender}</h3>
              <p class="pet-breed">${this.pet.name} · ${this.pet.role}</p>
            </div>
            <div class="pet-age">
              ${this.pet.birthDate ? `
                <div class="birth-date">${this.formatDate(this.pet.birthDate)}</div>
                ${this.pet.endDate ? `
                  <div class="end-date">${this.formatDate(this.pet.endDate)}</div>
                ` : `
                  <div class="age-calculated">${this.calculateAge(this.pet.birthDate)}</div>
                `}
              ` : `
                <div class="age-number">${this.pet.age}</div>
                <div class="age-unit">${this.pet.ageUnit}</div>
              `}
            </div>
          </div>
          
          <div class="pet-bio">
            "${this.pet.bio}"
          </div>
          
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f0f0f0; font-size: 0.8rem; color: #999;">
            <div style="display: flex; justify-content: space-between; line-height: 1.4;">
              <span>🏥 健康</span>
              <span style="color: #666;">${this.pet.health}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
