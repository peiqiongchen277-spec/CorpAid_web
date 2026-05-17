// 模拟数据 - 按价值等级分类

// 高价值数据
export const highValueData = {
  // 统计指标
  metrics: [
    { name: '情报总数', value: 1560, unit: '', change: '增长18.4%', trend: '上升' },
    { name: '事件情报数', value: 845, unit: '', change: '增长12.7%', trend: '上升' },
    { name: '处理准确率', value: 95.2, unit: '%', change: '提升1.2%', trend: '上升' },
    { name: '平均响应时间', value: 2.1, unit: '小时', change: '缩短0.6小时', trend: '下降' }
  ],
  
  // 事件类型分布
  eventType: [
    { name: '军事活动', value: 95, color: '#3B82F6' },
    { name: '政治事件', value: 88, color: '#10B981' },
    { name: '经济冲突', value: 75, color: '#F59E0B' },
    { name: '社会安全', value: 68, color: '#EC4899' },
    { name: '涉外纠纷', value: 92, color: '#8B5CF6' },
    { name: '其他事件', value: 45, color: '#EF4444' }
  ],
  
  // 情报来源分析
  intelligenceSource: [
    { name: '公开新闻', value: 25, color: '#3B82F6' },
    { name: '政府公报', value: 30, color: '#10B981' },
    { name: '社交媒体', value: 15, color: '#EF4444' },
    { name: '内部情报', value: 22, color: '#F59E0B' },
    { name: '专家分析', value: 8, color: '#8B5CF6' }
  ],
  
  // 事件趋势分析
  eventTrend: [
    { date: '06-01', eventCount: 35, trendIndex: 28 },
    { date: '06-05', eventCount: 42, trendIndex: 32 },
    { date: '06-10', eventCount: 38, trendIndex: 30 },
    { date: '06-15', eventCount: 45, trendIndex: 35 },
    { date: '06-20', eventCount: 52, trendIndex: 40 },
    { date: '06-25', eventCount: 60, trendIndex: 45 },
    { date: '06-30', eventCount: 56, trendIndex: 42 }
  ],
  
  // 区域事件热力分析
  regionEventHeat: {
    domains: ['军事', '政治', '经济', '外交', '科技', '社会'],
    regions: [
      {
        name: '乌克兰东部',
        color: '#EF4444', // 红色
        values: [98, 85, 70, 80, 65, 75]
      },
      {
        name: '中东地区',
        color: '#EC4899', // 粉色
        values: [92, 88, 90, 90, 75, 80]
      },
      {
        name: '亚太地区',
        color: '#8B5CF6', // 紫色
        values: [82, 92, 98, 90, 95, 90]
      }
    ]
  },
  
  // 实时预警事件
  realtimeEvents: [
    { 
      id: 1, 
      name: '普京发表"安全宣示"', 
      time: '2023-06-20', 
      type: '政治活动', 
      level: '高价值', 
      levelColor: 'bg-red-500', 
      impact: 9.2, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    },
    { 
      id: 2, 
      name: '俄军工企业遭袭击', 
      time: '2023-06-25', 
      type: '军事行动', 
      level: '高价值', 
      levelColor: 'bg-red-500', 
      impact: 8.7, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    },
    { 
      id: 3, 
      name: '北约军事演习部署', 
      time: '2023-06-22', 
      type: '军事行动', 
      level: '高价值', 
      levelColor: 'bg-red-500', 
      impact: 9.0, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    },
    { 
      id: 4, 
      name: '美国战略武器调整', 
      time: '2023-06-28', 
      type: '军事调整', 
      level: '高价值', 
      levelColor: 'bg-red-500', 
      impact: 9.5, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    }
  ]
};

