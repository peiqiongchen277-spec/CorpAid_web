import * as React from 'react';
import { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, Download, RefreshCw,
  ChevronRight, ArrowUp, AlertCircle,
  CalendarDays, Clock, MapPin, Target, Flag, Users, BarChart3, FileText,
  Shield, Award, X
} from 'lucide-react';
import { findPassageByQuery } from '@/lib/api/passage';
import { findPAByQuery, findTimelineByQuery } from '@/lib/api/report';
import { toast } from 'sonner';
import { SystemSettingsContext } from '../contexts/systemSettingsContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


// 模拟数据 - 事件概览指标
const eventOverviewMetrics = [
  { name: '事件关联度', value: 87.3, unit: '%', color: '#3B82F6' },
  { name: '情报时效性', value: 94.2, unit: '%', color: '#10B981' },
  { name: '信息完整率', value: 91.5, unit: '%', color: '#F59E0B' },
  { name: '综合评分', value: 8.7, unit: '/10', color: '#EC4899' }
];

// 默认要素分析（当接口数据不足时兜底）
const defaultElementAnalysisData = {
  时间范围: '2011-03-18 - 2011-08-28',
  事件跨度: '共164天，涉及10天重要事件',
  主要区域: '叙利亚、中东地区、国际社会',
  重点关注: '大马士革、德拉、联合国安理会',
  涉及国家: '叙利亚、俄罗斯、法国、英国、沙特阿拉伯',
  高频词汇: '冲突、制裁、安全、外交、局势'
};

// 从JSON文件提取的timeline数据
const timelineData = {
  "2011-03-18": {
    "overall": "15 Deraa youngsters' arrest for anti-government slogans sparked Syria's revolt, with three same-day deaths."
  },
  "2011-04-21": {
    "overall": "Bashar al-Assad ended 48 years of emergency law and scrapped the hated state security court as political concessions."
  },
  "2011-04-22": {
    "overall": "Security forces killed 100 protesters, making Assad's earlier reform moves a mockery."
  },
  "2011-04-25": {
    "overall": "Assad sent army tanks into Deraa and two suburbs of Damascus to suppress protests."
  },
  "2011-04-26": {
    "overall": "Arab League condemned force against pro-democracy protesters but stayed silent on Syria, unlike suspending Libya's membership."
  },
  "2011-04-27": {
    "overall": "IMF projected Syria's 2011 3% growth, 6% inflation, 6.8% GDP deficit; unrest delayed mobile license bidding."
  },
  "2011-06-07": {
    "overall": "Syrians fled to Turkey amid government advances; France/Britain pushed U.N. action against Assad, Russia vetoed intervention, Hague urged Assad to reform or step down."
  },
  "2011-07-13": {
    "overall": "GCC states took actions including Saudi-led troop deployment to Bahrain, a Yemen peace deal, Saudi aid to Jordan, with Saudi Syria/Yemen diplomacy muted by internal divisions."
  },
  "2011-08-08": {
    "overall": "GCC states (recalling ambassadors), Turkey, the U.S. and the UN condemned Syria's violence and urged Assad to halt force."
  },
  "2011-08-28": {
    "overall": "Arab League/Turkey/Iran urged Syria on reforms; Syria rejected the league's call, Russia opposed Western UNSC resolution and proposed its own."
  }
};

// 从JSON文件提取的impact数据
const impactData = {
  "coreConclusion": "The 2011 Syria unrest will trigger short-term humanitarian crises and diplomatic isolation, medium-term sectarian conflicts and escalated geopolitical games, and long-term national governance restructuring and regional order reshaping, requiring responses across humanitarian, diplomatic mediation, post-war reconstruction and other dimensions.",
  "impactPrediction": {
    "shortTerm": {
      "timeFrame": "Within 2011",
      "overall": "Syria will face multiple intertwined predicaments, including a worsening humanitarian crisis, deepening diplomatic isolation and a rapid economic recession, all of which will collectively intensify social conflicts."
    },
    "mediumTerm": {
      "timeFrame": "2012-2014",
      "overall": "Syria will face sectarian and civil war risks, intensified geopolitical games, and spillover of regional unrest."
    },
    "longTerm": {
      "timeFrame": "2015 and Beyond",
      "overall": "Syria will see the collapse of its original power structure and the need for governance restructuring, along with reshaped regional order and a decades-long social and economic recovery."
    }
  },
  "respStrategy": {
    "shortTerm": {
      "goal": "Loss Control and Crisis Mitigation",
      "overall": "The international community should promote emergency humanitarian intervention, push for ceasefire and diplomatic mediation, and adopt targeted sanctions with risk control to address the Syrian crisis."
    },
    "mediumTerm": {
      "goal": "Preventing Spillover and Political Transition",
      "overall": "The international community should build regional security buffers, promote an inclusive UN-led political transition process, and unite to contain extremist forces and sectarian conflicts to address the Syrian crisis."
    },
    "longTerm": {
      "goal": "Reconstruction and Order Restoration",
      "overall": "The international community should support Syria's post-war reconstruction, assist in building an inclusive governance system, and promote regional dialogue to reshape balance."
    }
  }
};

