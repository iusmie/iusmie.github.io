/**
 * 旅行攻略组件
 * 整合时间线和地图组件展示完整的旅行攻略
 */
class TravelGuideComponent {
  constructor(containerId, guideData) {
    this.container = document.getElementById(containerId);
    this.guideData = guideData;
    this.currentGuide = null;
    this.currentDay = 1;
    this.timelineComponent = null;
    this.mapComponent = null;
    this.mapInstance = null;
    this.markers = [];
  }

  render() {
    if (!this.container) return;

    // 如果没有攻略数据，显示空状态
    if (!this.guideData || this.guideData.length === 0) {
      this.container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #999;">暂无攻略数据</div>';
      return;
    }

    // 默认显示第一个攻略
    this.currentGuide = this.guideData[0];
    this.currentDay = 1;

    // 直接渲染攻略详情，不显示列表
    this.renderGuideDetailLayout(this.currentGuide);
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
    // 攻略详情直接显示，无需事件监听
  }

  renderGuideDetailLayout(guide) {
    if (!this.container) return;

    // 直接渲染整个攻略详情布局
    this.container.innerHTML = `
      <div class="travel-guide-section">
        <div class="guide-detail" id="guideDetail">
          <div class="guide-detail-content">
            <div class="guide-layout">
              <!-- 左侧地图区域 -->
              <div class="map-container">
                <div id="mapContainer" style="width: 100%; height: 100%; flex: 1; min-height: 0;"></div>
                <div class="map-overlay">
                  <div class="route-selector">
                    <div class="route-label">选择路线</div>
                    <div class="route-options" id="routeOptions"></div>
                  </div>
                  <div class="day-detail" id="dayDetail">
                    <div class="day-title" id="dayTitle">第 1 天</div>
                    <div class="day-activities" id="dayActivities"></div>
                  </div>
                </div>
              </div>
              
              <!-- 右侧内容区域（标题、信息栏 + 时间线） -->
              <div class="guide-right-panel">
                <div class="guide-detail-header">
                  <div class="guide-detail-title" id="guideDetailTitle">
                    <h2>${guide.title}</h2>
                    <span class="guide-detail-country">${this.getCountryFlag(guide.countryCode)} ${guide.country}</span>
                  </div>
                  <div class="guide-info-bar">
                    <div class="guide-info-item">
                      <span class="guide-info-icon">⏱️</span>
                      <span>${guide.duration}</span>
                    </div>
                    <div class="guide-info-item">
                      <span class="guide-info-icon">🚗</span>
                      <span>${guide.transportation}</span>
                    </div>
                    <div class="guide-info-item">
                      <span class="guide-info-icon">💰</span>
                      <span>${guide.budget}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 时间线侧边栏 -->
                <div class="timeline-sidebar">
                  <div class="timeline-header">
                    <span>📍</span>
                    <span id="routeTitle">${guide.title}</span>
                  </div>
                  <div class="timeline-list" id="timelineList"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 渲染时间线
    this.renderTimelineSidebar(guide.route);

    // 渲染路线选择器
    this.renderRouteSelector();

    // 渲染地图 - 确保在DOM更新和容器可见后再初始化
    setTimeout(() => {
      this.renderMapWithOverlay(guide);
    }, 200);
  }

  renderTimelineSidebar(route) {
    const container = document.getElementById('timelineList');
    if (!container) return;

    container.innerHTML = route.map((day, index) => `
      <div class="timeline-node ${day.day === this.currentDay ? 'active' : ''}" 
           data-day="${day.day}"
           onclick="guideComponent.selectDay(${day.day})">
        <div class="node-date">Day ${day.day}</div>
        <div class="node-title">${day.city}</div>
        <div class="node-location">📍 ${day.activities.length} 个地点</div>
      </div>
    `).join('');
  }

  renderRouteSelector() {
    const container = document.getElementById('routeOptions');
    if (!container) return;

    container.innerHTML = this.guideData.map(guide => `
      <button class="route-chip ${guide.id === this.currentGuide.id ? 'active' : ''}" 
              data-guide-id="${guide.id}">
        ${this.getCountryFlag(guide.countryCode)} ${guide.title}
      </button>
    `).join('');

    // 绑定点击事件
    container.querySelectorAll('.route-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const guideId = chip.dataset.guideId;
        this.switchRoute(guideId);
      });
    });
  }

  renderMapWithOverlay(guide) {
    const container = document.getElementById('mapContainer');
    if (!container) return;

    // 清理旧地图
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
    this.markers = [];

    const currentDayData = guide.route.find(d => d.day === this.currentDay);
    if (!currentDayData) return;

    // 计算地图中心点（使用第一个活动的坐标）
    const center = currentDayData.activities.length > 0 
      ? currentDayData.activities[0].coordinates 
      : [35.6762, 139.6503];

    // 确保容器有尺寸
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      setTimeout(() => this.renderMapWithOverlay(guide), 100);
      return;
    }

    // 初始化地图 - 参考代码的简化方式
    this.mapInstance = L.map('mapContainer').setView(center, 12);
    
    // 使用浅色主题的地图图层（参考代码）
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapInstance);

    // 渲染标记和路线
    this.updateMapMarkers(guide, currentDayData);

    // 更新每日详情
    this.updateDayDetail(currentDayData);

    // 确保地图正确渲染和填充容器
    setTimeout(() => {
      if (this.mapInstance) {
        this.mapInstance.invalidateSize();
      }
    }, 100);
  }

  updateMapMarkers(guide, dayData) {
    // 清除旧标记
    if (this.markers) {
      this.markers.forEach(m => this.mapInstance.removeLayer(m));
    }
    this.markers = [];

    const colors = {
      transport: '#3b82f6',
      hotel: '#8b5cf6',
      food: '#f59e0b',
      sight: '#10b981',
      shop: '#ec4899'
    };

    // 为每个活动添加标记
    dayData.activities.forEach((act, idx) => {
      // 确定活动类型（根据名称或描述推断）
      let type = 'sight';
      if (act.name.includes('机场') || act.name.includes('站') || act.name.includes('前往')) {
        type = 'transport';
      } else if (act.name.includes('酒店') || act.name.includes('住宿')) {
        type = 'hotel';
      } else if (act.name.includes('餐') || act.name.includes('食') || act.name.includes('夜市')) {
        type = 'food';
      } else if (act.name.includes('购物') || act.name.includes('市场')) {
        type = 'shop';
      }

      const marker = L.marker(act.coordinates, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${colors[type] || '#666'}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${idx + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(this.mapInstance);

      marker.bindPopup(`
        <div style="padding: 0.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.25rem;">${act.time} ${act.name}</div>
          <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">${act.location}</div>
          ${act.description ? `<div style="font-size: 0.85rem; color: #999;">${act.description}</div>` : ''}
        </div>
      `);

      this.markers.push(marker);
    });

    // 添加路线连线
    if (dayData.activities.length > 1) {
      const latlngs = dayData.activities.map(a => a.coordinates);
      const polyline = L.polyline(latlngs, {
        color: '#1a1a1a',
        weight: 3,
        opacity: 0.3,
        dashArray: '5, 10'
      }).addTo(this.mapInstance);
      this.markers.push(polyline);
    }

    // 如果有住宿信息，也添加标记
    if (dayData.accommodation) {
      const hotelMarker = L.marker(dayData.accommodation.coordinates, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: #8b5cf6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏨</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(this.mapInstance);

      hotelMarker.bindPopup(`
        <div style="padding: 0.5rem;">
          <div style="font-weight: 600; margin-bottom: 0.25rem;">🏨 ${dayData.accommodation.name}</div>
        </div>
      `);

      this.markers.push(hotelMarker);
    }
  }

  updateDayDetail(dayData) {
    const dayTitle = document.getElementById('dayTitle');
    const dayActivities = document.getElementById('dayActivities');
    
    if (dayTitle) {
      dayTitle.textContent = `第 ${dayData.day} 天：${dayData.city}`;
    }

    if (dayActivities) {
      const icons = {
        transport: '🚇',
        hotel: '🏨',
        food: '🍜',
        sight: '📸',
        shop: '🛍️'
      };

      dayActivities.innerHTML = dayData.activities.map(act => {
        let type = 'sight';
        if (act.name.includes('机场') || act.name.includes('站') || act.name.includes('前往')) {
          type = 'transport';
        } else if (act.name.includes('酒店') || act.name.includes('住宿')) {
          type = 'hotel';
        } else if (act.name.includes('餐') || act.name.includes('食') || act.name.includes('夜市')) {
          type = 'food';
        } else if (act.name.includes('购物') || act.name.includes('市场')) {
          type = 'shop';
        }

        return `
          <div class="activity-item">
            <span class="activity-time">${act.time}</span>
            <span>${icons[type] || '●'} ${act.name}</span>
            ${act.description ? `<span style="color: #999; margin-left: 0.5rem;">(${act.description})</span>` : ''}
          </div>
        `;
      }).join('');
    }
  }

  selectDay(day) {
    this.currentDay = day;
    
    // 更新时间线状态
    const nodes = document.querySelectorAll('.timeline-node');
    nodes.forEach(node => {
      const nodeDay = parseInt(node.dataset.day || node.textContent.match(/Day (\d+)/)?.[1] || '0');
      node.classList.toggle('active', nodeDay === day);
    });

    if (this.currentGuide && this.mapInstance) {
      const dayData = this.currentGuide.route.find(d => d.day === day);
      if (dayData) {
        // 更新标记和详情
        this.updateMapMarkers(this.currentGuide, dayData);
        this.updateDayDetail(dayData);
        
        // 地图飞行动画（参考代码的方式）
        const center = dayData.activities.length > 0 
          ? dayData.activities[0].coordinates 
          : [35.6762, 139.6503];
        this.mapInstance.flyTo(center, 12, { duration: 1.5 });
      }
    }
  }

  switchRoute(guideId) {
    const guide = this.guideData.find(g => g.id === guideId);
    if (guide) {
      this.currentGuide = guide;
      this.currentDay = 1;
      this.renderRouteSelector();
      this.renderTimelineSidebar(guide.route);
      
      // 更新右侧面板的标题和内容
      this.updateGuideDetailHeader(guide);
      
      // 更新路线标题
      const routeTitle = document.getElementById('routeTitle');
      if (routeTitle) {
        routeTitle.textContent = guide.title;
      }
      
      // 清理旧地图
      if (this.mapInstance) {
        this.mapInstance.remove();
        this.mapInstance = null;
      }
      this.markers = [];
      
      // 重新渲染地图
      setTimeout(() => {
        this.renderMapWithOverlay(guide);
      }, 50);
    }
  }

  updateGuideDetailHeader(guide) {
    const guideDetailTitle = document.getElementById('guideDetailTitle');
    if (guideDetailTitle) {
      guideDetailTitle.innerHTML = `
        <h2>${guide.title}</h2>
        <span class="guide-detail-country">${this.getCountryFlag(guide.countryCode)} ${guide.country}</span>
      `;
    }

    // 更新信息栏
    const guideInfoBar = document.querySelector('.guide-info-bar');
    if (guideInfoBar) {
      guideInfoBar.innerHTML = `
        <div class="guide-info-item">
          <span class="guide-info-icon">⏱️</span>
          <span>${guide.duration}</span>
        </div>
        <div class="guide-info-item">
          <span class="guide-info-icon">🚗</span>
          <span>${guide.transportation}</span>
        </div>
        <div class="guide-info-item">
          <span class="guide-info-icon">💰</span>
          <span>${guide.budget}</span>
        </div>
      `;
    }
  }


}
