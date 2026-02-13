/**
 * 地图组件
 * 使用 Leaflet 地图库展示旅行路线
 */
class MapComponent {
  constructor(containerId, routeData) {
    this.container = document.getElementById(containerId);
    this.routeData = routeData;
    this.map = null;
    this.markers = [];
    this.polyline = null;
  }

  init() {
    if (!this.container || !this.routeData) return;

    // 检查 Leaflet 是否已加载
    if (typeof L === 'undefined') {
      console.error('Leaflet 地图库未加载');
      return;
    }

    // 初始化地图
    this.map = L.map(this.container, {
      zoomControl: true,
      scrollWheelZoom: true
    });

    // 添加 OpenStreetMap 图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.renderRoute();
  }

  renderRoute() {
    if (!this.map) return;

    const allCoordinates = [];
    
    // 收集所有坐标点
    this.routeData.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.coordinates && activity.coordinates.length === 2) {
          allCoordinates.push([activity.coordinates[0], activity.coordinates[1]]);
        }
      });
      
      if (day.accommodation && day.accommodation.coordinates) {
        allCoordinates.push([
          day.accommodation.coordinates[0],
          day.accommodation.coordinates[1]
        ]);
      }
    });

    if (allCoordinates.length === 0) return;

    // 计算地图边界
    const bounds = L.latLngBounds(allCoordinates);
    this.map.fitBounds(bounds, { padding: [50, 50] });

    // 绘制路线
    if (allCoordinates.length > 1) {
      this.polyline = L.polyline(allCoordinates, {
        color: '#4A90E2',
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1
      }).addTo(this.map);
    }

    // 添加标记点
    this.routeData.forEach((day, dayIndex) => {
      day.activities.forEach((activity, activityIndex) => {
        if (activity.coordinates && activity.coordinates.length === 2) {
          const marker = L.marker([activity.coordinates[0], activity.coordinates[1]], {
            icon: this.createCustomIcon(dayIndex + 1)
          }).addTo(this.map);

          marker.bindPopup(`
            <div class="map-popup">
              <strong>第${day.day}天 - ${activity.time}</strong><br>
              <strong>${activity.location}</strong><br>
              ${activity.name}<br>
              <small>${activity.description}</small>
            </div>
          `);

          this.markers.push(marker);
        }
      });

      // 添加住宿标记
      if (day.accommodation && day.accommodation.coordinates) {
        const hotelMarker = L.marker([
          day.accommodation.coordinates[0],
          day.accommodation.coordinates[1]
        ], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(this.map);

        hotelMarker.bindPopup(`
          <div class="map-popup">
            <strong>第${day.day}天住宿</strong><br>
            🏨 ${day.accommodation.name}
          </div>
        `);

        this.markers.push(hotelMarker);
      }
    });
  }

  createCustomIcon(dayNumber) {
    return L.divIcon({
      className: 'custom-day-marker',
      html: `<div class="day-marker-number">${dayNumber}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];
    this.polyline = null;
  }
}
