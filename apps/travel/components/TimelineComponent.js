/**
 * 时间线组件
 * 用于展示旅行路线的时间线
 */
class TimelineComponent {
  constructor(containerId, routeData) {
    this.container = document.getElementById(containerId);
    this.routeData = routeData;
  }

  render() {
    if (!this.container || !this.routeData) return;

    this.container.innerHTML = `
      <div class="timeline-wrapper">
        <div class="timeline">
          ${this.routeData.map((day, index) => this.renderDay(day, index)).join('')}
        </div>
      </div>
    `;
  }

  renderDay(day, index) {
    const isLast = index === this.routeData.length - 1;
    
    return `
      <div class="timeline-day" data-day="${day.day}">
        <div class="timeline-day-marker">
          <div class="timeline-day-number">第${day.day}天</div>
          <div class="timeline-day-date">${this.formatDate(day.date)}</div>
        </div>
        <div class="timeline-day-content">
          <div class="timeline-day-header">
            <h3 class="timeline-day-city">${day.city}</h3>
            ${day.accommodation ? `
              <div class="timeline-day-accommodation">
                <span class="accommodation-icon">🏨</span>
                <span>${day.accommodation.name}</span>
              </div>
            ` : ''}
          </div>
          <div class="timeline-activities">
            ${day.activities.map(activity => this.renderActivity(activity)).join('')}
          </div>
        </div>
        ${!isLast ? '<div class="timeline-connector"></div>' : ''}
      </div>
    `;
  }

  renderActivity(activity) {
    return `
      <div class="timeline-activity" data-time="${activity.time}">
        <div class="timeline-activity-time">${activity.time}</div>
        <div class="timeline-activity-content">
          <div class="timeline-activity-location">
            <span class="location-icon">📍</span>
            <strong>${activity.location}</strong>
          </div>
          <h4 class="timeline-activity-name">${activity.name}</h4>
          <p class="timeline-activity-description">${activity.description}</p>
        </div>
      </div>
    `;
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
}
