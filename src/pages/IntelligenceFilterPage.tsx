import * as React from 'react';
import { useState, useEffect, useContext, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Calendar, Filter, Download, RefreshCw, ChevronDown,
  BarChart2 as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import {findAllPassages, findPassageByQuery, findQueryInPassage} from "@/lib/api/passage";
import { SystemSettingsContext } from '@/contexts/systemSettingsContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

// 导出模拟数据以供其他组件使用
export const intelligenceEventsData = [
  {
    id: 1,
    name: 'Syria Unrest: Assad Fights for Political Survival as 30-Year Rule Wavers',
    time: '2011-04-27',
    type: '军事活动',
    value: '2', // 2代表高价值
    level: '高价值',
    levelColor: 'bg-red-500',
    isHot: true,
    text: 'BEIRUT | Wed Apr 27 , 2011 10:19 am EDT BEIRUT -LRB- Reuters -RRB- - Syrian President Bashar al-Assad , who had boasted his country was immune to the unrest lashing the Arab world \'s autocrats , is now fighting for political survival . \nThe 45-year-old leader has tried economic carrots , political concessions and brute force to try to quell a popular upheaval that rights groups say has cost over 450 lives in six weeks . \nSyria , mired in its gravest crisis since Assad \'s father crushed an armed Islamist revolt in 1982 , risks international opprobrium and sanctions for its repressive response .',
    query: 'Arab_league',
    events: [
      {
        eid: 1,
        text: 'The Arab League issued a blanket condemnation on April 26 of the use of force against pro-democracy Arab protesters.'
      },
      {
        eid: 2,
        text: 'The Arab League has remained silent on Syria, although it swiftly suspended Libya\'s membership over Gaddafi\'s efforts to quell opposition.'
      }
    ]
  },
  {
    id: 2,
    name: 'Syria\'s Jisr al-Shughour Unrest: Civilians Flee to Turkey as Troops Advance, Fearing Bloodshed',
    time: '2011-06-07',
    type: '政治事件',
    value: '2', // 2代表高价值
    level: '高价值',
    levelColor: 'bg-red-500',
    isHot: true,
    text: 'A man wearing a mask of Syrian President Bashar al-Assad demonstrates against Assad in front of the International Criminal Court offices in The Hague , June 7 , 2011 . \nAMMAN | Tue Jun 7 , 2011 6:31 pm EDT AMMAN -LRB- Reuters -RRB- - Syrians fled a restive town toward the Turkish border , fearing bloodshed as troops with tanks approached , under orders to hit back after the government accused armed bands there of killing scores of its security men .',
    query: 'Arab_league',
    events: [
      {
        eid: 3,
        text: 'France and Britain took a lead in pushing U.N. moves against Syrian President Bashar al-Assad.'
      },
      {
        eid: 4,
        text: 'Russia said it would veto intervention against Syria in the United Nations Security Council.'
      }
    ]
  },
  {
    id: 3,
    name: 'After Crushing Gulf Protests, Saudi Arabia Goes Quiet on Syria and Yemen Amid Internal Divisions',
    time: '2011-07-13',
    type: '政治事件',
    value: '2', // 2代表高价值
    level: '高价值',
    levelColor: 'bg-red-500',
    isHot: true,
    text: 'DUBAI | Wed Jul 13 , 2011 7:13 am BST DUBAI -LRB- Reuters -RRB- - Saudi Arabia has helped damp down democracy movements sweeping the Arab world but is waiting now to see how events play out in places like Syria and Yemen for fear of overplaying its hand . \nAfter witnessing the sudden collapse of rulers in Egypt and Tunisia this year , the Al Saud family that monopolises power in Saudi Arabia orchestrated Gulf Arab moves to stop the unrest from spreading through the Gulf region .',
    query: 'Arab_league',
    events: [
      {
        eid: 5,
        text: 'Saudi, United Arab Emirates and Kuwaiti forces went to Bahrain in March to help crush protests threatening to force the ruling family there to make democratic changes.'
      },
      {
        eid: 6,
        text: 'They offered money to Oman and Bahrain for more social spending.'
      }
    ]
  },
  {
    id: 4,
    name: 'Gulf Nations Recall Ambassadors from Syria, Escalating Regional Pressure on Regime',
    time: '2011-08-08',
    type: '涉外纠纷',
    value: '1', // 1代表中价值
    level: '中价值',
    levelColor: 'bg-amber-500',
    isHot: false,
    text: 'By Mike Wooldridge World Affairs correspondent , BBC News , London Syrian sympathisers in Turkey have held rallies in support of the protesters More Gulf Arab nations have withdrawn their ambassadors from Syria as the government \'s crackdown against protesters continues unabated . \nKuwait and Bahrain have now followed Saudi Arabia in recalling their ambassadors for consultations .',
    query: 'Arab_league',
    events: [
      {
        eid: 7,
        text: 'Saudi Arabia\'s king publicly criticized Bashar al-Assad, urging Damascus to \'stop the killing machine and the bloodshed before it is too late\'.'
      },
      {
        eid: 8,
        text: 'Kuwait told Syria that \'the military option must be halted\'.'
      }
    ]
  },
  {
    id: 5,
    name: 'Saudi Arabia Recalls Syria Ambassador, Condemning Deadly Crackdown on Protesters',
    time: '2011-08-08',
    type: '政治事件',
    value: '1', // 1代表中价值
    level: '中价值',
    levelColor: 'bg-amber-500',
    isHot: false,
    text: 'Saudi Arabia recalls ambassador to Syria Protests have continued in cities across Syria despite the crackdown by security forces Saudi Arabia has said it is recalling its ambassador from Damascus in protest against Syria \'s deadly crackdown on anti-government demonstrators . \nA statement from King Abdullah said the violence was " unacceptable " and called for it to stop before it was too late .',
    query: 'Arab_league',
    events: [
      {
        eid: 9,
        text: 'The Arab League issued its first official statement, strongly condemning the violence.'
      },
      {
        eid: 10,
        text: 'King Abdullah declared that his country had taken an \'historic decision\' despite all the support it had given Syria in the past.'
      }
    ]
  },
  {
    id: 6,
    name: 'Arab League Urges Syria Ceasefire – Envoy to Deliver Crisis Initiative',
    time: '2011-08-28',
    type: '政治事件',
    value: '0', // 0代表低价值
    level: '低价值',
    levelColor: 'bg-blue-500',
    isHot: false,
    text: 'Arab League chief Nabil al-Arabi to visit Syria Nabil al-Arabi will try to negotiate an end to the crisis in Syria , the Arab League says Arab League Secretary General Nabil al-Arabi is to visit Syria to try to resolve the crisis in the country . \nHe will take with him an " initiative to solve the crisis " , the league said , without giving further details .',
    query: 'Arab_league',
    events: [
      {
        eid: 11,
        text: 'Arab League Secretary General Nabil al-Arabi is to visit Syria to try to resolve the crisis in the country.'
      },
      {
        eid: 12,
        text: 'The Arab League called on Damascus to stop the violence and usher in reforms.'
      }
    ]
  }
];

const IntelligenceFilterPage: React.FC = () => {
  const { systemSettings } = useContext(SystemSettingsContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 状态管理
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部事件');
  const [selectedValueLevel, setSelectedValueLevel] = useState('全部等级');
  const [sortMethod, setSortMethod] = useState('价值最高');
  const [currentPage, setCurrentPage] = useState(1);
  const [rawEvents, setRawEvents] = useState<any[]>([]); // 原始数据，用于前端筛选
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [expandedEventIds, setExpandedEventIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasKeywordSearch, setHasKeywordSearch] = useState(false);

  // 每页显示的事件数量
  const EVENTS_PER_PAGE = 10;
  const LAST_QUERY_KEY = 'lastQuery';
  const HOME_LAST_QUERY_KEY = 'homeLastQuery';

  const normalizeEvent = (event: any) => ({
    ...event,
    source: event?.source ?? event?.psg_source ?? '-',
    region: event?.region ?? event?.psg_region ?? '-',
    correlation: event?.correlation ?? event?.psg_correlation ?? '-',
  });

  // 加载初始数据（使用findAll接口）
  const loadInitialData = async () => {
    setHasKeywordSearch(false);
    localStorage.removeItem(LAST_QUERY_KEY);
    localStorage.removeItem(HOME_LAST_QUERY_KEY);
    setLoading(true);
    try {
      const response = await findAllPassages();
      console.log('API响应数据:', response);  

      if (response && response.data) {
        const normalizedData = response.data.map((event: any) => normalizeEvent(event));
        setRawEvents(normalizedData);
        applyFrontendFilters(normalizedData);
      } else {
        console.error('获取初始事件列表失败');
        // 使用模拟数据
        // let results = [...intelligenceEventsData];
        //
        // // 应用排序
        // switch(sortMethod) {
        //   case '时间最新':
        //     results = [...results].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        //     break;
        //   case '价值最高':
        //   default:
        //     const valueLevelOrder = { '高价值': 3, '中价值': 2, '低价值': 1 };
        //     results = [...results].sort((a, b) => {
        //       const levelDiff = valueLevelOrder[b.level as keyof typeof valueLevelOrder] - valueLevelOrder[a.level as keyof typeof valueLevelOrder];
        //       return levelDiff;
        //     });
        //     break;
        // }
        //
        // setFilteredEvents(results);
      }
    } catch (error) {
      console.error('获取初始事件列表失败:', error);
      // 错误处理，使用模拟数据
      // let results = [...intelligenceEventsData];
      //
      // // 应用排序
      // switch(sortMethod) {
      //   case '时间最新':
      //     results = [...results].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      //     break;
      //   case '价值最高':
      //   default:
      //     const valueLevelOrder = { '高价值': 3, '中价值': 2, '低价值': 1 };
      //     results = [...results].sort((a, b) => {
      //       const levelDiff = valueLevelOrder[b.level as keyof typeof valueLevelOrder] - valueLevelOrder[a.level as keyof typeof valueLevelOrder];
      //       return levelDiff;
      //     });
      //     break;
      // }
      //
      // setFilteredEvents(results);
    } finally {
      setLoading(false);
    }
  };

  // 过滤和搜索事件（使用带参数的接口）
  const handleSearch = async (keyword?: string) => {
    const finalKeyword = (keyword ?? searchKeyword).trim();
    if (!finalKeyword) {
      loadInitialData();
      return;
    }

    setHasKeywordSearch(true);

    setLoading(true);
    try {
      // 每次查询前先通过 findQueryInPassage 匹配标准 query，并保存到 localStorage
      let matchedQuery = finalKeyword;
      try {
        const queryMatchResponse = await findQueryInPassage(finalKeyword);
        console.log('findQueryInPassage响应数据:', queryMatchResponse);
        if (queryMatchResponse && queryMatchResponse.data) {
          matchedQuery = queryMatchResponse.data[0];
          console.log(`输入关键词 "${finalKeyword}" 匹配到标准 query: "${matchedQuery}"`);
        }
      } catch (matchError) {
        console.error('匹配query失败，回退使用输入关键词:', matchError);
      }

      localStorage.setItem(LAST_QUERY_KEY, matchedQuery);
      // 兼容首页当前使用的 key
      localStorage.setItem(HOME_LAST_QUERY_KEY, matchedQuery);

      // 构建搜索参数
      const params = {
        keyword: matchedQuery,
        page: currentPage,
        pageSize: EVENTS_PER_PAGE
      };

      // 调用API服务
      const response = await findPassageByQuery(params.keyword)
      console.log('API响应数据:', response);

      // 检查响应数据
      if (response && response.data) {
        const normalizedData = response.data.map((event: any) => normalizeEvent(event));
        setRawEvents(normalizedData);
        applyFrontendFilters(normalizedData);
      }
      else {
        // 如果API请求失败或没有返回数据，使用模拟数据
        // results = [...intelligenceEventsData];
      }
      // 应用关键词精确匹配搜索
      // if (searchKeyword) {
      //   const keyword = searchKeyword.trim();
      //   // 只匹配query字段完全等于关键词的事件
      //   results = results.filter(event =>
      //       event.query === keyword
      //   );
      // }

      // // 应用事件类型筛选
      // if (selectedCategory !== '全部事件') {
      //   // 根据选择的类别进行精确匹配
      //   results = results.filter(event => event.type === selectedCategory);
      // }
      //
      // // 应用价值等级筛选
      // if (selectedValueLevel !== '全部等级') {
      //   results = results.filter(event =>
      //       event.level === selectedValueLevel
      //   );
      // }
      //
      // // 应用排序
      // switch(sortMethod) {
      //   case '时间最新':
      //     // 按时间最新排序
      //     results = [...results].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      //     break;
      //   case '价值最高':
      //   default:
      //     // 按价值等级和置信度排序
      //     const valueLevelOrder = { '高价值': 3, '中价值': 2, '低价值': 1 };
      //     results = [...results].sort((a, b) => {
      //       const levelDiff = valueLevelOrder[b.level as keyof typeof valueLevelOrder] - valueLevelOrder[a.level as keyof typeof valueLevelOrder];
      //       return levelDiff;
      //     });
      //     break;
      // }
      // setFilteredEvents(results);
    } catch (error) {
      console.error('获取事件列表失败:', error);
      // 错误处理，使用模拟数据
      // let results = [...intelligenceEventsData];
      //
      // // 应用关键词精确匹配搜索
      // if (searchKeyword) {
      //   const keyword = searchKeyword.trim();
      //   // 只匹配query字段完全等于关键词的事件
      //   results = results.filter(event =>
      //       event.query === keyword
      //   );
      // }
      //
      // // 应用事件类型筛选
      // if (selectedCategory !== '全部事件') {
      //   // 根据选择的类别进行精确匹配
      //   results = results.filter(event => event.type === selectedCategory);
      // }
      //
      // // 应用价值等级筛选
      // if (selectedValueLevel !== '全部等级') {
      //   results = results.filter(event =>
      //       event.level === selectedValueLevel
      //   );
      // }
      //
      // // 应用排序
      // switch(sortMethod) {
      //   case '时间最新':
      //     // 按时间最新排序
      //     results = [...results].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      //     break;
      //   case '价值最高':
      //   default:
      //     // 按价值等级和置信度排序
      //     const valueLevelOrder = { '高价值': 3, '中价值': 2, '低价值': 1 };
      //     results = [...results].sort((a, b) => {
      //       const levelDiff = valueLevelOrder[b.level as keyof typeof valueLevelOrder] - valueLevelOrder[a.level as keyof typeof valueLevelOrder];
      //       return levelDiff;
      //     });
      //     break;
      // }
      //
      // setFilteredEvents(results);
    } finally {
      setLoading(false);
      setCurrentPage(1); // 重置到第一页
    }
  };

  // 前端筛选函数 - 基于已有的数据进行筛选和排序
  const applyFrontendFilters = (data: any[]) => {
    let results = [...data];

    // 应用事件类型筛选
    if (selectedCategory !== '全部事件') {
      // 根据选择的类别进行精确匹配
      results = results.filter(event => event.type === selectedCategory);
    }

    // 应用价值等级筛选
    if (selectedValueLevel !== '全部等级') {
      results = results.filter(event =>
          event.level === selectedValueLevel
      );
    }

    // 应用排序
    switch(sortMethod) {
      case '时间最新':
        // 按时间最新排序
        results = [...results].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        break;
      case '价值最高':
      default:
        // 按价值等级排序
        // const valueLevelOrder = { '高价值': 3, '中价值': 2, '低价值': 1 };
        // results = [...results].sort((a, b) => {
        //   const levelDiff = valueLevelOrder[b.level as keyof typeof valueLevelOrder] - valueLevelOrder[a.level as keyof typeof valueLevelOrder];
        //   return levelDiff;
        // });
        results = [...results].sort((a, b) => {
          const numA = parseFloat(a.correlation?.replace('%', '') || '0');
          const numB = parseFloat(b.correlation?.replace('%', '') || '0');
          return numB - numA;
        });
        break;
    }

    setFilteredEvents(results);
  };

  // 切换事件展开状态
  const toggleEventExpansion = (eventId: number) => {
    setExpandedEventIds(prev =>
        prev.includes(eventId)
            ? prev.filter(id => id !== eventId)
            : [...prev, eventId]
    );
  };

  // 获取当前页显示的事件
  const getCurrentPageEvents = () => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  };

  // 计算总页数
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

  // 指标卡片数据（直接基于 findPassageByQuery 返回并保存的 rawEvents）
  const overviewMetrics = useMemo(() => {
    const trimmedKeyword = searchKeyword.trim();
    const queryTag = trimmedKeyword
      ? String(rawEvents?.[0]?.query || trimmedKeyword)
      : '-';
    const intelligenceTotal = rawEvents.length;
    const relatedEventTotal = rawEvents.reduce((sum: number, item: any) => {
      const eventCount = Array.isArray(item?.events) ? item.events.length : 0;
      return sum + eventCount;
    }, 0);

    const highValueIntelligenceTotal = rawEvents.filter((item: any) => {
      const levelText = String(item?.level ?? '').toLowerCase();
      const valueText = String(item?.value ?? '').trim();
      return levelText.includes('高价值') || levelText.includes('high') || valueText === '2';
    }).length;

    return {
      queryTag,
      intelligenceTotal,
      relatedEventTotal,
      highValueIntelligenceTotal,
    };
  }, [rawEvents, searchKeyword]);

  const aggregationKeyword = overviewMetrics.queryTag === '-'
    ? ''
    : String(overviewMetrics.queryTag);

  // 图表数据（基于API返回并经过筛选的数据）
  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

  const eventTypeChartData = useMemo(() => {
    const map = new Map<string, number>();
    filteredEvents.forEach((event: any) => {
      const key = event?.type || '未知类型';
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
    }));
  }, [filteredEvents]);

  const intelligenceSourceChartData = useMemo(() => {
    const sourceTypeLabelMap: Record<number, string> = {
      0: '政府公报',
      1: '公开新闻',
      2: '社交媒体',
      3: '内部情报',
      4: '专家分析',
    };

    const map = new Map<string, number>();
    filteredEvents.forEach((event: any) => {
      const sourceTypeValue = Number(event?.sourceType);
      const key = Number.isNaN(sourceTypeValue)
        ? (event?.source || '未知来源')
        : (sourceTypeLabelMap[sourceTypeValue] || '未知来源');
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
    }));
  }, [filteredEvents]);

  const eventTrendChartData = useMemo(() => {
    const map = new Map<string, { count: number; correlationTotal: number; correlationCount: number }>();

    filteredEvents.forEach((event: any) => {
      const date = event?.time || '未知日期';
      const current = map.get(date) || { count: 0, correlationTotal: 0, correlationCount: 0 };
      const correlation = Number(event?.correlation);

      current.count += 1;
      if (!Number.isNaN(correlation)) {
        current.correlationTotal += correlation;
        current.correlationCount += 1;
      }

      map.set(date, current);
    });

    return Array.from(map.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, value]) => ({
        date,
        eventCount: value.count,
        trendIndex: value.correlationCount > 0
          ? Number((value.correlationTotal / value.correlationCount).toFixed(2))
          : value.count,
      }));
  }, [filteredEvents]);

  // 筛选类别 - 只保留真实数据中涉及的事件类型
  const eventCategories = ['全部事件', '军事活动', '政治事件', '涉外纠纷', '社会安全'];
  const valueLevels = ['全部等级', '高价值', '中价值', '低价值'];
  const sortMethods = ['价值最高', '时间最新'];

  // URL关键词变化时自动检索；无关键词时加载默认列表
  useEffect(() => {
    const keywordFromUrl = (searchParams.get('keyword') || '').trim();
    if (!keywordFromUrl) {
      loadInitialData();
      return;
    }

    if (keywordFromUrl === searchKeyword) {
      return;
    }

    setSearchKeyword(keywordFromUrl);
    handleSearch(keywordFromUrl);
  }, [searchParams]);

  // 监听所有筛选条件变化，确保任何变化都能立即触发筛选
  // 监听前端筛选条件变化，在前端进行筛选
  useEffect(() => {
    if (rawEvents.length > 0) {
      applyFrontendFilters(rawEvents);
    }
  }, [selectedCategory, selectedValueLevel, sortMethod, rawEvents]);

  return (
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        {/* 主内容区域 */}
        <main className="p-6">
          {/* 搜索与筛选区域 */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 搜索框 */}
              <div className="relative flex-grow">
                <input
                    type="text"
                    placeholder="输入关键词搜索事件情报..."
                    value={searchKeyword}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSearchKeyword(e.target.value);
                    }}
                    className="w-full py-2 px-4 pl-10 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        handleSearch();
                      }
                    }}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              </div>

              {/* 筛选按钮组 */}
              <div className="flex flex-wrap gap-3">
                {/*<button className="px-3 py-2 bg-gray-800 text-gray-300 rounded-md border border-gray-700 flex items-center hover:bg-gray-700 transition-colors" onClick={(e) => {*/}
                {/*  e.stopPropagation();*/}
                {/*  // 日期筛选功能*/}
                {/*  alert('日期筛选功能已触发');*/}
                {/*}}>*/}
                {/*  <Calendar size={16} className="mr-2" /> 日期筛选*/}
                {/*</button>*/}
                {/*<button className="px-3 py-2 bg-gray-800 text-gray-300 rounded-md border border-gray-700 flex items-center hover:bg-gray-700 transition-colors" onClick={(e) => {*/}
                {/*  e.stopPropagation();*/}
                {/*  // 高级筛选功能*/}
                {/*  alert('高级筛选功能已触发');*/}
                {/*}}>*/}
                {/*  <Filter size={16} className="mr-2" /> 高级筛选*/}
                {/*</button>*/}
                <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" onClick={(e) => {
                  e.stopPropagation();
                  handleSearch();
                }}>
                  搜索
                </button>
              </div>
            </div>

            {/* 快速筛选标签 */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* 事件类型筛选 */}
              <div>
                <div className="text-sm text-gray-400 mb-1">事件类型</div>
                <div className="flex flex-wrap gap-2">
                  {eventCategories.map((category) => (
                      <button
                          key={category}
                          className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${selectedCategory === category ? 'bg-blue-600 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category);
                          }}
                      >
                        {category}
                      </button>
                  ))}
                </div>
              </div>

              {/* 价值等级筛选 */}
              <div>
                <div className="text-sm text-gray-400 mb-1">价值等级</div>
                <div className="flex flex-wrap gap-2">
                  {valueLevels.map((level) => (
                      <button
                          key={level}
                          className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${selectedValueLevel === level ? 'bg-blue-600 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedValueLevel(level);
                          }}
                      >
                        {level}
                      </button>
                  ))}
                </div>
              </div>

              {/* 排序方式 */}
              <div>
                <div className="text-sm text-gray-400 mb-1">排序方式</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                      className="bg-gray-800 border border-gray-700 text-gray-300 rounded-md px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={sortMethod}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSortMethod(e.target.value);
                      }}
                  >
                    {sortMethods.map((method) => (
                        <option key={method} value={method} className="bg-gray-800">
                          {method}
                        </option>
                    ))}
                  </select>


                </div>
              </div>
              <div className="flex items-center justify-center">
                {hasKeywordSearch && aggregationKeyword && (
                  <button
                    className="px-6 py-1 text-x1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    onClick={() => navigate(`/intelligence-aggregation?keyword=${encodeURIComponent(aggregationKeyword)}`)}
                  >
                    查看事件关联分析
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 筛选结果统计 */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-gray-400 text-sm">
              显示 {(currentPage - 1) * EVENTS_PER_PAGE + 1}-{Math.min(currentPage * EVENTS_PER_PAGE, filteredEvents.length)} 条结果（共 <span className="text-white">{filteredEvents.length}</span> 条筛选结果）
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700 hover:bg-gray-700 transition-colors flex items-center">
                <Download size={14} className="mr-1" /> 导出筛选结果
              </button>
              <button className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700 hover:bg-gray-700 transition-colors flex items-center">
                <RefreshCw size={14} className="mr-1" /> 刷新
              </button>
            </div>
          </div>

          {/* 数据概览卡片（与首页一致） */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-center">
            <div className="relative group bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
              <div className="text-3xl font-bold text-blue-400 truncate">{overviewMetrics.queryTag}</div>
              <div className="pointer-events-none absolute left-1/2 bottom-full z-20 mt-2 hidden w-max max-w-[28rem] -translate-x-1/2 rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-xs text-gray-200 shadow-xl group-hover:block">
                {overviewMetrics.queryTag || '-'}
              </div>
              <div className="text-gray-400 text-sm">本次查询匹配标签</div>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
              <div className="text-3xl font-bold text-green-400">{overviewMetrics.intelligenceTotal}</div>
              <div className="text-gray-400 text-sm">情报总数</div>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
              <div className="text-3xl font-bold text-amber-400">{overviewMetrics.relatedEventTotal}</div>
              <div className="text-gray-400 text-sm">相关事件总数</div>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
              <div className="text-3xl font-bold text-purple-400">{overviewMetrics.highValueIntelligenceTotal}</div>
              <div className="text-gray-400 text-sm">高价值情报数</div>
            </div>
          </div>

          {/* 图表区域（来自API返回数据） */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* 事件类型分布柱状图 */}
            <div className="bg-gray-800 p-4 rounded-lg relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-base font-bold flex items-center">
                  <BarChartIcon size={18} className="mr-2 text-blue-500" />
                  事件类型分布
                </h3>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16"></div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={eventTypeChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {eventTypeChartData.map((entry, index) => (
                      <Cell key={`event-type-cell-${index}`} fill={entry.color} />
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
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={intelligenceSourceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {intelligenceSourceChartData.map((entry, index) => (
                      <Cell key={`source-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} />
                  <Legend formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 事件趋势分析折线图 */}
            <div className="bg-gray-800 p-4 rounded-lg relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-base font-bold flex items-center">
                  <LineChartIcon size={18} className="mr-2 text-amber-500" />
                  事件趋势分析
                </h3>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 rounded-full -mr-16 -mt-16"></div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={eventTrendChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={{ stroke: '#374151' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '4px', color: '#fff' }} />
                  <Line type="monotone" dataKey="eventCount" stroke="#3B82F6" strokeWidth={3} dot={{ r: 3 }} name="事件数量" />
                  <Line type="monotone" dataKey="trendIndex" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3 }} name="趋势指数" />
                  <Legend formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 事件列表 - 列表形式带卡片包裹 */}
          <div className="mb-6">
            {loading ? (
                    <div className="bg-gray-800 rounded-lg p-8 text-center">
                      <div className="text-4xl mb-3">⏳</div>
                      <h3 className="text-gray-300 text-lg mb-2">加载中...</h3>
                      <p className="text-gray-400">正在获取事件情报数据</p>
                    </div>
                ) : filteredEvents.length > 0 ? (
                <div className="space-y-3">
                  {getCurrentPageEvents().map((event, index) => (
                      <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/10"
                      >
                        <div className="p-4">
                          {/* 标题和标签行 - 保持在同一行 */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center flex-grow">
                              {event.isHot && (
                                  <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full mr-2 whitespace-nowrap">热点事件</span>
                              )}
                              <h4 className="text-white font-medium truncate flex-grow">{event.name}</h4>
                            </div>
                            <div className="flex items-center">
                         <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded-full whitespace-nowrap">
                             {event.query}
                         </span>
                         <span className={`mr-2 px-2 py-0.5 text-xs rounded-full ${event.levelColor} text-white whitespace-nowrap`}>
                           {event.level}
                         </span>
                              <button
                                  className="text-gray-400 hover:text-white"
                                  onClick={() => toggleEventExpansion(event.id)}
                              >
                                <ChevronDown
                                    size={20}
                                    className={`transform transition-transform duration-300 ${expandedEventIds.includes(event.id) ? 'rotate-180' : ''}`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* 信息行 */}
                          <div className="flex flex-wrap items-center text-xs text-gray-500 gap-x-4">
                       <span className="flex items-center">
                         <Calendar size={12} className="mr-1" />
                         {event.time}
                       </span>
                            <span className="flex items-center">
                         <Filter size={12} className="mr-1" />
                              {event.type}
                       </span>
                            <span className="flex items-center">
                              情报来源：{event.source || '-'}
                            </span>
                            <span className="flex items-center">
                              相关地区：{event.region || '-'}
                            </span>
                            <span className="flex items-center">
                              相关性评分：{event.correlation || '-'}
                            </span>
                          </div>

                          {/* 展开详情 */}
                          {expandedEventIds.includes(event.id) && (
                              <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-4 pt-4 border-t border-gray-700"
                              >
                                {/* 详细内容 */}
                                <div className="mb-4">
                                  <div className="text-sm text-gray-400 mb-1">详细内容</div>
                                  <div className="text-sm text-gray-300 bg-gray-750 p-3 rounded-md max-h-40 overflow-y-auto whitespace-pre-line break-words">
                                    {event.text.replace(/\\n/g, '\n').replace(/\n/g, '\n')}
                                  </div>
                                </div>

                                {/* 相关事件 */}
                                <div>
                                  <div className="text-sm text-gray-400 mb-2">相关事件</div>
                                  <div className="space-y-2">
                                    {event.events && event.events.map((item: any) => (
                                        <div key={item.eid} className="bg-gray-750 p-3 rounded-md">
                                          <p className="text-sm text-gray-300">eid{item.eid}: {item.text}</p>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                          )}
                        </div>
                      </motion.div>
                  ))}
                </div>
            ) : (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-gray-300 text-lg mb-2">暂无数据</h3>
                  <p className="text-gray-400">没有找到符合条件的情报数据</p>
                </div>
            )}

            {/* 分页 */}
            {filteredEvents.length > EVENTS_PER_PAGE && (
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center space-x-1">
                    <button
                        className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === 1 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                      上一页
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                          <button
                              key={pageNum}
                              className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                              onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                      );
                    })}
                    <button className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === totalPages ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                    >
                      下一页
                    </button>
                  </div>
                </div>
            )}
          </div>
        </main>

        {/* 页脚 */}
        <footer className="px-6 py-4 border-t border-gray-800 text-gray-500 text-sm mt-10">
          <div className="flex justify-between items-center">
            <div>© 2025 {systemSettings.systemName} - {systemSettings.systemVersion}</div>
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

export default IntelligenceFilterPage;