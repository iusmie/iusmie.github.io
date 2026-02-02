// 世界时钟功能
function formatTime(date, timezone) {
  const options = {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return date.toLocaleTimeString('en-US', options);
}

function formatDate(date, timezone) {
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  // 使用 Intl.DateTimeFormat 获取格式化的日期部分
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  // en-CA 格式返回 YYYY-MM-DD，但我们需要确保时区正确
  // 手动构建以确保时区正确
  const year = date.toLocaleString('en-US', { timeZone: timezone, year: 'numeric' });
  const month = date.toLocaleString('en-US', { timeZone: timezone, month: '2-digit' });
  const day = date.toLocaleString('en-US', { timeZone: timezone, day: '2-digit' });
  // 格式化为 YYYY-MM-DD
  return `${year}-${month}-${day}`;
}

function updateWorldClock() {
  const now = new Date();
  
  // 中国时间 (Asia/Shanghai)
  const cnTime = formatTime(now, 'Asia/Shanghai');
  const cnDate = formatDate(now, 'Asia/Shanghai');
  const cnTimeElement = document.getElementById('clock-cn');
  const cnDateElement = document.getElementById('date-cn');
  if (cnTimeElement) {
    cnTimeElement.textContent = cnTime;
  }
  if (cnDateElement) {
    cnDateElement.textContent = cnDate;
  }
  
  // 英国时间 (Europe/London)
  const ukTime = formatTime(now, 'Europe/London');
  const ukDate = formatDate(now, 'Europe/London');
  const ukTimeElement = document.getElementById('clock-uk');
  const ukDateElement = document.getElementById('date-uk');
  if (ukTimeElement) {
    ukTimeElement.textContent = ukTime;
  }
  if (ukDateElement) {
    ukDateElement.textContent = ukDate;
  }
  
  // 美国时间 (America/New_York - 东部时间)
  const usTime = formatTime(now, 'America/New_York');
  const usDate = formatDate(now, 'America/New_York');
  const usTimeElement = document.getElementById('clock-us');
  const usDateElement = document.getElementById('date-us');
  if (usTimeElement) {
    usTimeElement.textContent = usTime;
  }
  if (usDateElement) {
    usDateElement.textContent = usDate;
  }
}

// 初始化世界时钟
document.addEventListener('DOMContentLoaded', () => {
  // 立即更新一次
  updateWorldClock();
  
  // 每秒更新一次
  setInterval(updateWorldClock, 1000);
});