// 将timeline数据转换为数组格式用于显示
const formatTimelineData = (data: any) => {
  const toDate = (value: any): Date | null => {
    if (!value) return null;
    const date = new Date(String(value).trim());
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const sortedEntries = Object.entries(data || {}).sort(
    ([dateA, itemA]: [string, any], [dateB, itemB]: [string, any]) => {
      const parsedA = toDate(itemA?.time) || toDate(dateA);
      const parsedB = toDate(itemB?.time) || toDate(dateB);

      if (!parsedA && !parsedB) return String(dateA).localeCompare(String(dateB));
      if (!parsedA) return 1;
      if (!parsedB) return -1;
      return parsedA.getTime() - parsedB.getTime();
    }
  );

  return sortedEntries.map(([date, item]: [string, any], index) => ({
    date,
    time: item?.time || date,
    event: item?.overall,
    isHot: index % 3 === 0  // 每3个事件设置一个热点标记
  }));
};

const parseDateLike = (value: any): Date | null => {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (date: Date | null) => {
  if (!date) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const extractTopItems = (items: string[], limit: number) => {
  const counter = new Map<string, number>();
  items.forEach((item) => {
    const key = item.trim();
    if (!key) return;
    counter.set(key, (counter.get(key) || 0) + 1);
  });
  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
};

const COUNTRY_KEYWORDS = [
  '叙利亚', '俄罗斯', '法国', '英国', '沙特阿拉伯', '土耳其', '伊朗', '美国', '以色列',
  'Syria', 'Russia', 'France', 'Britain', 'United Kingdom', 'Saudi Arabia', 'Turkey', 'Iran', 'United States', 'Israel'
];

const FOCUS_KEYWORDS = [
  '大马士革', '德拉', '联合国安理会', '中东地区', '叙利亚',
  'Damascus', 'Deraa', 'UN Security Council', 'Middle East'
];

const KEYWORD_STOP_WORDS = new Set([
  '事件', '相关', '进行', '以及', '其中', '我们', '你们', '他们', '这个', '那个', '需要', '可能', '通过', '已经',
  'and', 'the', 'for', 'with', 'from', 'that', 'this', 'were', 'will', 'into', 'amid', 'over', 'under', 'after',
  'against', 'about', 'their', 'would', 'could', 'should', 'have', 'has', 'had','they','them','said','then','what','when','where','who','which','while','how','all','any','more','other','some','such','people','been','also','may','like','than','these','those','because','while','during','before','after','since','until','there'
]);

const extractHighFrequencyKeywords = (texts: string[], minCount: number = 3, maxCount: number = 5) => {
  const allText = texts.join(' ').toLowerCase();
  if (!allText.trim()) return [];

  const tokenMatches = allText.match(/[\u4e00-\u9fa5]{2,6}|[a-z]{4,}/g) || [];
  const counter = new Map<string, number>();

  tokenMatches.forEach((token) => {
    const word = token.trim();
    if (!word || KEYWORD_STOP_WORDS.has(word)) return;
    counter.set(word, (counter.get(word) || 0) + 1);
  });

  const sorted = Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word);

  const count = Math.min(maxCount, Math.max(minCount, sorted.length));
  return sorted.slice(0, count);
};


const ReportGenerationPage: React.FC = () => {
  const { systemSettings } = useContext(SystemSettingsContext);
  const [searchParams] = useSearchParams();

  // 状态管理
  const [searchKeyword, setSearchKeyword] = useState(''); // 默认不搜索，需要用户输入
  const [isAggregating, setIsAggregating] = useState(false);
  const [showReport, setShowReport] = useState(false); // 默认不显示报告
    // 弹出框状态
  const [showElementDetailModal, setShowElementDetailModal] = useState(false);
  const [showVerticalTimelineModal, setShowVerticalTimelineModal] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [reportData, setReportData] = useState<any>({
    timeline: timelineData,
    impact: impactData
  });
  const [showSummaryComparison, setShowSummaryComparison] = useState(false);
  const [needSearchFirst, setNeedSearchFirst] = useState(false);
  const hasPromptedNeedSearchRef = useRef(false);
  

  // 将timeline数据转换为数组格式
  const timelineArray = formatTimelineData(reportData.timeline);
  console.log('TimelineData:', reportData.timeline);
  const eventKeyword = filteredEvents.length > 0 ? filteredEvents[0].query : searchKeyword

  const overviewMetrics = useMemo(() => {
    const trimmedKeyword = String(searchKeyword || '').trim();
    const queryTag = trimmedKeyword
      ? String(filteredEvents?.[0]?.query || trimmedKeyword)
      : '-';
    const intelligenceTotal = filteredEvents.length;
    const relatedEventTotal = filteredEvents.reduce((sum: number, item: any) => {
      const eventCount = Array.isArray(item?.events) ? item.events.length : 0;
      return sum + eventCount;
    }, 0);

    const highValueIntelligenceTotal = filteredEvents.filter((item: any) => {
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
  }, [filteredEvents, searchKeyword]);

  const elementAnalysisData = useMemo(() => {
    const timelineObj = reportData?.timeline || {};
    console.log('Timeline Object:', timelineObj);
    const timelineEntries = Object.entries(timelineObj).map(([date, item]: [string, any]) => ({
      date,
      time: String(item?.time || '').trim(),
      overall: String(item?.overall || '').trim()
    }));
    console.log('Timeline Entries:', timelineEntries);
    const dateCandidates: Date[] = [];
    timelineEntries.forEach((item) => {
      // 优先解析 date，没有再解析 time
      const validDate = parseDateLike(item.time) || parseDateLike(item.date);
      if (validDate) {
        dateCandidates.push(validDate);
      }
    });
    console.log('Date Candidates:', dateCandidates);
    const sortedDates = [...dateCandidates].sort((a, b) => a.getTime() - b.getTime());
    console.log('Sorted Dates:', sortedDates);
    const startDate = sortedDates[0] || null;
    const endDate = sortedDates[sortedDates.length - 1] || null;
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    const spanDays = startDate && endDate
      ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      : null;
    const importantDays = timelineEntries.length;

    const regionTokens = filteredEvents
      .flatMap((item: any) => String(item?.region || '').split(/[、,，;；/\s]+/))
      .map((s: string) => s.trim())
      .filter(Boolean);
    const mainRegions = extractTopItems(regionTokens, 3);

    const corpus = [
      ...filteredEvents.map((item: any) => String(item?.description || '')),
      ...filteredEvents.map((item: any) => String(item?.region || '')),
      ...timelineEntries.map((item) => item.overall),
      String(reportData?.impact?.coreConclusion || '')
    ].join(' | ');
    const corpusLower = corpus.toLowerCase();

    const focusList = extractTopItems(
      FOCUS_KEYWORDS.filter((k) => corpusLower.includes(k.toLowerCase())),
      4
    );
    const countries = extractTopItems(
      COUNTRY_KEYWORDS.filter((k) => corpusLower.includes(k.toLowerCase())),
      6
    );
    const highFreqKeywords = extractHighFrequencyKeywords(
      filteredEvents.map((item: any) => `${String(item?.name || '')} ${String(item?.description || '')}`),
      3,
      5
    );

    return {
      时间范围: (startDate && endDate)
        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
        : defaultElementAnalysisData.时间范围,
      事件跨度: spanDays
        ? `共${spanDays}天，涉及${importantDays}天重要事件`
        : defaultElementAnalysisData.事件跨度,
      主要区域: mainRegions.length > 0
        ? mainRegions.join('、')
        : defaultElementAnalysisData.主要区域,
      重点关注: focusList.length > 0
        ? focusList.join('、')
        : (mainRegions.length > 0 ? mainRegions.join('、') : defaultElementAnalysisData.重点关注),
      涉及国家: countries.length > 0
        ? countries.join('、')
        : defaultElementAnalysisData.涉及国家,
      高频词汇: highFreqKeywords.length > 0
        ? highFreqKeywords.join('、')
        : defaultElementAnalysisData.高频词汇
    };
  }, [filteredEvents, reportData]);

  // 搜索相关query下的所有情报
  const handleSearch = async (keyword?: string) => {
    if (needSearchFirst) {
      toast.warning('请先至“情报筛选”界面搜索情报');
      return;
    }

    const finalKeyword = String(keyword ?? searchKeyword ?? '').trim();

    if (!finalKeyword) {
      toast.warning('请输入搜索关键词');
      setFilteredEvents([]);
      setIsFilterApplied(false);
      setShowReport(false);
      return;
    }

    if (finalKeyword !== searchKeyword) {
      setSearchKeyword(finalKeyword);
    }

    setIsAggregating(true);

    let results: any[] = [];

    try {
      // 使用后端的findPassagesByQuery接口获取数据
      const response = await findPassageByQuery(finalKeyword);

      if (response && response.data) {
        // 如果API返回数据，使用API数据
        results = response.data.map((event: any) => ({
          id: event.id,
          query: event.query,
          name: event.name,
          time: event.time,
          events: event.events || [],
          value: event.value,
          level: event.level,
          levelColor: event.levelColor,
          region: event.region || event.psg_region || '',
          source: event.source || event.psg_source || '',
          description: event.text || event.content || ''
        }));
    
      } else {
        // // 如果API请求失败或没有返回数据，使用模拟数据作为备用
        // const results = intelligenceEventsData.filter(event =>
        //     event.query === searchKeyword
        // ).map((event) => ({
        //   id: event.id,
        //   query: event.query,
        //   name: event.name,
        //   time: event.time,
        //   level: event.level,
        //   levelColor: event.levelColor
        // }));
        //
        // setFilteredEvents(results);
      }
      // 检查结果是否为空
      if (results.length === 0) {
        toast.warning('未找到相关情报，请尝试其他关键词');
      }

      setFilteredEvents(results);
      setIsFilterApplied(true);
      setShowReport(false); // 搜索后隐藏报告，等待重新聚合
    } catch (error) {
      console.error('搜索情报失败:', error);
      toast.error('搜索情报失败，请重试');

      // 错误处理，使用模拟数据
      // const results = intelligenceEventsData.filter(event =>
      //     event.query === searchKeyword
      // ).map((event) => ({
      //   id: event.id,
      //   query: event.query,
      //   name: event.name,
      //   time: event.time,
      //   level: event.level,
      //   levelColor: event.levelColor
      // }));
      //
      // setFilteredEvents(results);
      // setIsFilterApplied(true);
      // setShowReport(false); // 搜索后隐藏报告，等待重新聚合
    } finally {
      setIsAggregating(false);
    }
  };

  useEffect(() => {
    const keywordFromUrl = String(searchParams.get('keyword') || '').trim();
    if (!keywordFromUrl) {
      setNeedSearchFirst(true);
      setFilteredEvents([]);
      setIsFilterApplied(false);
      setShowReport(false);

      if (!hasPromptedNeedSearchRef.current) {
        toast.warning('请先至“情报筛选”界面搜索情报');
        hasPromptedNeedSearchRef.current = true;
      }
      return;
    }

    setNeedSearchFirst(false);
    hasPromptedNeedSearchRef.current = false;

    if (keywordFromUrl === searchKeyword && filteredEvents.length > 0) {
      return;
    }

    handleSearch(keywordFromUrl);
  }, [searchParams]);

  // 重新聚合并生成报告
  const reaggregateData = async () => {
    if (needSearchFirst) {
      toast.warning('请先至“情报筛选”界面搜索情报');
      return;
    }

    if (!searchKeyword) {
      // 提示用户先搜索
      toast.warning('请先搜索相关关键词');
      return;
    }

    // 检查搜索结果是否为空
    if (filteredEvents.length === 0) {
      toast.warning('搜索结果为空，无法生成报告');
      return;
    }

    setIsAggregating(true);
    toast.info('正在生成报告，请稍候...');

    try {
      // 1. 先获取时间线数据
      const timelineResponse = await findTimelineByQuery(searchKeyword);

      // 2. 获取预测与建议数据
      const paResponse = await findPAByQuery(searchKeyword);

      console.log(timelineResponse)
      console.log(paResponse)

      // 合并数据
      const newReportData = {
        timeline: timelineResponse.data,
        impact: paResponse.data
      };

      setReportData(newReportData);
      setShowReport(true);

      toast.success('报告生成成功');
    } catch (error) {
      console.error('生成报告失败:', error);
      toast.error('生成报告失败，使用缓存数据');

      // 错误处理，仍然显示报告界面，但使用本地数据
      setShowReport(true);
    } finally {
      setIsAggregating(false);
    }
  };

  // 导出报告
  const exportReport = () => {
    if (!searchKeyword || !showReport) {
      toast.warning('请先生成报告再导出');
      return;
    }

    setIsAggregating(true);
    toast.info('正在准备导出报告...');

    try {
      // 直接使用当前生成的报告数据进行导出
      // 按照用户要求，包含事件概览、发展脉络和预测与应对措施三块内容
      const reportContent = JSON.stringify({
        // 基本信息
        reportInfo: {
          query: searchKeyword,
          exportDate: new Date().toISOString(),
          version: '事件要请智能分析平台专业版 v1.0'
        },

        // 事件概览部分
        overview: {
          coreConclusion: reportData.impact.coreConclusion,
        },

        // 发展脉络部分
        timeline: {
          formattedTimeline: timelineArray
        },

        // 预测与应对措施部分
        predictionAndResponse: {
          impactPrediction: reportData.impact.impactPrediction,
          responseStrategies: reportData.impact.responseStrategies
        }
      }, null, 2);

      // 创建下载链接
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent);
      link.download = `intelligence_report_${searchKeyword}_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('报告导出成功');
    } catch (error) {
      console.error('导出报告失败:', error);
      toast.error('导出报告失败，请重试');
    } finally {
      setIsAggregating(false);
    }
  };

    // 导出报告为PDF
  const exportReportToPDF = async () => {
    if (!searchKeyword || !showReport) {
      toast.warning('请先生成报告再导出');
      return;
    }
    
    setIsAggregating(true);
    toast.info('正在准备导出PDF报告...');
    
    try {
      // 创建一个临时容器，用于渲染要导出的PDF内容
      const pdfContent = document.createElement('div');
      pdfContent.style.position = 'absolute';
      pdfContent.style.top = '-9999px';
      pdfContent.style.left = '-9999px';
      pdfContent.style.width = '210mm'; // A4宽度
      pdfContent.style.background = '#fff';
      pdfContent.style.color = '#000';
      pdfContent.style.padding = '20mm';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      
      // 添加报告标题
      const title = document.createElement('h1');
      title.textContent = `${eventKeyword} 事件分析报告`;
      title.style.textAlign = 'center';
      title.style.marginBottom = '20px';
      title.style.fontSize = '24px';
      pdfContent.appendChild(title);
      
      // 添加报告生成日期
      const date = document.createElement('p');
      date.textContent = `生成日期: ${new Date().toLocaleDateString()}`;
      date.style.textAlign = 'center';
      date.style.marginBottom = '30px';
      date.style.fontSize = '14px';
      date.style.color = '#666';
      pdfContent.appendChild(date);

      // 添加数据概览卡片
      const overviewSection = document.createElement('section');
      overviewSection.style.marginBottom = '30px';

      const overviewTitle = document.createElement('h2');
      overviewTitle.textContent = '数据概览';
      overviewTitle.style.fontSize = '18px';
      overviewTitle.style.marginBottom = '15px';
      overviewTitle.style.borderBottom = '2px solid #3B82F6';
      overviewTitle.style.paddingBottom = '5px';
      overviewSection.appendChild(overviewTitle);

      const overviewGrid = document.createElement('div');
      overviewGrid.style.display = 'grid';
      overviewGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      overviewGrid.style.gap = '12px';

      const overviewMetricCards = [
        { label: '本次查询匹配标签', value: overviewMetrics.queryTag, color: '#60A5FA' },
        { label: '情报总数', value: String(overviewMetrics.intelligenceTotal), color: '#34D399' },
        { label: '相关事件总数', value: String(overviewMetrics.relatedEventTotal), color: '#FBBF24' },
        { label: '高价值情报数', value: String(overviewMetrics.highValueIntelligenceTotal), color: '#C084FC' }
      ];

      overviewMetricCards.forEach((item) => {
        const metricCard = document.createElement('div');
        metricCard.style.border = '1px solid #ddd';
        metricCard.style.borderRadius = '8px';
        metricCard.style.padding = '14px';
        metricCard.style.textAlign = 'center';

        const metricValue = document.createElement('div');
        metricValue.textContent = item.value;
        metricValue.style.fontSize = '24px';
        metricValue.style.fontWeight = 'bold';
        metricValue.style.color = item.color;
        metricValue.style.marginBottom = '6px';

        const metricName = document.createElement('div');
        metricName.textContent = item.label;
        metricName.style.fontSize = '13px';
        metricName.style.color = '#666';

        metricCard.appendChild(metricValue);
        metricCard.appendChild(metricName);
        overviewGrid.appendChild(metricCard);
      });

      overviewSection.appendChild(overviewGrid);
      pdfContent.appendChild(overviewSection);
      
      // 添加核心结论部分
      const conclusionSection = document.createElement('section');
      conclusionSection.style.marginBottom = '30px';
      
      const conclusionTitle = document.createElement('h2');
      conclusionTitle.textContent = '核心结论';
      conclusionTitle.style.fontSize = '18px';
      conclusionTitle.style.marginBottom = '10px';
      conclusionTitle.style.borderBottom = '2px solid #3B82F6';
      conclusionTitle.style.paddingBottom = '5px';
      conclusionSection.appendChild(conclusionTitle);
      
      const conclusionText = document.createElement('p');
      conclusionText.textContent = reportData.impact.coreConclusion;
      conclusionText.style.lineHeight = '1.6';
      conclusionText.style.textAlign = 'justify';
      conclusionSection.appendChild(conclusionText);
      
      pdfContent.appendChild(conclusionSection);
      
      // 添加事件概览指标
      const metricsSection = document.createElement('section');
      metricsSection.style.marginBottom = '30px';
      
      const metricsTitle = document.createElement('h2');
      metricsTitle.textContent = '事件概览指标';
      metricsTitle.style.fontSize = '18px';
      metricsTitle.style.marginBottom = '15px';
      metricsTitle.style.borderBottom = '2px solid #3B82F6';
      metricsTitle.style.paddingBottom = '5px';
      metricsSection.appendChild(metricsTitle);
      
      const metricsGrid = document.createElement('div');
      metricsGrid.style.display = 'grid';
      metricsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      metricsGrid.style.gap = '15px';
      
      eventOverviewMetrics.forEach(metric => {
        const metricCard = document.createElement('div');
        metricCard.style.border = '1px solid #ddd';
        metricCard.style.borderRadius = '5px';
        metricCard.style.padding = '15px';
        metricCard.style.textAlign = 'center';
        
        const metricValue = document.createElement('div');
        metricValue.textContent = `${metric.value}${metric.unit}`;
        metricValue.style.fontSize = '24px';
        metricValue.style.fontWeight = 'bold';
        metricValue.style.color = metric.color;
        metricValue.style.marginBottom = '5px';
        
        const metricName = document.createElement('div');
        metricName.textContent = metric.name;
        metricName.style.fontSize = '14px';
        metricName.style.color = '#666';
        
        metricCard.appendChild(metricValue);
        metricCard.appendChild(metricName);
        metricsGrid.appendChild(metricCard);
      });
      
      metricsSection.appendChild(metricsGrid);
      pdfContent.appendChild(metricsSection);
      
      // 添加要素分析
      const elementsSection = document.createElement('section');
      elementsSection.style.marginBottom = '30px';
      
      const elementsTitle = document.createElement('h2');
      elementsTitle.textContent = '要素分析';
      elementsTitle.style.fontSize = '18px';
      elementsTitle.style.marginBottom = '15px';
      elementsTitle.style.borderBottom = '2px solid #3B82F6';
      elementsTitle.style.paddingBottom = '5px';
      elementsSection.appendChild(elementsTitle);
      
      const elementsGrid = document.createElement('div');
      elementsGrid.style.display = 'grid';
      elementsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      elementsGrid.style.gap = '10px';
      
      (Object.entries(elementAnalysisData) as Array<[string, string]>).forEach(([key, value]) => {
        const elementItem = document.createElement('div');
        elementItem.style.borderBottom = '1px solid #eee';
        elementItem.style.padding = '8px 0';
        
        const elementKey = document.createElement('span');
        elementKey.textContent = `${key}: `;
        elementKey.style.fontWeight = 'bold';
        elementKey.style.color = '#333';
        
        const elementValue = document.createElement('span');
        elementValue.textContent = value as string;
        elementValue.style.color = '#666';
        
        elementItem.appendChild(elementKey);
        elementItem.appendChild(elementValue);
        elementsGrid.appendChild(elementItem);
      });
      
      elementsSection.appendChild(elementsGrid);
      pdfContent.appendChild(elementsSection);
      
      // 添加发展脉络时间线
      const timelineSection = document.createElement('section');
      timelineSection.style.marginBottom = '30px';
      
      const timelineTitle = document.createElement('h2');
      timelineTitle.textContent = '发展脉络';
      timelineTitle.style.fontSize = '18px';
      timelineTitle.style.marginBottom = '15px';
      timelineTitle.style.borderBottom = '2px solid #3B82F6';
      timelineTitle.style.paddingBottom = '5px';
      timelineSection.appendChild(timelineTitle);
      
      const timelineContainer = document.createElement('div');
      timelineContainer.style.marginLeft = '20px';

      timelineArray.forEach((item) => {
        const timelineItem = document.createElement('div');
        timelineItem.style.marginBottom = '15px';
        timelineItem.style.paddingLeft = '20px';
        timelineItem.style.position = 'relative';
        timelineItem.style.borderLeft = '2px solid #3B82F6';
        timelineItem.style.paddingBottom = '15px';
        
        // 添加时间点圆点
        const timelineDot = document.createElement('div');
        timelineDot.style.position = 'absolute';
        timelineDot.style.left = '-9px';
        timelineDot.style.top = '0';
        timelineDot.style.width = '16px';
        timelineDot.style.height = '16px';
        timelineDot.style.borderRadius = '50%';
        timelineDot.style.backgroundColor = item.isHot ? '#EF4444' : '#3B82F6';
        timelineDot.style.border = '2px solid #fff';
        timelineDot.style.boxShadow = '0 0 0 2px #3B82F6';
        timelineItem.appendChild(timelineDot);
        
        // 添加日期
        const timelineDate = document.createElement('h4');
        timelineDate.textContent = item.time || '未知日期';
        timelineDate.style.fontSize = '14px';
        timelineDate.style.fontWeight = 'bold';
        timelineDate.style.marginBottom = '5px';
        timelineItem.appendChild(timelineDate);
        
        // 添加事件内容
        const timelineContent = document.createElement('p');
        timelineContent.textContent = item.event || '暂无详细信息';
        timelineContent.style.fontSize = '12px';
        timelineContent.style.lineHeight = '1.5';
        timelineContent.style.color = '#666';
        timelineItem.appendChild(timelineContent);
        
        timelineContainer.appendChild(timelineItem);
      });
      
      timelineSection.appendChild(timelineContainer);
      pdfContent.appendChild(timelineSection);
      
      // 添加预测与应对措施
      const predictionSection = document.createElement('section');
      predictionSection.style.marginBottom = '30px';
      
      const predictionTitle = document.createElement('h2');
      predictionTitle.textContent = '预测与应对措施';
      predictionTitle.style.fontSize = '18px';
      predictionTitle.style.marginBottom = '15px';
      predictionTitle.style.borderBottom = '2px solid #3B82F6';
      predictionTitle.style.paddingBottom = '5px';
      predictionSection.appendChild(predictionTitle);
      
      // 短期影响
      const shortTerm = document.createElement('div');
      shortTerm.style.marginBottom = '20px';
      
      const shortTermTitle = document.createElement('h3');
      shortTermTitle.textContent = `${reportData.impact.impactPrediction.shortTerm.timeFrame} - 短期影响`;
      shortTermTitle.style.fontSize = '16px';
      shortTermTitle.style.marginBottom = '8px';
      shortTerm.appendChild(shortTermTitle);
      
const shortTermContent = document.createElement('p');
shortTermContent.textContent = reportData?.impact?.impactPrediction?.shortTerm?.overall || '暂无短期影响数据';
      shortTermContent.style.fontSize = '14px';
      shortTermContent.style.lineHeight = '1.5';
      shortTermContent.style.color = '#666';
      shortTerm.appendChild(shortTermContent);
      
      // 短期应对策略
      const shortTermStrategy = document.createElement('div');
      shortTermStrategy.style.marginTop = '10px';
      shortTermStrategy.style.padding = '10px';
      shortTermStrategy.style.backgroundColor = '#f0f7ff';
      shortTermStrategy.style.borderLeft = '3px solid #3B82F6';
      shortTermStrategy.style.borderRadius = '4px';
      
      const shortTermStrategyTitle = document.createElement('h4');
      shortTermStrategyTitle.textContent = '短期应对策略措施：';
      shortTermStrategyTitle.style.fontSize = '13px';
      shortTermStrategyTitle.style.color = '#1E40AF';
      shortTermStrategyTitle.style.marginBottom = '5px';
      shortTermStrategy.appendChild(shortTermStrategyTitle);
      
const shortTermStrategyContent = document.createElement('p');
shortTermStrategyContent.textContent = reportData?.impact?.respStrategy?.shortTerm?.overall || '暂无短期应对策略数据';
      shortTermStrategyContent.style.fontSize = '13px';
      shortTermStrategyContent.style.lineHeight = '1.5';
      shortTermStrategyContent.style.color = '#334155';
      shortTermStrategy.appendChild(shortTermStrategyContent);
      shortTerm.appendChild(shortTermStrategy);
      
      predictionSection.appendChild(shortTerm);
      
      // 中期影响
      const mediumTerm = document.createElement('div');
      mediumTerm.style.marginBottom = '20px';
      
      const mediumTermTitle = document.createElement('h3');
      mediumTermTitle.textContent = `${reportData.impact.impactPrediction.mediumTerm.timeFrame} - 中期影响`;
      mediumTermTitle.style.fontSize = '16px';
      mediumTermTitle.style.marginBottom = '8px';
      mediumTerm.appendChild(mediumTermTitle);
      
const mediumTermContent = document.createElement('p');
mediumTermContent.textContent = reportData?.impact?.impactPrediction?.mediumTerm?.overall || '暂无中期影响数据';
      mediumTermContent.style.fontSize = '14px';
      mediumTermContent.style.lineHeight = '1.5';
      mediumTermContent.style.color = '#666';
      mediumTerm.appendChild(mediumTermContent);
      
      // 中期应对策略
      const mediumTermStrategy = document.createElement('div');
      mediumTermStrategy.style.marginTop = '10px';
      mediumTermStrategy.style.padding = '10px';
      mediumTermStrategy.style.backgroundColor = '#f0f7ff';
      mediumTermStrategy.style.borderLeft = '3px solid #3B82F6';
      mediumTermStrategy.style.borderRadius = '4px';
      
      const mediumTermStrategyTitle = document.createElement('h4');
      mediumTermStrategyTitle.textContent = '中期应对策略措施：';
      mediumTermStrategyTitle.style.fontSize = '13px';
      mediumTermStrategyTitle.style.color = '#1E40AF';
      mediumTermStrategyTitle.style.marginBottom = '5px';
      mediumTermStrategy.appendChild(mediumTermStrategyTitle);
      
const mediumTermStrategyContent = document.createElement('p');
mediumTermStrategyContent.textContent = reportData?.impact?.respStrategy?.mediumTerm?.overall || '暂无中期应对策略数据';
      mediumTermStrategyContent.style.fontSize = '13px';
      mediumTermStrategyContent.style.lineHeight = '1.5';
      mediumTermStrategyContent.style.color = '#334155';
      mediumTermStrategy.appendChild(mediumTermStrategyContent);
      mediumTerm.appendChild(mediumTermStrategy);
      
      predictionSection.appendChild(mediumTerm);
      
      // 长期影响
      const longTerm = document.createElement('div');
      
      const longTermTitle = document.createElement('h3');
      longTermTitle.textContent = `${reportData.impact.impactPrediction.longTerm.timeFrame} - 长期影响`;
      longTermTitle.style.fontSize = '16px';
      longTermTitle.style.marginBottom = '8px';
      longTerm.appendChild(longTermTitle);
      
const longTermContent = document.createElement('p');
longTermContent.textContent = reportData?.impact?.impactPrediction?.longTerm?.overall || '暂无长期影响数据';
      longTermContent.style.fontSize = '14px';
      longTermContent.style.lineHeight = '1.5';
      longTermContent.style.color = '#666';
      longTerm.appendChild(longTermContent);
      
      // 长期应对策略
      const longTermStrategy = document.createElement('div');
      longTermStrategy.style.marginTop = '10px';
      longTermStrategy.style.padding = '10px';
      longTermStrategy.style.backgroundColor = '#f0f7ff';
      longTermStrategy.style.borderLeft = '3px solid #3B82F6';
      longTermStrategy.style.borderRadius = '4px';
      
      const longTermStrategyTitle = document.createElement('h4');
      longTermStrategyTitle.textContent = '长期应对策略措施：';
      longTermStrategyTitle.style.fontSize = '13px';
      longTermStrategyTitle.style.color = '#1E40AF';
      longTermStrategyTitle.style.marginBottom = '5px';
      longTermStrategy.appendChild(longTermStrategyTitle);
      
const longTermStrategyContent = document.createElement('p');
longTermStrategyContent.textContent = reportData?.impact?.respStrategy?.longTerm?.overall || '暂无长期应对策略数据';
      longTermStrategyContent.style.fontSize = '13px';
      longTermStrategyContent.style.lineHeight = '1.5';
      longTermStrategyContent.style.color = '#334155';
      longTermStrategy.appendChild(longTermStrategyContent);
      longTerm.appendChild(longTermStrategy);
      
      predictionSection.appendChild(longTerm);
      pdfContent.appendChild(predictionSection);
      
      // 添加页脚
      const footer = document.createElement('footer');
      footer.style.textAlign = 'center';
      footer.style.marginTop = '50px';
      footer.style.paddingTop = '10px';
      footer.style.borderTop = '1px solid #ddd';
      footer.style.fontSize = '12px';
      footer.style.color = '#999';
      
      const footerText = document.createElement('p');
      footerText.textContent = `${systemSettings.systemName} © 2025 ${systemSettings.systemVersion}`;
      footer.appendChild(footerText);
      pdfContent.appendChild(footer);
      
      // 添加到文档中
      document.body.appendChild(pdfContent);
      
      // 计算内容实际高度，确保捕获完整
      const contentHeight = pdfContent.scrollHeight;
      
      // 使用html2canvas捕获完整内容并生成PDF
      const canvas = await html2canvas(pdfContent, {
        scale: 2, // 提高清晰度
        useCORS: true, // 允许加载跨域图片
        logging: false,
        scrollY: 0,
        scrollX: 0,
        windowHeight: contentHeight // 设置为内容实际高度，确保捕获完整内容
      });
      
      // 创建PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // 计算图片在PDF中的尺寸
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 检查内容是否超过一页
      const pageHeight = 297; // A4高度
      const totalPages = Math.ceil(imgHeight / pageHeight);
      
      // 如果内容只需要一页，则直接添加
      if (totalPages === 1) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // 如果内容需要多页，实现分页处理
        for (let i = 0; i < totalPages; i++) {
          // 创建新页面(第一页除外)
          if (i > 0) {
            pdf.addPage();
          }
          
          // 计算当前页应该显示的部分
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(canvas.height - (i * (canvas.height / totalPages)), canvas.height / totalPages);
          
          const pageContext = pageCanvas.getContext('2d');
          if (pageContext) {
            // 绘制当前页的内容
            pageContext.drawImage(
              canvas,
              0,
              i * (canvas.height / totalPages),
              canvas.width,
              canvas.height / totalPages,
              0,
              0,
              pageCanvas.width,
              pageCanvas.height
            );
          }
          
          // 添加当前页到PDF
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, pageHeight);
        }
      }
      
      // 保存PDF
      pdf.save(`intelligence_report_${searchKeyword}_${new Date().toISOString().slice(0,10)}.pdf`);
      
      // 移除临时容器
      document.body.removeChild(pdfContent);
      
      toast.success('PDF报告导出成功');
    } catch (error) {
      console.error('导出PDF报告失败:', error);
      toast.error('导出PDF报告失败，请重试');
      // 确保清理临时元素
      const tempElement = document.querySelector('div[style*="top: -9999px"]');
      if (tempElement) {
        document.body.removeChild(tempElement);
      }
    } finally {
      setIsAggregating(false);
    }
  };

  return (
      <div className="min-h-screen bg-gray-900 text-white font-sans">
        {/* 主内容区域 */}
        <main className="p-6">
          {/* 左侧筛选面板和右侧分析结果的布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左侧筛选面板 - 占用1列 */}
            <div className="lg:col-span-1">
              {/* 搜索和筛选 */}
              {/* <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="text-base font-medium mb-4">情报搜索</h3> */}

                {/* 搜索框 */}
                {/* <div className="relative mb-4">
                  <input
                      type="text"
                      placeholder="输入关键词搜索情报..."
                      className="w-full py-2 px-4 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                  /><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                </div> */}

                {/* 搜索按钮 */}
                {/* <button
                    className={`w-full py-2 rounded-md transition-colors ${
                        isAggregating
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    onClick={handleSearch}
                    disabled={isAggregating}
                >
                  {isAggregating ? (
                      <>
                        <RefreshCw size={16} className="inline mr-2 animate-spin" /> 搜索中...
                      </>
                  ) : (
                      <>
                        搜索
                      </>
                  )}
                </button> */}
              {/* </div> */}

              {/* 待分析事件列表 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-base font-medium mb-4">搜索结果</h3>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {filteredEvents.length > 0 ? (
                      filteredEvents.map((event) => (
                          <div key={event.id} className="p-3 bg-gray-750 rounded-md hover:bg-gray-700 transition-colors cursor-pointer">
                            <div className="flex items-start">
                              <h4 className="text-sm font-medium text-white mb-1 flex-grow">{event.name}</h4>
                              <span className={`px-2 py-0.5 ${event.levelColor} text-white text-xs rounded-full whitespace-nowrap`}>
                       {event.level}
                     </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-2 line-clamp-2">{event.description}</p>
                            <div className="flex justify-between items-center text-xs mt-1">
                              <span className="text-gray-400">{event.time}</span>
                              <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 text-[10px] rounded-full">
                       {event.query}
                     </span>
                            </div>
                          </div>
                      ))
                  ) : (
                      <div className="p-6 text-center text-gray-400">
                        <div className="text-4xl mb-2">🔍</div>
                        <p>{needSearchFirst ? '请先至“情报筛选”界面搜索情报' : '请输入关键词进行搜索'}</p>
                      </div>
                  )}
                </div>

              {/* 搜索结果提示 */}
              {isFilterApplied && (
                <div className="mt-3 p-2 bg-blue-600/20 text-blue-400 text-xs rounded-md text-center">
                  已匹配关键词 "{filteredEvents.length > 0 ? filteredEvents[0].query : searchKeyword}"，显示 {filteredEvents.length} 条结果
                </div>
              )}

                {/* 重新聚合按钮 */}
                {filteredEvents.length > 0 && (
                    <button
                        className={`w-full mt-4 py-2 rounded-md flex items-center justify-center transition-colors ${
                            isAggregating
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        onClick={reaggregateData}
                        disabled={isAggregating}
                    >
                      {isAggregating ? (
                          <>
                            <RefreshCw size={16} className="mr-2 animate-spin" /> 正在生成报告...
                          </>
                      ) : (
                          <>
                            <RefreshCw size={16} className="mr-2" /> 重新聚合生成报告
                          </>
                      )}
                    </button>
                )}
              </div>
            </div>

            {/* 右侧分析结果 - 占用3列 */}
            <div className="lg:col-span-3">
              {/* 数据概览卡片（与情报筛选页一致） */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-center">
                <div className="relative group bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                  <div className="text-3xl font-bold text-blue-400 truncate">{overviewMetrics.queryTag}</div>
                  <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-[28rem] -translate-x-1/2 rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-xs text-gray-200 shadow-xl group-hover:block">
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

              {!showReport ? (
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    {needSearchFirst ? (
                      <>
                        <div className="text-6xl mb-4">⚠️</div>
                        <h3 className="text-xl font-medium text-gray-300 mb-2">请先至“情报筛选”界面搜索情报</h3>
                        <p className="text-gray-400 mb-6">从情报聚合页面点击“查看分析报告”也可进入本页面。</p>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-xl font-medium text-gray-300 mb-2">情报分析报告</h3>
                        <p className="text-gray-400 mb-6">
                          搜索相关关键词后，点击"重新聚合生成报告"按钮，系统将为您生成完整的分析报告
                        </p>
                      </>
                    )}
                    {searchKeyword && !needSearchFirst && (
                      <div className="flex items-center justify-center gap-3">
                        <button
                          className={`px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center ${
                            isAggregating
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white'
                          }`}
                          onClick={reaggregateData}
                          disabled={isAggregating}
                        >
                          {isAggregating ? (
                            <>
                              <RefreshCw size={16} className="mr-2 animate-spin" /> 正在生成...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} className="mr-2" /> 生成报告
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
              ) : (
                  <div>
                 {/* 事件概览 */}
                 <div className="bg-gray-800 rounded-lg p-4 mb-6">
                   <div className="flex justify-between items-center mb-4">
                     <div className='max-w-[50%]'>
                        <h3 className="text-base font-medium">{eventKeyword} 事件概览</h3>
                     </div>
                     <div className="flex space-x-2">
                       <button className={`px-3 py-1 rounded flex items-center transition-colors ${
                         isAggregating
                           ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                       }`}
                       onClick={exportReport}
                       disabled={isAggregating}
                       >
                         <Download size={14} className="mr-1" /> 导出JSON报告
                       </button>
                       <button className={`px-3 py-1 rounded flex items-center transition-colors ${
                         isAggregating 
                           ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                           : 'bg-blue-600 text-white hover:bg-blue-700'
                       }`} 
                       onClick={exportReportToPDF}
                       disabled={isAggregating}
                       >
                         <Download size={14} className="mr-1" /> 导出PDF报告
                       </button>
                       <button className={`px-3 py-1 rounded flex items-center transition-colors ${
                         isAggregating 
                           ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                       }`} 
                       onClick={reaggregateData}
                       disabled={isAggregating}
                       >
                         <RefreshCw size={14} className="mr-1" /> 刷新数据
                       </button>
                       <button className="text-gray-400 hover:text-white text-sm flex items-center" onClick={() => setShowSummaryComparison(true)}>
                         摘要对比
                         <ChevronRight size={14} className="ml-1" />
                       </button>
                     </div>
                   </div>
                  
                  <div className="bg-gray-750 rounded-md p-4 mb-4">
                    <p className="text-sm text-gray-300">
                      {reportData.impact.coreConclusion}
                    </p>
                  </div>

                      {/* 概览指标 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {eventOverviewMetrics.map((metric, index) => (
                            <div key={index} className="bg-gray-750 p-3 rounded-md">
                              <div className="text-xl font-bold text-white">{metric.value}{metric.unit}</div>
                              <div className="text-xs text-gray-400">{metric.name}</div>
                            </div>
                        ))}
                      </div>
                    </div>
 
                {/* 要素分析 */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-base font-medium">要素分析</h3>
                     <button 
                       className="text-gray-400 hover:text-white text-sm flex items-center"
                       onClick={() => setShowElementDetailModal(true)}
                     >
                       扩大查看
                       <ChevronRight size={14} className="ml-1" />
                     </button>
                   </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.entries(elementAnalysisData) as Array<[string, string]>).map(([key, value], index) => {
                      // 为每个要素选择合适的图标
                      let Icon = CalendarDays; // 默认图标
                      
                      if (key === "时间范围") Icon = CalendarDays;
                      else if (key === "事件跨度") Icon = Clock;
                      else if (key === "主要区域") Icon = MapPin;
                      else if (key === "重点关注") Icon = Target;
                      else if (key === "涉及国家") Icon = Flag;
                      else if (key === "高频词汇") Icon = Users;
                      
                      return (
                        <div key={index} className="bg-gray-750 p-4 rounded-lg border border-gray-700 transition-all duration-300 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/10 hover:-translate-y-0.5">
                          <div className="flex items-center mb-2">
                            <Icon className="text-blue-500 mr-2" size={16} />
                            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">{key}</div>
                          </div>
                          <div className="text-sm font-bold text-white pl-6">{value}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* 发展脉络 */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-base font-medium">发展脉络</h3>
                     <button 
                       className="text-gray-400 hover:text-white text-sm flex items-center"
                       onClick={() => setShowVerticalTimelineModal(true)}
                     >
                       切换视角
                       <ChevronRight size={14} className="ml-1" />
                     </button>
                   </div>
                  
                  {/* 水平时间轴容器 */}
                  <div className="overflow-x-auto pt-6 pb-6">
                    <div className="min-w-max">
                      {/* 时间轴和连接线 */}
                      <div className="relative">
                        {/* 主轴线 - 将时间轴线移到事件上方 */}
                        <div className="absolute top-10 left-0 right-0 h-0.5 bg-gray-700"></div>
                        
                        {/* 时间轴节点 */}
                        <div className="flex space-x-8">
                          {timelineArray.map((item, index) => {
                            // 根据事件类型选择不同图标
                            let EventIcon = <FileText size={18} className="text-white" />;
                            
                            // 根据是否为热点事件选择不同颜色
                            let dotColor = item.isHot ? 'bg-red-600' : 'bg-blue-600';
                            
                             return (
                              <div key={index} className="flex flex-col items-center relative">
                                {/* 时间点 - 调整到时间轴线的位置 */}
                                <div className="absolute top-10 w-4 h-4 rounded-full flex items-center justify-center bg-gray-800 border-2 border-blue-600 transform -translate-y-1/2 z-10">
                                  <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                                </div>
                                {/* 显示日期标签在时间点上方 */}
                                <div className="absolute top-2 whitespace-nowrap text-xs font-medium text-gray-400 bg-gray-800 px-2 py-1 rounded z-20">
                                  {item.time || '未知日期'}
                                </div>
                                
                                {/* 内容卡片 */}
                                <div className="mt-16 mb-2 bg-gray-750 p-4 rounded-md border border-gray-700 w-64 relative">
                                  {/* 日期和图标 */}
                                  <div className="flex items-center mb-2 text-xs text-gray-400">
                                    <Calendar size={14} className="mr-1" />
                                    {item.time || '未知日期'}
                                  </div>
                                  
                                  {/* 事件标题和图标 */}
                                  <div className="flex items-start mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center mr-2">
                                      {EventIcon}
                                    </div>
                                    <h4 className="text-sm font-bold text-white flex-grow">{(item.event || '').substring(0, 40)}...</h4>
                                  </div>
                                  
                                  {/* 事件详细内容 */}
                                  <p className="text-xs text-gray-400 mb-2">
                                    {item.event || '暂无详细信息'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                    {/* 预测与应对措施 */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-medium">预测与应对措施</h3>
                        {/* <button className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded flex items-center hover:bg-gray-600 transition-colors">
                          重新预测
                        </button> */}
                      </div>

                      {/* 左右并排布局容器 */}
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* 预测分析卡片 - 占据左侧 */}
                        <div className="flex-1 bg-gray-750 p-4 rounded-lg border border-gray-700">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-3">
                              <BarChart3 className="text-blue-500" size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-white">影响预测分析</h4>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {/* 短期影响 */}
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-600/50 transition-all duration-300">
                              <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center mr-2">
                                  <ArrowUp size={16} className="text-green-500" /></div>
                                <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">{reportData.impact.impactPrediction.shortTerm.timeFrame}</div>
                              </div>
                              <div className="text-sm text-gray-300">
                                {reportData.impact.impactPrediction.shortTerm.overall}
                              </div>
                            </div>

                            {/* 中期影响 */}
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-600/50 transition-all duration-300"><div className="flex items-center mb-2">
                              <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center mr-2">
                                <ArrowUp size={16} className="text-amber-500" />
                              </div>
                              <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">{reportData.impact.impactPrediction.mediumTerm.timeFrame}</div>
                            </div>
                              <div className="text-sm text-gray-300">
                                {reportData.impact.impactPrediction.mediumTerm.overall}
                              </div>
                            </div>

                            {/* 长期影响 */}
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-600/50 transition-all duration-300">
                              <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center mr-2">
                                  <ArrowUp size={16} className="text-red-500" />
                                </div>
                                <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">{reportData.impact.impactPrediction.longTerm.timeFrame}</div>
                              </div>
                              <div className="text-sm text-gray-300">
                                {reportData.impact.impactPrediction.longTerm.overall}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 应对措施卡片 - 占据右侧 */}
                        <div className="flex-1 bg-gray-750 p-4 rounded-lg border border-gray-700">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center mr-3">
                              <AlertCircle className="text-green-500" size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-white">应对策略措施</h4>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {/* 短期应对 */}
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-600/50 transition-all duration-300">
                              <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center mr-2">
                                  <Shield size={16} className="text-red-500" />
                                </div>
                                <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">{reportData.impact.respStrategy.shortTerm.goal}</div>
                              </div>
                              <div className="text-sm text-gray-300">{reportData.impact.respStrategy.shortTerm.overall}</div>
                            </div>

                            {/* 中期应对 */}
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-600/50 transition-all duration-300">
                              <div className="flex items-center mb-2">
                                <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center mr-2">
                                  <Target size={16} className="text-amber-500" />
                                </div>
                                <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">{reportData.impact.respStrategy.mediumTerm.goal}</div>
                              </div>
                              <div className="text-sm text-gray-300">{reportData.impact.respStrategy.mediumTerm.overall}</div>
                            </div>

                            {/* 长期应对 */}
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-600/50 transition-all duration-300">
                              <div className="flex items-center mb-2"><div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center mr-2">
                                <Users size={16} className="text-green-500" />
                              </div>
                                <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">{reportData.impact.respStrategy.longTerm.goal}</div>
                              </div>
                              <div className="text-sm text-gray-300">{reportData.impact.respStrategy.longTerm.overall}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 报告质量评估 */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-base font-medium mb-4">报告质量评估</h3>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-750 p-3 rounded-md text-center">
                          <div className="text-xs text-gray-400 mb-2">完整性评估</div>
                          <div className="text-yellow-400 mb-1">★★★★★</div>
                          <div className="text-xs text-gray-400">评分: 9.0/10</div>
                        </div>

                        <div className="bg-gray-750 p-3 rounded-md text-center">
                          <div className="text-xs text-gray-400 mb-2">准确性评估</div>
                          <div className="text-yellow-400 mb-1">★★★★★</div>
                          <div className="text-xs text-gray-400">评分: 9.0/10</div>
                        </div>

                        <div className="bg-gray-750 p-3 rounded-md text-center">
                          <div className="text-xs text-gray-400 mb-2">可靠性评估</div>
                          <div className="text-yellow-400 mb-1">★★★★★</div>
                          <div className="text-xs text-gray-400">评分: 9.0/10</div>
                        </div>
                      </div>

                      {/* 反馈意见 */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-400 mb-2">反馈意见</div>
                        <textarea
                            className="w-full p-3 bg-gray-750 border border-gray-600 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                            placeholder="请输入对本报告的反馈意见，如无反馈可跳过..."
                            rows={2}
                        ></textarea>
                      </div>

                      <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" onClick={() => {
                        // 提交评估
                        console.log('提交报告质量评估');
                        toast.success('报告质量评估已提交');
                      }}>
                        提交评估
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </main>


       {/* 摘要对比弹出框 */}
       {showSummaryComparison && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             transition={{ duration: 0.2 }}
             className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
           >
             {/* 弹出框头部 */}
             <div className="flex justify-between items-center p-4 border-b border-gray-700">
               <div className="flex items-center">
                 <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                 <h3 className="text-lg font-medium text-white">摘要对比分析</h3>
               </div>
               <button 
                 className="text-gray-400 hover:text-white transition-colors"
                 onClick={() => setShowSummaryComparison(false)}
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             
             {/* 弹出框内容 */}
             <div className="p-4">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* 黄金摘要 */}
                 <div className="bg-gray-750 p-4 rounded-lg border border-blue-600/30">
                   <div className="flex items-center mb-3">
                     <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center mr-2">
                       <Award size={16} className="text-blue-500" />
                     </div>
                     <h4 className="text-md font-medium text-blue-400">黄金摘要</h4>
                   </div>
                   <div className="text-sm text-gray-300 space-y-3">
                      {reportData.impact.referenceSummary}
                   </div>
                 </div>
                 
                 {/* 生成摘要 */}
                 <div className="bg-gray-750 p-4 rounded-lg border border-purple-600/30">
                   <div className="flex items-center mb-3">
                     <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center mr-2">
                       <FileText size={16} className="text-purple-500" />
                     </div>
                     <h4 className="text-md font-medium text-purple-400">生成摘要</h4>
                   </div>
                   <div className="text-sm text-gray-300 space-y-3">
                     {reportData.impact.coreConclusion}
                     <p className="pt-2 border-t border-gray-700 mt-2 text-gray-400 text-xs">
                       系统自动生成摘要基于全部相关情报，涵盖事件全貌、发展脉络和潜在影响。
                     </p>
                   </div>
                 </div>
               </div>
               
               {/* 对比说明 */}
               <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                 <div className="text-sm text-gray-300 mb-2 font-medium">对比说明</div>
                 <div className="text-xs text-gray-400">
                   <p>黄金摘要是人工精心提炼的核心关键信息，专注于最重要的时间节点和决策点。生成摘要是系统基于全部数据自动生成的全面概述，涵盖更广泛的信息范围。</p>
                 </div>
               </div>
               
               {/* 关闭按钮 */}
               <div className="mt-6 flex justify-end">
                 <button 
                   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                   onClick={() => setShowSummaryComparison(false)}
                 >
                   关闭
                 </button>
               </div>
             </div>
           </motion.div>
         </div>
       )}

        {/* 扩大查看弹出框 - 要素分析详情 */}
        {showElementDetailModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* 弹出框头部 */}
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <h3 className="text-lg font-medium text-white">要素分析详情</h3>
                </div>
                <button 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowElementDetailModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* 弹出框内容 */}
              <div className="p-6">
                {/* 时间范围详细分析 */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center mr-3">
                      <CalendarDays className="text-blue-500" size={20} />
                    </div>
                    <h4 className="text-lg font-bold text-white">时间范围分析</h4>
                  </div>
                  <div className="bg-gray-750 p-4 rounded-lg mb-3">
                    <div className="text-sm text-gray-300">
                      <p>事件起始日期：{elementAnalysisData["时间范围"]?.split(' - ')[0] || '2011-03-18'}</p>
                      <p className="mt-2">事件结束日期：{elementAnalysisData["时间范围"]?.split(' - ')[1] || '2011-08-28'}</p>
                      <p className="mt-2">事件跨度：{elementAnalysisData["事件跨度"]}</p>
                    </div>
                  </div>
                  <div className="bg-gray-750 p-4 rounded-lg">
                    <div className="text-sm text-gray-300">
                      <p>此事件从2011年3月持续到8月，横跨近6个月时间，期间经历了多个关键时间节点，从最初的抗议活动逐渐升级为更广泛的冲突。事件密度在4-5月和8月达到高峰，反映了局势的持续演变和国际社会的介入。</p>
                    </div>
                  </div>
                </div>
                
                {/* 地理区域详细分析 */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center mr-3">
                      <MapPin className="text-green-500" size={20} />
                    </div>
                    <h4 className="text-lg font-bold text-white">地理区域分析</h4>
                  </div>
                  <div className="bg-gray-750 p-4 rounded-lg mb-3">
                    <div className="text-sm text-gray-300">
                      <p>主要区域：{elementAnalysisData["主要区域"]}</p>
                      <p className="mt-2">重点关注地点：{elementAnalysisData["重点关注"]}</p>
                    </div>
                  </div>
                  <div className="bg-gray-750 p-4 rounded-lg">
                    <div className="text-sm text-gray-300">
                      <p>叙利亚是事件的核心区域，特别是首都大马士革和南部城市德拉是冲突的主要爆发点。随着局势发展，中东地区其他国家如沙特阿拉伯、土耳其等也深度介入。联合国安理会作为国际政治舞台的重要机构，成为各国博弈的关键场所。</p>
                    </div>
                  </div>
                </div>
                
                {/* 涉及国家和高频词汇分析 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 涉及国家 */}
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center mr-3">
                        <Flag className="text-purple-500" size={20} />
                      </div>
                      <h4 className="text-lg font-bold text-white">涉及国家</h4>
                    </div>
                    <div className="bg-gray-750 p-4 rounded-lg">
                      <div className="text-sm text-gray-300">
                        <p>{elementAnalysisData["涉及国家"]}</p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                            <p className="text-xs text-gray-400">叙利亚：冲突核心国家，局势持续动荡</p>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            <p className="text-xs text-gray-400">俄罗斯：在联合国安理会否决干预决议</p>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                            <p className="text-xs text-gray-400">法国/英国：推动联合国对叙利亚采取行动</p>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                            <p className="text-xs text-gray-400">沙特阿拉伯：召回大使并谴责暴力镇压</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 高频词汇 */}
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center mr-3">
                        <Users className="text-amber-500" size={20} />
                      </div>
                      <h4 className="text-lg font-bold text-white">高频词汇</h4>
                    </div>
                    <div className="bg-gray-750 p-4 rounded-lg">
                      <div className="text-sm text-gray-300">
                        <p>{elementAnalysisData["高频词汇"]}</p>
                        <div className="mt-3 space-y-2">
                          {String(elementAnalysisData["高频词汇"] || '')
                            .split('、')
                            .filter(Boolean)
                            .map((word, idx) => (
                              <div key={`kw-${idx}`} className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                                <p className="text-xs text-gray-400">高频词：{word}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* 切换视角弹出框 - 竖向时间线 */}
        {showVerticalTimelineModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* 弹出框头部 */}
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <h3 className="text-lg font-medium text-white">时间发展脉络（竖向视图）</h3>
                </div>
                <button 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowVerticalTimelineModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* 弹出框内容 - 竖向时间线 */}
              <div className="p-6">
                <div className="relative border-l-2 border-blue-600 pl-8 ml-4 space-y-12">
                  {timelineArray.map((item, index) => {
                    // 根据事件类型选择不同图标
                    let EventIcon = <FileText size={18} className="text-white" />;
                    
                    // 根据是否为热点事件选择不同颜色
                    let timelineColor = item.isHot ? 'border-red-500' : 'border-blue-600';
                    let dotColor = item.isHot ? 'bg-red-600' : 'bg-blue-600';
                    
                    return (
                      <div key={index} className="relative">
                        {/* 时间点 */}
                        <div className={`absolute -left-[42px] w-6 h-6 rounded-full flex items-center justify-center bg-gray-800 border-2 ${timelineColor} transform -translate-y-1/2 z-10`}>
                          <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>
                        </div>
                        
                        {/* 日期 */}
                        <div className="text-sm font-bold text-blue-400 mb-2">
                          {item.time || '未知日期'}
                          {item.isHot && (
                            <span className="ml-2 px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full">热点事件</span>
                          )}
                        </div>
                        
                        {/* 内容卡片 */}
                        <div className="bg-gray-750 p-4 rounded-md border border-gray-700 hover:border-blue-600/50 transition-all duration-300">
                          {/* 事件标题和图标 */}
                          <div className="flex items-start mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center mr-2 flex-shrink-0">
                              {EventIcon}
                            </div>
                            <h4 className="text-sm font-bold text-white flex-grow">
                              {(item.event || '').split('. ')[0] }
                            </h4>
                          </div>
                          
                          {/* 事件详细内容 */}
                          <p className="text-sm text-gray-300 mt-2">
                            {item.event || '暂无详细信息'}
                          </p>
                          
                          {/* 时间分析 */}
                          {index > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                              <p>距离上一事件：{calculateDaysBetweenDates(timelineArray[index-1].time, item.time)}天</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

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

// 计算两个日期之间的天数差异
const calculateDaysBetweenDates = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default ReportGenerationPage;