// 中价值数据
export const mediumValueData = {
  // 统计指标
  metrics: [
    { name: '情报总数', value: 1248, unit: '', change: '增长12.8%', trend: '上升' },
    { name: '事件情报数', value: 586, unit: '', change: '增长7.2%', trend: '上升' },
    { name: '处理准确率', value: 92.4, unit: '%', change: '提升0.8%', trend: '上升' },
    { name: '平均响应时间', value: 2.7, unit: '小时', change: '缩短0.4小时', trend: '下降' }
  ],
  
  // 事件类型分布
  eventType: [
    { name: '军事活动', value: 65, color: '#3B82F6' },
    { name: '政治事件', value: 59, color: '#10B981' },
    { name: '经济冲突', value: 80, color: '#F59E0B' },
    { name: '社会安全', value: 81, color: '#EC4899' },
    { name: '涉外纠纷', value: 56, color: '#8B5CF6' },
    { name: '其他事件', value: 55, color: '#EF4444' }
  ],
  
  // 情报来源分析
  intelligenceSource: [
    { name: '公开新闻', value: 30, color: '#3B82F6' },
    { name: '政府公报', value: 25, color: '#10B981' },
    { name: '社交媒体', value: 20, color: '#EF4444' },
    { name: '内部情报', value: 15, color: '#F59E0B' },
    { name: '专家分析', value: 10, color: '#8B5CF6' }
  ],
  
  // 事件趋势分析
  eventTrend: [
    { date: '06-01', eventCount: 20, trendIndex: 12 },
    { date: '06-05', eventCount: 25, trendIndex: 15 },
    { date: '06-10', eventCount: 30, trendIndex: 18 },
    { date: '06-15', eventCount: 28, trendIndex: 16 },
    { date: '06-20', eventCount: 35, trendIndex: 20 },
    { date: '06-25', eventCount: 40, trendIndex: 22 },
    { date: '06-30', eventCount: 45, trendIndex: 25 }
  ],
  
  // 区域事件热力分析
  regionEventHeat: {
    domains: ['军事', '政治', '经济', '外交', '科技', '社会'],
    regions: [
      {
        name: '乌克兰东部',
        color: '#EF4444', // 红色
        values: [85, 75, 60, 70, 55, 65]
      },
      {
        name: '中东地区',
        color: '#EC4899', // 粉色
        values: [78, 75, 75, 78, 65, 70]
      },
      {
        name: '亚太地区',
        color: '#8B5CF6', // 紫色
        values: [70, 80, 88, 80, 85, 78]
      }
    ]
  },
  
  // 实时预警事件
  realtimeEvents: [
    { 
      id: 5, 
      name: '中东地缘政治变动', 
      time: '2023-06-15', 
      type: '涉外关系', 
      level: '中价值', 
      levelColor: 'bg-amber-500', 
      impact: 7.6, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    },
    { 
      id: 6, 
      name: '能源危机应对措施', 
      time: '2023-06-22', 
      type: '经济影响', 
      level: '中价值', 
      levelColor: 'bg-amber-500', 
      impact: 8.1, 
      trend: '下降', 
      trendColor: 'text-red-500',
      trendIcon: 'arrow-down'
    },
    { 
      id: 7, 
      name: '全球芯片供应链重构', 
      time: '2023-06-28', 
      type: '经济影响', 
      level: '中价值', 
      levelColor: 'bg-amber-500', 
      impact: 8.3, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    },
    { 
      id: 8, 
      name: '欧盟碳边境调节机制', 
      time: '2023-06-18', 
      type: '经济政策', 
      level: '中价值', 
      levelColor: 'bg-amber-500', 
      impact: 7.8, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    }
  ]
};

