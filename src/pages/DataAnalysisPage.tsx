import * as React from 'react';
import { useState, useContext, useEffect } from 'react';
import { 
  Search, Calendar, Filter, Download, RefreshCw, Star, ChevronDown, 
  ChevronRight, Bell, User, Menu, ArrowUp, ArrowDown, Info, AlertCircle,
  BarChart2 as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, MapPin as RadarChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { formatNumber, formatPercentage, getValueLevelColor, getTrendColor } from '@/lib/utils';
import { highValueData, mediumValueData, lowValueData, allValueData } from '@/lib/mockData';
import { intelligenceAPI } from '@/lib/api';
import { SystemSettingsContext } from '@/contexts/systemSettingsContext';
import { toast } from 'sonner';


// 组件内部状态管理
const DataAnalysisPage: React.FC = () => {
  const { systemSettings } = useContext(SystemSettingsContext);
  // 状态管理
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState({ start: '2023-06-01', end: '2023-06-30' });
  const [selectedEventCategory, setSelectedEventCategory] = useState('全部类型');
  const [selectedValueLevel, setSelectedValueLevel] = useState('全部等级');
  
  // 当前显示的数据
  const [currentData, setCurrentData] = useState(allValueData);
  // 图表加载状态
  const [chartLoading, setChartLoading] = useState(false);
  // 过滤后的事件列表
  const [filteredEvents, setFilteredEvents] = useState(allValueData.realtimeEvents);

  // 应用筛选条件
  const applyFilters = async () => {
    // 设置加载状态
    setChartLoading(true);
    
    try {
      // 调用API获取统计数据
      const params = {
        timeRange: `${dateRange.start},${dateRange.end}`,
        category: selectedEventCategory === '全部类型' ? '' : selectedEventCategory,
        level: selectedValueLevel === '全部等级' ? '' : selectedValueLevel
      };
      
      const response = await intelligenceAPI.getStatistics(params);
      
      // 检查响应数据
      if (response && response.data) {
        // 直接使用API返回的过滤后数据
        setCurrentData(response.data);
        setFilteredEvents(response.data.realtimeEvents || []);
      } else {
        // 如果API请求失败或没有返回数据，使用模拟数据并手动过滤
        // 根据价值等级选择基础数据
        let baseData;
        switch(selectedValueLevel) {
          case '高价值':
            baseData = highValueData;
            break;
          case '中价值':
            baseData = mediumValueData;
            break;
          case '低价值':
            baseData = lowValueData;
            break;
          default: // '全部等级'
            baseData = allValueData;
            break;
        }
        
        // 创建深拷贝，避免修改原始数据
        const dataToUse = JSON.parse(JSON.stringify(baseData));
        
        // 应用事件分类筛选到所有图表数据
        if (selectedEventCategory !== '全部类型') {
          // 筛选实时预警事件
          let filteredRealtimeEvents = dataToUse.realtimeEvents.filter((event: any) => {
            if (selectedEventCategory === '军事活动') {
              return ['军事行动', '军事调整'].includes(event.type);
            } else if (selectedEventCategory === '经济冲突') {
              return ['经济影响', '经济政策'].includes(event.type);
            } else if (selectedEventCategory === '政治事件') {
              return ['政治活动'].includes(event.type);
            } else if (selectedEventCategory === '涉外纠纷') {
              return ['国际摩擦', '涉外关系', '国际合作'].includes(event.type);
            }
            return true;
          });
          
          // 筛选事件类型分布数据
          if (dataToUse.eventType && selectedEventCategory !== '全部类型') {
            dataToUse.eventType = dataToUse.eventType.filter((item: any) => 
              item.name === selectedEventCategory
            );
          }
          
          // 更新筛选后的事件列表
          dataToUse.realtimeEvents = filteredRealtimeEvents;
        }
        
           // 应用日期范围筛选
           if (dateRange.start && dateRange.end) {
             const startDate = new Date(dateRange.start);
             const endDate = new Date(dateRange.end);
             
             // 筛选实时预警事件
             dataToUse.realtimeEvents = dataToUse.realtimeEvents.filter((event: any) => {
               const eventDate = new Date(event.time);
               return eventDate >= startDate && eventDate <= endDate;
             });
             
             // 筛选事件趋势分析数据
             if (dataToUse.eventTrend) {
               dataToUse.eventTrend = dataToUse.eventTrend.filter((item: any) => {
                 // 假设日期格式为 "MM-DD"
                 const [month, day] = item.date.split('-');
                 // 假设年份为2023
                 const itemDate = new Date(2023, parseInt(month) - 1, parseInt(day));
                 return itemDate >= startDate && itemDate <= endDate;
               });
             }
             
             // 筛选情报来源分析数据（添加这部分代码）
             if (dataToUse.intelligenceSource && dataToUse.eventTrend) {
               // 为了简化模拟，我们根据事件趋势数据中日期的筛选结果来调整情报来源数据
               // 在实际应用中，这里应该根据实际的日期关联来筛选
               const filteredEventTrendDates = dataToUse.eventTrend.map((item: any) => item.date);
               if (filteredEventTrendDates.length < dataToUse.eventTrend.length) {
                 // 如果事件趋势数据被筛选过，按比例调整情报来源数据
                 const adjustmentFactor = filteredEventTrendDates.length / dataToUse.eventTrend.length;
                 dataToUse.intelligenceSource = dataToUse.intelligenceSource.map((source: any) => ({
                   ...source,
                   value: Math.round(source.value * adjustmentFactor)
                 }));
               }
             }
           }
        
        // 更新当前数据和筛选后的事件列表
        setCurrentData(dataToUse);
        setFilteredEvents(dataToUse.realtimeEvents);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      
      // 错误处理，使用模拟数据并手动过滤
      let baseData;
      switch(selectedValueLevel) {
        case '高价值':
          baseData = highValueData;
          break;
        case '中价值':
          baseData = mediumValueData;
          break;
        case '低价值':
          baseData = lowValueData;
          break;
        default: // '全部等级'
          baseData = allValueData;
          break;
      }
      
      // 创建深拷贝，避免修改原始数据
      const dataToUse = JSON.parse(JSON.stringify(baseData));
      
      // 应用事件分类筛选
      if (selectedEventCategory !== '全部类型') {
        // 筛选实时预警事件
        let filteredRealtimeEvents = dataToUse.realtimeEvents.filter((event: any) => {
          if (selectedEventCategory === '军事活动') {
            return ['军事行动', '军事调整'].includes(event.type);
          } else if (selectedEventCategory === '经济冲突') {
            return ['经济影响', '经济政策'].includes(event.type);
          } else if (selectedEventCategory === '政治事件') {
            return ['政治活动'].includes(event.type);
          } else if (selectedEventCategory === '涉外纠纷') {
            return ['国际摩擦', '涉外关系', '国际合作'].includes(event.type);
          }
          return true;
        });
        
        // 筛选事件类型分布数据
        if (dataToUse.eventType && selectedEventCategory !== '全部类型') {
          dataToUse.eventType = dataToUse.eventType.filter((item: any) => 
            item.name === selectedEventCategory
          );
        }
        
        // 更新筛选后的事件列表
        dataToUse.realtimeEvents = filteredRealtimeEvents;
      }
      
      // 应用日期范围筛选
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        // 筛选实时预警事件
        dataToUse.realtimeEvents = dataToUse.realtimeEvents.filter((event: any) => {
          const eventDate = new Date(event.time);
          return eventDate >= startDate && eventDate <= endDate;
        });
        
        // 筛选事件趋势分析数据
        if (dataToUse.eventTrend) {
          dataToUse.eventTrend = dataToUse.eventTrend.filter((item: any) => {
            // 假设日期格式为 "MM-DD"
            const [month, day] = item.date.split('-');
            // 假设年份为2023
            const itemDate = new Date(2023, parseInt(month) - 1, parseInt(day));
            return itemDate >= startDate && itemDate <= endDate;
          });
        }
      }
      
      // 更新当前数据和筛选后的事件列表
      setCurrentData(dataToUse);
      setFilteredEvents(dataToUse.realtimeEvents);
    } finally {
      // 添加视觉反馈
      const container = document.querySelector('main');
      if (container) {
        container.classList.add('bg-blue-900/5');
        setTimeout(() => {
          container.classList.remove('bg-blue-900/5');
        }, 300);
      }
      
      // 关闭加载状态
      setChartLoading(false);
    }
  };

  // 事件分类和智能标签选项
    const eventCategories = ['全部类型', '军事活动', '政治事件', '经济冲突', '社会安全', '涉外纠纷'];
    const valueLevels = ['全部等级', '高价值', '中价值', '低价值'];
  


  // 导出图表数据为CSV
  const exportChartData = (chartType: string, data: any[]) => {
    try {
      let csvContent = '';
      let fileName = '';
      
      switch(chartType) {
        case 'eventType':
          // 事件类型分布数据
          csvContent = '类型,数值\n';
          data.forEach(item => {
            csvContent += `${item.name},${item.value}\n`;
          });
          fileName = '事件类型分布.csv';
          break;
          
        case 'intelligenceSource':
          // 情报来源分析数据
          csvContent = '来源,数值\n';
          data.forEach(item => {
            csvContent += `${item.name},${item.value}\n`;
          });
          fileName = '情报来源分析.csv';
          break;
          
        case 'eventTrend':
          // 事件趋势分析数据
          csvContent = '日期,事件数量,趋势指数\n';
          data.forEach(item => {
            csvContent += `${item.date},${item.eventCount},${item.trendIndex}\n`;
          });
          fileName = '事件趋势分析.csv';
          break;
          
        case 'regionEventHeat':
          // 区域事件热力分析数据
          if (data && data.regions && data.domains) {
            // 构建CSV标题行
            csvContent = '区域,' + data.domains.join(',') + '\n';
            
            // 添加每个区域的数据
            data.regions.forEach((region: any) => {
              csvContent += `${region.name},${region.values.join(',')}\n`;
            });
            fileName = '区域事件热力分析.csv';
          }
          break;
          
        default:
          throw new Error('未知的图表类型');
      }
      
      // 创建Blob对象
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 创建下载链接
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 显示成功提示
      toast.success(`${fileName} 数据导出成功`);
      
    } catch (error) {
      console.error('导出数据失败:', error);
      toast.error('数据导出失败，请重试');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* 主内容区域 */}
      <main className="p-6">
        {/* 筛选区域 */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 事件分类筛选 */}
            <div className="flex flex-col">
              <span className="text-white text-sm mb-2">主要类型</span>
              <div className="flex flex-wrap gap-2">
                {eventCategories.map((category) => (
                  <button 
                    key={category}
                    className={`px-3 py-1 rounded text-sm transition-all duration-200 ${selectedEventCategory === category ? 'bg-blue-600 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    onClick={() => setSelectedEventCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 智能标签筛选 */}
            <div className="flex flex-col">
                   <span className="text-white text-sm mb-2">价值等级</span>
                   <div className="flex flex-wrap gap-2">
                     {valueLevels.map((level) => (
                       <button 
                         key={level}
                         className={`px-3 py-1 rounded text-sm transition-all duration-200 ${selectedValueLevel === level ? 'bg-blue-600 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                         onClick={() => setSelectedValueLevel(level)}
                       >
                         {level}
                       </button>
                     ))}
                   </div>
            </div>
            
                  {/* 时间范围筛选 */}
                 <div className="flex flex-col">
                   <span className="text-white text-sm mb-2">时间范围</span>
                   <div className="flex items-center space-x-2">
                     <input
                       type="date"
                       value={dateRange.start}
                       onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                       className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-300 border border-gray-700"
                     />
                     <span className="text-gray-400">至</span>
                     <input
                       type="date"
                       value={dateRange.end}
                       onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                       className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-300 border border-gray-700"
                     />
                     <button 
                       className="px-3 py-1 bg-blue-600 rounded text-sm text-white flex items-center hover:bg-blue-700 transition-colors"
                       onClick={applyFilters}
                     >
                       <Calendar size={14} className="mr-1" /> 应用日期
                     </button>
                   </div>
                 </div>
          </div>
          
          {/* 应用筛选按钮 */}
          <div className="mt-4 flex justify-center">
            <button 
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              onClick={applyFilters}
            >
              <Filter size={16} className="mr-2" /> 应用筛选条件
            </button>
          </div>
        </div>
        
  {/* 统计卡片区域 */}
  <div className="grid grid-cols-4 gap-6 mb-6">
    {currentData.metrics.map((metric, index) => (
      <div key={index} className={`bg-gray-800 p-4 rounded-lg border-l-4 ${
        index === 0 ? 'border-blue-600' : 
        index === 1 ? 'border-green-500' : 
        index === 2 ? 'border-amber-500' : 
        'border-pink-500'
      } h-32 flex flex-col justify-between transition-all duration-500`}>
        <div>
          <div className="text-2xl font-bold text-white">{metric.value}{metric.unit}</div>
          <div className="text-gray-400 text-sm">{metric.name}</div>
        </div>
        <div className={`text-xs flex items-center ${metric.trend === '上升' ? 'text-green-500' : 'text-red-500'}`}>
          {metric.trend === '上升' ? (
            <ArrowUp size={12} className="mr-1" />
          ) : (
            <ArrowDown size={12} className="mr-1" />
          )}
          较上月{metric.change}
        </div>
      </div>
    ))}
  </div>
      
        
        {/* 图表区域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
           {/* 事件类型分布柱状图 */}
           <div className="bg-gray-800 p-4 rounded-lg relative overflow-hidden">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-base font-bold flex items-center">
                   <BarChartIcon size={18} className="mr-2 text-blue-500" />
                   事件类型分布
                 </h3>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16"></div>
              <button 
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => exportChartData('eventType', currentData.eventType || [])}
              >
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={currentData.eventType} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  {currentData.eventType.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`colorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={entry.color} stopOpacity={0.3}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={{ stroke: '#374151' }} 
                  height={50}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={{ stroke: '#374151' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {currentData.eventType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorGradient-${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
                    
           {/* 情报来源分析饼图 */}
           <div className="bg-gray-800 p-4 rounded-lg">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-white text-base font-bold flex items-center">
                   <PieChartIcon size={18} className="mr-2 text-green-500" />
                   情报来源分析
                </h3>
                <button 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => exportChartData('intelligenceSource', currentData.intelligenceSource || [])}
                >
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={currentData.intelligenceSource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {currentData.intelligenceSource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend 
                  formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
           {/* 事件趋势分析折线图 */}
           <div className="bg-gray-800 p-4 rounded-lg relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-base font-bold flex items-center">
                    <LineChartIcon size={18} className="mr-2 text-amber-500" />
                    事件趋势分析                 </h3>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 rounded-full -mr-16 -mt-16"></div>
                <button 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => exportChartData('eventTrend', currentData.eventTrend || [])}
                >
                <Download size={16} />
              </button>
            </div>
             <ResponsiveContainer width="100%" height={240}>
               <LineChart data={currentData.eventTrend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={{ stroke: '#374151' }}
                  label={{ value: '日期', position: 'insideBottom', offset: -5, fill: '#9CA3AF', fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={{ stroke: '#374151' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="eventCount" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3B82F6', strokeWidth: 1, stroke: '#1E40AF' }} 
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="trendIndex" 
                  stroke="#F59E0B" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#F59E0B', strokeWidth: 1, stroke: '#92400E' }} 
                  activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
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
             <h3 className="text-white text-base font-bold flex items-center">
               <RadarChartIcon size={18} className="mr-2 text-purple-500" />
               区域事件热力分析
            </h3>
            <button 
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => exportChartData('regionEventHeat', currentData.regionEventHeat || [])}
            >
              <Download size={16} />
            </button>
          </div>
          
          {/* 单一雷达图展示 */}
          <div className="bg-gray-750 p-6 rounded-lg">
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart outerRadius={150} data={currentData.regionEventHeat.domains.map((domain, index) => {
                  // 为每个领域创建一个数据点，包含各区域的值
                  const dataPoint: any = { domain };
                  currentData.regionEventHeat.regions.forEach(region => {
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
                  {currentData.regionEventHeat.regions.map((region) => (
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
            <div className="mt-4 text-center"><h4 className="text-sm font-medium text-white mb-3">区域图注</h4>
              <div className="flex justify-center space-x-6">
                {currentData.regionEventHeat.regions.map((region) => (
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
            <h3 className="text-white text-base font-bold flex items-center">
              <AlertCircle size={18} className="mr-2 text-red-500" />
              实时预警事件分析
            </h3>
            <div className="flex space-x-2">
               <button className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300 border border-gray-700 hover:bg-gray-600 transition-colors flex items-center" onClick={() => {
                try {
                  // 导出完整的CSV格式数据
                  console.log('导出所有预警事件数据');
                  
                  // 创建CSV内容
                  let csvContent = '事件名称,发生时间,事件类型,预警等级,影响指数,趋势\n';
                  
                  // 添加数据行
                  filteredEvents.forEach(event => {
                    // 处理CSV中的逗号和引号
                    const sanitize = (text: string) => {
                      if (typeof text === 'string') {
                        // 包含逗号或引号的字段需要用引号包裹
                        if (text.includes(',') || text.includes('"')) {
                          return `"${text.replace(/"/g, '""')}"`;
                        }
                      }
                      return text;
                    };
                    
                    const row = [
                      sanitize(event.name),
                      sanitize(event.time),
                      sanitize(event.type),
                      sanitize(event.level),
                      event.impact,
                      sanitize(event.trend)
                    ].join(',');
                    
                    csvContent += row + '\n';
                  });
                  
                  // 创建下载链接
                  const link = document.createElement('a');
                  // 使用BOM确保中文正常显示
                  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', 'event_warning_data.csv');
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  // 释放URL对象
                  setTimeout(() => {
                    URL.revokeObjectURL(url);
                  }, 100);
                  
                  // 显示成功提示
                  toast.success('预警事件数据导出成功');
                  
                } catch (error) {
                  console.error('导出数据失败:', error);
                  toast.error('数据导出失败，请重试');
                }
              }}>
                <Download size={14} className="mr-1" /> 全部导出
              </button>
              <button 
                className="px-3 py-1 bg-gray-700 rounded text-sm text-gray-300 border border-gray-700 hover:bg-gray-600 transition-colors flex items-center"
                onClick={() => {
                  // 刷新数据
                  console.log('刷新预警事件数据');
                  // 模拟刷新成功
                  setTimeout(() => {
                    console.log('数据已刷新');
                  }, 500);
                }}
              >
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
                        {event.trendIcon === 'arrow-up' ? <ArrowUp size={14} className="inline mr-1" /> : <ArrowDown size={14} className="inline mr-1" />}
                        {event.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      {/* 页脚 */}
      <footer className="px-6 py-4 border-t border-gray-800 text-gray-500 text-sm mt-10">
        <div className="flex justify-between items-center">
          <div>© 2026 {systemSettings.systemName} - {systemSettings.systemVersion}</div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-gray-400 transition-colors">使用帮助</a>
            <a href="#" className="hover:text-gray-400 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-gray-400 transition-colors">服务条款</a>
            <a href="#" className="hover:text-gray-400 transition-colors">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DataAnalysisPage;