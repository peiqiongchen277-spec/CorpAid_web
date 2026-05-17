import * as React from 'react';
import { useState, useContext, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Menu, Bell, User, Search, Calendar, Download, RefreshCw, Filter, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import { formatNumber, formatPercentage, getValueLevelColor, getTrendColor } from '@/lib/utils';
import { intelligenceAPI } from '@/lib/api';

// 模拟数据 - 事件类型分布
const eventTypeData = [
  { name: '军事活动', value: 65, color: '#3B82F6' },
  { name: '政治事件', value: 59, color: '#10B981' },
  { name: '经济冲突', value: 80, color: '#F59E0B' },
  { name: '社会安全', value: 81, color: '#EC4899' },
  { name: '涉外纠纷', value: 56, color: '#8B5CF6' },
  { name: '其他事件', value: 55, color: '#EF4444' },
];

// 模拟数据 - 情报来源分析
const intelligenceSourceData = [
  { name: '公开新闻', value: 30, color: '#3B82F6' },
  { name: '政府公报', value: 25, color: '#10B981' },
  { name: '社交媒体', value: 20, color: '#EF4444' },
  { name: '内部情报', value: 15, color: '#F59E0B' },
  { name: '专家分析', value: 10, color: '#8B5CF6' },
];

// 模拟数据 - 事件趋势分析
const eventTrendData = [
  { date: '06-01', eventCount: 20, trendIndex: 12 },
  { date: '06-05', eventCount: 25, trendIndex: 15 },
  { date: '06-10', eventCount: 30, trendIndex: 18 },
  { date: '06-15', eventCount: 28, trendIndex: 16 },
  { date: '06-20', eventCount: 35, trendIndex: 20 },
  { date: '06-25', eventCount: 40, trendIndex: 22 },
  { date: '06-30', eventCount: 45, trendIndex: 25 },
];

// 模拟数据 - 区域事件热力分析（单一雷达图多区域线）
const regionEventHeatData = {
  // 领域列表（六个角）
  domains: ['军事', '政治', '经济', '外交', '科技', '社会'],
  
   // 各区域数据
  regions: [
    {
      name: '乌克兰东部',
      color: '#EF4444', // 红色
      values: [95, 80, 65, 75, 60, 70]
    },
    {
      name: '中东地区',
      color: '#EC4899', // 粉色
      values: [85, 82, 85, 85, 70, 75]
    },
    {
      name: '亚太地区',
      color: '#8B5CF6', // 紫色
      values: [75, 88, 95, 88, 90, 85]
    }
  ]
};

// 模拟数据 - 实时预警事件
const realtimeEventsData = [
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
    trendIcon: <ArrowUp size={14} className="inline mr-1" />
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
    trendIcon: <ArrowUp size={14} className="inline mr-1" />
  },
  { 
    id: 3, 
    name: '美国F-35战机南海', 
    time: '2023-06-28', 
    type: '国际摩擦', 
    level: '中价值', 
    levelColor: 'bg-amber-500', 
    impact: 8.5, 
    trend: '下降', 
    trendColor: 'text-red-500',
    trendIcon: <ArrowDown size={14} className="inline mr-1" />
  },
  { 
    id: 4, 
    name: '第三轮新冠疫苗', 
    time: '2023-06-26', 
    type: '新冠疫情', 
    level: '低价值', 
    levelColor: 'bg-blue-500', 
    impact: 6.3, 
    trend: '下降', 
    trendColor: 'text-red-500',
    trendIcon: <ArrowDown size={14} className="inline mr-1" />
  },
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
    trendIcon: <ArrowUp size={14} className="inline mr-1" />
  },
  { 
    id: 6, 
    name: '能源危机应对措施', 
    time: '2023-06-22', 
    type: '经济影响', 
    level: '高价值', 
    levelColor: 'bg-red-500', 
    impact: 8.1, 
    trend: '下降', 
    trendColor: 'text-red-500',
    trendIcon: <ArrowDown size={14} className="inline mr-1" />
  },
];

