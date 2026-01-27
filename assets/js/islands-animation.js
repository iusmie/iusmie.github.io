// 游戏关卡地图动画效果
document.addEventListener('DOMContentLoaded', () => {
  const gameMap = document.querySelector('.game-map-poster');
  const skillCards = document.querySelectorAll('.skill-card');
  
  if (!gameMap || skillCards.length === 0) return;
  
  // 技能卡片进入动画
  skillCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px) scale(0.8)';
    card.style.animation = `cardAppear 0.6s ease-out ${index * 0.1}s forwards`;
  });
  
  // 关卡标识牌进入动画
  const stageSigns = document.querySelectorAll('.stage-sign');
  stageSigns.forEach((sign, index) => {
    sign.style.opacity = '0';
    sign.style.transform = 'translateX(-50%) translateY(-20px)';
    sign.style.animation = `signAppear 0.8s ease-out ${index * 0.2 + 0.3}s forwards`;
  });
  
  // 技能卡片悬停效果增强
  skillCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.zIndex = '10';
      // 添加光晕效果
      const glow = document.createElement('div');
      glow.className = 'card-glow';
      this.appendChild(glow);
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.zIndex = '4';
      const glow = this.querySelector('.card-glow');
      if (glow) glow.remove();
    });
    
    // 点击时的弹跳效果
    card.addEventListener('click', function(e) {
      this.style.animation = 'cardBounce 0.5s ease-out';
      setTimeout(() => {
        this.style.animation = '';
      }, 500);
    });
  });
  
  // 星星闪烁动画（随机延迟）
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    const delay = Math.random() * 2;
    star.style.animationDelay = `${delay}s`;
  });
  
  // 云朵浮动动画（随机速度）
  const clouds = document.querySelectorAll('.cloud');
  clouds.forEach(cloud => {
    const duration = 12 + Math.random() * 6;
    cloud.style.animationDuration = `${duration}s`;
  });
});