// 低价值数据
export const lowValueData = {
  // 统计指标
  metrics: [
    { name: '情报总数', value: 956, unit: '', change: '增长5.3%', trend: '上升' },
    { name: '事件情报数', value: 342, unit: '', change: '增长2.8%', trend: '上升' },
    { name: '处理准确率', value: 89.1, unit: '%', change: '提升0.3%', trend: '上升' },
    { name: '平均响应时间', value: 3.4, unit: '小时', change: '缩短0.2小时', trend: '下降' }
  ],
  
  // 事件类型分布
  eventType: [
    { name: '军事活动', value: 35, color: '#3B82F6' },
    { name: '政治事件', value: 42, color: '#10B981' },
    { name: '经济冲突', value: 58, color: '#F59E0B' },
    { name: '社会安全', value: 65, color: '#EC4899' },
    { name: '涉外纠纷', value: 48, color: '#8B5CF6' },
    { name: '其他事件', value: 72, color: '#EF4444' }
  ],
  
  // 情报来源分析
  intelligenceSource: [
    { name: '公开新闻', value: 35, color: '#3B82F6' },
    { name: '政府公报', value: 22, color: '#10B981' },
    { name: '社交媒体', value: 25, color: '#EF4444' },
    { name: '内部情报', value: 10, color: '#F59E0B' },
    { name: '专家分析', value: 8, color: '#8B5CF6' }
  ],
  
  // 事件趋势分析
  eventTrend: [
    { date: '06-01', eventCount: 15, trendIndex: 8 },
    { date: '06-05', eventCount: 18, trendIndex: 10 },
    { date: '06-10', eventCount: 22, trendIndex: 12 },
    { date: '06-15', eventCount: 20, trendIndex: 11 },
    { date: '06-20', eventCount: 25, trendIndex: 14 },
    { date: '06-25', eventCount: 28, trendIndex: 16 },
    { date: '06-30', eventCount: 30, trendIndex: 17 }
  ],
  
  // 区域事件热力分析
  regionEventHeat: {
    domains: ['军事', '政治', '经济', '外交', '科技', '社会'],
    regions: [
      {
        name: '乌克兰东部',
        color: '#EF4444', // 红色
        values: [70, 65, 55, 60, 50, 60]
      },
      {
        name: '中东地区',
        color: '#EC4899', // 粉色
        values: [68, 65, 68, 70, 60, 65]
      },
      {
        name: '亚太地区',
        color: '#8B5CF6', // 紫色
        values: [62, 70, 80, 72, 78, 70]
      }
    ]
  },
  
  // 实时预警事件
  realtimeEvents: [
    { 
      id: 9, 
      name: '第三轮新冠疫苗', 
      time: '2023-06-26', 
      type: '新冠疫情', 
      level: '低价值', 
      levelColor: 'bg-blue-500', 
      impact: 6.3, 
      trend: '下降', 
      trendColor: 'text-red-500',
      trendIcon: 'arrow-down'
    },
    { 
      id: 10, 
      name: '中东地区石油产量变化', 
      time: '2023-06-26', 
      type: '经济影响', 
      level: '低价值', 
      levelColor: 'bg-blue-500', 
      impact: 6.8, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    },
    { 
      id: 11, 
      name: '全球贸易政策调整', 
      time: '2023-06-24', 
      type: '经济政策', 
      level: '低价值', 
      levelColor: 'bg-blue-500', 
      impact: 6.5, 
      trend: '上升', 
      trendColor: 'text-green-500',
      trendIcon: 'arrow-up'
    },
    { 
      id: 12, 
      name: '气候变化国际合作', 
      time: '2023-06-19', 
      type: '国际合作', 
      level: '低价值', 
      levelColor: 'bg-blue-500', 
      impact: 7.0, 
      trend: '下降', 
      trendColor: 'text-red-500',
      trendIcon: 'arrow-down'
    }
  ]
};

// 全部价值等级数据（合并所有数据）
export const allValueData = {
  // 统计指标 - 使用平均值
  metrics: [
    { name: '情报总数', value: Math.round((highValueData.metrics[0].value + mediumValueData.metrics[0].value + lowValueData.metrics[0].value) / 3), unit: '', change: '增长12.2%', trend: '上升' },
    { name: '事件情报数', value: Math.round((highValueData.metrics[1].value + mediumValueData.metrics[1].value + lowValueData.metrics[1].value) / 3), unit: '', change: '增长7.6%', trend: '上升' },
    { name: '处理准确率', value: Number(((highValueData.metrics[2].value + mediumValueData.metrics[2].value + lowValueData.metrics[2].value) / 3).toFixed(1)), unit: '%', change: '提升0.8%', trend: '上升' },
    { name: '平均响应时间', value: Number(((highValueData.metrics[3].value + mediumValueData.metrics[3].value + lowValueData.metrics[3].value) / 3).toFixed(1)), unit: '小时', change: '缩短0.4小时', trend: '下降' }
  ],
  
  // 事件类型分布 - 合并数据
  eventType: highValueData.eventType.map((item, index) => ({
    name: item.name,
    value: Math.round((item.value + mediumValueData.eventType[index].value + lowValueData.eventType[index].value) / 3),
    color: item.color
  })),
  
  // 情报来源分析 - 使用中价值数据
  intelligenceSource: mediumValueData.intelligenceSource,
  
  // 事件趋势分析 - 使用中价值数据
  eventTrend: mediumValueData.eventTrend,
  
  // 区域事件热力分析 - 使用中价值数据
  regionEventHeat: mediumValueData.regionEventHeat,
  
  // 实时预警事件 - 合并所有事件
  realtimeEvents: [...highValueData.realtimeEvents, ...mediumValueData.realtimeEvents, ...lowValueData.realtimeEvents]
};