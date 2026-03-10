/**
 * 状态配置
 */
const StatusConfig = {
  seed: { label: '种子期', color: '#f59e0b', icon: '🌱' },
  sprout: { label: '发芽期', color: '#3b82f6', icon: '🌿' },
  growing: { label: '生长期', color: '#10b981', icon: '🌳' },
  fruit: { label: '结果期', color: '#8b5cf6', icon: '🍎' },
  withered: { label: '已归档', color: '#6b7280', icon: '🍂' }
};

const CategoryConfig = {
  product: { label: '产品', icon: '📱' },
  content: { label: '内容', icon: '📝' },
  tool: { label: '工具', icon: '🛠️' },
  business: { label: '商业', icon: '💼' },
  health: { label: '健康', icon: '🏥' },
  lifestyle: { label: '生活方式', icon: '✨' }
};

const MetricLabels = {
  feasibility: '可行性',
  marketPotential: '市场潜力',
  personalInterest: '个人兴趣',
  timeCost: '时间成本',
  maintenance: '维护成本'
};

// 全局导出（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StatusConfig, CategoryConfig, MetricLabels };
}