const EventWarningAnalysisPage: React.FC = () => {
  // 状态管理
  const [selectedEventCategory, setSelectedEventCategory] = useState('全部类型');
    const [selectedValueLevel, setSelectedValueLevel] = useState('全部等级');
  const [dateRange, setDateRange] = useState({ start: '2023-06-01', end: '2023-06-30' });
  const [filteredEvents, setFilteredEvents] = useState(realtimeEventsData);
  
  // 应用筛选条件
  const applyFilters = async () => {
    try {
      // 调用API获取事件数据
      const params = {
        category: selectedEventCategory === '全部类型' ? '' : selectedEventCategory,
        level: selectedValueLevel === '全部等级' ? '' : selectedValueLevel,
        timeRange: `${dateRange.start},${dateRange.end}`
      };
      
      const response = await intelligenceAPI.getEvents(params);
      
      // 检查响应数据
      if (response && response.data) {
        setFilteredEvents(response.data);
      } else {
        // 如果API请求失败或没有返回数据，使用模拟数据
        let results = realtimeEventsData;
        
        // 应用事件分类筛选
        if (selectedEventCategory !== '全部类型') {
          // 模拟不同类型的事件筛选
          if (selectedEventCategory === '军事活动') {
            results = results.filter(event => 
              ['军事行动', '军事冲突'].includes(event.type)
            );
          } else if (selectedEventCategory === '经济冲突') {
            results = results.filter(event => 
              ['经济影响'].includes(event.type)
            );
          } else if (selectedEventCategory === '政治事件') {
            results = results.filter(event => 
              ['政治活动'].includes(event.type)
            );
          } else if (selectedEventCategory === '涉外纠纷') {
            results = results.filter(event => 
              ['国际摩擦', '涉外关系'].includes(event.type)
            );
          }
        }
        
        // 应用价值等级筛选
        if (selectedValueLevel !== '全部等级') {
          results = results.filter(event => 
            event.level === selectedValueLevel
          );
        }
        
        setFilteredEvents(results);
      }
    } catch (error) {
      console.error('获取事件数据失败:', error);
      // 错误处理，使用模拟数据
      let results = realtimeEventsData;
      
      // 应用事件分类筛选
      if (selectedEventCategory !== '全部类型') {
        // 模拟不同类型的事件筛选
        if (selectedEventCategory === '军事活动') {
          results = results.filter(event => 
            ['军事行动', '军事冲突'].includes(event.type)
          );
        } else if (selectedEventCategory === '经济冲突') {
          results = results.filter(event => 
            ['经济影响'].includes(event.type)
          );
        } else if (selectedEventCategory === '政治事件') {
          results = results.filter(event => 
            ['政治活动'].includes(event.type)
          );
        } else if (selectedEventCategory === '涉外纠纷') {
          results = results.filter(event => 
            ['国际摩擦', '涉外关系'].includes(event.type)
          );
        }
      }
      
      // 应用价值等级筛选
      if (selectedValueLevel !== '全部等级') {
        results = results.filter(event => 
          event.level === selectedValueLevel
        );
      }
      
      setFilteredEvents(results);
    }
  };

  // 当筛选条件变化时应用筛选
  useEffect(() => {
    applyFilters();
  }, [selectedEventCategory, selectedValueLevel]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* 顶部导航栏 */}
      <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center">
          <div className="text-xl font-bold text-white mr-8">事件要情智能分析平台</div>
          <div className="text-sm text-gray-400 ml-2">专业版 v1.0</div>
        </div>
        
        <nav className="flex items-center space-x-4">
          <a href="/" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">首页</a>
          <a href="/intelligence-filter" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">情报筛选</a>
          <a href="/intelligence-aggregation" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">情报聚合</a>
          <a href="/data-analysis" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">数据分析</a>
          <a href="/report-generation" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">报表生成</a>
          <a href="/system-settings" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">系统设置</a>
        </nav>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white">
            <Bell size={20} />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600"></div>
            <span className="text-white">管理员</span>
          </div>
        </div>
      </header>
      
      {/* 主内容区域 */}
      <main className="p-6">
        {/* 筛选区域 */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          {/* 事件分类筛选 */}
          <div className="flex items-center">
            <span className="text-white mr-3">事件分类:</span>
            <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 ${selectedEventCategory === '全部类型' ? 'bg-blue-600 text-white scale-105' : 'bg-gray-800 text-gray-400'}`}
                  onClick={() => setSelectedEventCategory('全部类型')}
                >
                  全部类型
                </button>
                <button 
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 ${selectedEventCategory === '军事活动' ? 'bg-blue-600 text-white scale-105' : 'bg-gray-800 text-gray-400'}`}
                  onClick={() => setSelectedEventCategory('军事活动')}
                >
                军事活动
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${selectedEventCategory === '经济冲突' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                onClick={() => setSelectedEventCategory('经济冲突')}
              >
                经济冲突
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${selectedEventCategory === '政治事件' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                onClick={() => setSelectedEventCategory('政治事件')}
              >
                政治事件
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${selectedEventCategory === '涉外纠纷' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                onClick={() => setSelectedEventCategory('涉外纠纷')}
              >
                涉外纠纷
              </button>
            </div>
          </div>
          
          {/* 智能标签筛选 */}
          <div className="flex items-center">
                 <span className="text-white mr-3">价值等级:</span>
            <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 ${selectedValueLevel === '全部等级' ? 'bg-blue-600 text-white scale-105' : 'bg-gray-800 text-gray-400'}`}
                  onClick={() => setSelectedValueLevel('全部等级')}
                >
                  全部等级
                </button>
                <button 
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 ${selectedValueLevel === '高价值' ? 'bg-blue-600 text-white scale-105' : 'bg-gray-800 text-gray-400'}`}
                  onClick={() => setSelectedValueLevel('高价值')}
                >
                高价值
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${selectedValueLevel === '中价值' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                onClick={() => setSelectedValueLevel('中价值')}
              >
                中价值
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm ${selectedValueLevel === '低价值' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                onClick={() => setSelectedValueLevel('低价值')}
              >
                低价值
              </button>
            </div>
          </div>
          
          {/* 时间范围筛选 */}
          <div className="flex items-center">
            <span className="text-white mr-3">时间范围:</span>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-400 border border-gray-700">
                {dateRange.start}
              </span>
              <span className="text-gray-400">至</span>
              <span className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-400 border border-gray-700">
                {dateRange.end}
              </span>
              <button className="px-3 py-1 bg-blue-600 rounded text-sm text-white flex items-center" onClick={() => alert('日期选择功能已触发')}>
                <Calendar size={14} className="mr-1" /> 选择日期
              </button>
            </div>
          </div>
        </div>
        
        {/* 统计卡片区域 */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-blue-600 h-32 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-bold text-white">1,248</div>
              <div className="text-gray-400 text-sm">情报总数</div>
            </div>
            <div className="text-gray-500 text-xs">较上月增长12.8%</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-green-500 h-32 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-bold text-white">586</div>
              <div className="text-gray-400 text-sm">事件情报数</div>
            </div>
            <div className="text-gray-500 text-xs">较上月增长7.2%</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-amber-500 h-32 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-bold text-white">92.4%</div>
              <div className="text-gray-400 text-sm">处理准确率</div>
            </div>
            <div className="text-gray-500 text-xs">较上月提升0.8%</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-pink-500 h-32 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-bold text-white">2.7小时</div>
              <div className="text-gray-400 text-sm">平均响应时间</div>
            </div>
            <div className="text-gray-500 text-xs">较上月缩短0.4小时</div>
          </div>
        </div>
        
        {/* 图表区域 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* 事件类型分布柱状图 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-base font-medium">事件类型分布</h3>
              <button className="text-gray-400 hover:text-white">
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {eventTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* 情报来源分析饼图 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-base font-medium">情报来源分析</h3>
              <button className="text-gray-400 hover:text-white">
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={intelligenceSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {intelligenceSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* 事件趋势分析折线图 */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-base font-medium">事件趋势分析</h3>
              <button className="text-gray-400 hover:text-white">
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={eventTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={{ stroke: '#374151' }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="eventCount" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="trendIndex" 
                  stroke="#F59E0B" 
                  strokeWidth={2} 
                  dot={false} 
                />
                <Legend 
                  iconType="line" 
                  wrapperStyle={{ bottom: -5 }}
                  formatter={(value) => <span className="text-gray-400 text-sm">{value === 'eventCount' ? '事件数量' : '趋势指数'}</span>} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
          {/* 雷达图区域 - 区域事件热力分析 */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-base font-medium">区域事件热力分析</h3>
            <button className="text-gray-400 hover:text-white">
              <Download size={16} />
            </button>
          </div>
          
          {/* 单一雷达图展示 */}
          <div className="bg-gray-750 p-6 rounded-lg">
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart outerRadius={150} data={regionEventHeatData.domains.map((domain, index) => {
                  // 为每个领域创建一个数据点，包含各区域的值
                  const dataPoint: any = { domain };
                  regionEventHeatData.regions.forEach(region => {
                    dataPoint[region.name] = region.values[index];
                  });
                  return dataPoint;
                })}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis 
                    dataKey="domain" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                    tickLine={{ stroke: '#374151' }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                    axisLine={{ stroke: '#374151' }}
                  />
                  
                  {/* 为每个区域添加一条雷达线 */}
                  {regionEventHeatData.regions.map((region) => (
                    <Radar
                      key={region.name}
                      name={region.name}
                      dataKey={region.name}
                      stroke={region.color}
                      strokeWidth={2}
                      fill={region.color}
                      fillOpacity={0.1}
                    />
                  ))}
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
             {/* 区域图注 */}
            <div className="mt-4 text-center">
              <h4 className="text-sm font-medium text-white mb-3">区域图注</h4>
              <div className="flex justify-center space-x-6">
                {regionEventHeatData.regions.map((region) => (
                  <div key={region.name} className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: region.color }}></span>
                    <span className="text-sm text-gray-300">{region.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 表格区域 */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-base font-medium">实时预警事件分析</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300 border border-gray-700 hover:bg-gray-600 transition-colors flex items-center" onClick={() => {
                // 导出数据
                console.log('导出所有预警事件数据');
                // 模拟文件下载
                const link = document.createElement('a');
                link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('事件预警数据导出...');
                link.download = 'event_warning_data.txt';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}>
                <Download size={14} className="mr-1" /> 全部导出
              </button>
              <button className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300 border border-gray-700 hover:bg-gray-600 transition-colors flex items-center" onClick={() => {
                // 刷新数据
                console.log('刷新预警事件数据');
                // 这里可以添加加载状态
              }}>
                <RefreshCw size={14} className="mr-1" /> 刷新数据
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">事件名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">发生时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">事件类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">预警等级</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">影响指数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">趋势</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{event.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{event.time}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{event.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${event.levelColor} text-white`}>
                        {event.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{event.impact}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${event.trendColor} flex items-center`}>
                        {event.trendIcon} {event.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventWarningAnalysisPage;