import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, BarChart3, FileText, ExternalLink, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SystemSettingsContext } from '@/contexts/systemSettingsContext';
import { findPassageByQuery, findQueryInPassage } from '@/lib/api/passage';

interface HomeMetrics {
  lastQuery: string;
  intelligenceTotal: number;
  relatedEventTotal: number;
  highValueIntelligenceTotal: number;
}

const HOME_LAST_QUERY_KEY = 'homeLastQuery';

const Home: React.FC = () => {
  const { systemSettings } = useContext(SystemSettingsContext);
  const [homeSearchKeyword, setHomeSearchKeyword] = useState('');
  const [metrics, setMetrics] = useState<HomeMetrics>({
    lastQuery: '-',
    intelligenceTotal: 0,
    relatedEventTotal: 0,
    highValueIntelligenceTotal: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadMetrics = async () => {
      const searchKeyword = localStorage.getItem(HOME_LAST_QUERY_KEY)?.trim() || '';

      const storedLastQuery = await findQueryInPassage(searchKeyword).then(res => {
        if (res?.data) {
          return String(res.data);
        }
      });

      if (!storedLastQuery) {
        setMetrics({
          lastQuery: '-',
          intelligenceTotal: 0,
          relatedEventTotal: 0,
          highValueIntelligenceTotal: 0
        });
        return;
      }

      try {
        const response = await findPassageByQuery(storedLastQuery);
        const list = Array.isArray(response?.data) ? response.data : [];

        const intelligenceTotal = list.length;
        const relatedEventTotal = list.reduce((sum: number, item: any) => {
          const eventCount = Array.isArray(item?.events) ? item.events.length : 0;
          return sum + eventCount;
        }, 0);

        const highValueIntelligenceTotal = list.filter((item: any) => {
          const levelText = String(item?.level ?? '').toLowerCase();
          const valueText = String(item?.value ?? '').trim();
          return levelText.includes('高价值') || levelText.includes('high') || valueText === '2';
        }).length;

        setMetrics({
          lastQuery: storedLastQuery,
          intelligenceTotal,
          relatedEventTotal,
          highValueIntelligenceTotal
        });
      } catch (error) {
        console.error('加载首页指标失败:', error);
      }
    };

    loadMetrics();
  }, []);

  const handleStartSearch = () => {
    const keyword = homeSearchKeyword.trim();
    if (!keyword) {
      return;
    }

    localStorage.setItem(HOME_LAST_QUERY_KEY, keyword);
    setMetrics((prev) => ({
      ...prev,
      lastQuery: keyword
    }));

    navigate(`/intelligence-filter?keyword=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans dark:bg-gray-900 dark:text-white light:bg-gray-100 light:text-gray-900">
      {/* 主内容区域 */}
      <main className="p-6">
        {/* 欢迎区域 */}
        <motion.div 
          className="mb-12 text-center pt-10 pb-6 bg-gradient-to-b from-blue-900/30 to-transparent rounded-2xl mb-12 dark:from-blue-900/30 light:from-blue-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {systemSettings.systemName}
          </motion.h1>
          <motion.p 
            className="text-gray-300 max-w-2xl mx-auto text-lg dark:text-gray-300 light:text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            基于人工智能的事件情报分析系统，提供深度事件挖掘与预测能力
          </motion.p>
          
          {/* 数据概览卡片 */}
          <motion.div 
            className="grid grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="relative group bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300 dark:bg-gray-800/80 dark:border-gray-700 light:bg-white/80 light:border-gray-200">
              <div className="text-3xl font-bold text-blue-400 truncate">{metrics.lastQuery}</div>
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-[28rem] -translate-x-1/2 rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-xs text-gray-200 shadow-xl group-hover:block">
                {metrics.lastQuery || '-'}
              </div>
              <div className="text-gray-400 text-sm dark:text-gray-400 light:text-gray-600">上次查询的query</div>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300 dark:bg-gray-800/80 dark:border-gray-700 light:bg-white/80 light:border-gray-200">
              <div className="text-3xl font-bold text-green-400">{metrics.intelligenceTotal}</div>
              <div className="text-gray-400 text-sm dark:text-gray-400 light:text-gray-600">情报总数</div>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300 dark:bg-gray-800/80 dark:border-gray-700 light:bg-white/80 light:border-gray-200">
              <div className="text-3xl font-bold text-amber-400">{metrics.relatedEventTotal}</div>
              <div className="text-gray-400 text-sm dark:text-gray-400 light:text-gray-600">相关事件总数</div>
            </div>
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg transform hover:-translate-y-1 transition-all duration-300 dark:bg-gray-800/80 dark:border-gray-700 light:bg-white/80 light:border-gray-200">
              <div className="text-3xl font-bold text-purple-400">{metrics.highValueIntelligenceTotal}</div>
              <div className="text-gray-400 text-sm dark:text-gray-400 light:text-gray-600">高价值情报数</div>
            </div>
          </motion.div>
        </motion.div>

        {/* 大搜索框 */}
        <motion.div
          className="mb-10 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="relative">
            <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="输入关键词检索事件、情报或报告..."
              value={homeSearchKeyword}
              onChange={(e) => setHomeSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStartSearch();
                }
              }}
              className="w-full h-16 pl-14 pr-36 text-lg bg-gray-800/90 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors" onClick={handleStartSearch}>
              开始检索
            </button>
          </div>
        </motion.div>

        

        {/* 核心功能模块 */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <motion.div 
            className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-blue-500/50 transition-all duration-300 group cursor-pointer overflow-hidden relative dark:bg-gray-800 dark:border-gray-700 light:bg-white light:border-gray-200"
            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full -mr-12 -mt-12 group-hover:bg-blue-600/20 transition-colors duration-300"></div>
            <Link to="/intelligence-aggregation" >
              <div className="w-14 h-14 bg-blue-600/20 rounded-lg flex items-center justify-center mb-5 group-hover:bg-blue-600/30 transition-colors duration-300 relative z-10">
                <ExternalLink size={28} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10 dark:text-white light:text-gray-900">海量事件情报筛选与聚合</h3>
              <p className="text-gray-400 mb-5 relative z-10 dark:text-gray-400 light:text-gray-600">
                基于AI的多源异构数据集成，实现全球热点事件智能筛选与聚合分析，提供全方位的情报概览。
              </p>
              <div className="flex items-center text-blue-500 text-sm">
                <span>实时运行中</span>
                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </Link>
          </motion.div>
          
          <motion.div 
            className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-green-500/50 transition-all duration-300 group cursor-pointer overflow-hidden relative dark:bg-gray-800 dark:border-gray-700 light:bg-white light:border-gray-200"
            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-600/10 rounded-full -mr-12 -mt-12 group-hover:bg-green-600/20 transition-colors duration-300"></div>
            <Link to="/data-analysis">
              <div className="w-14 h-14 bg-green-600/20 rounded-lg flex items-center justify-center mb-5 group-hover:bg-green-600/30 transition-colors duration-300 relative z-10">
                <BarChart3 size={28} className="text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10 dark:text-white light:text-gray-900">数据分析与可视化</h3>
              <p className="text-gray-400 mb-5 relative z-10 dark:text-gray-400 light:text-gray-600">
                提供多维度数据统计、趋势分析图表和可视化展示，助力决策支持和风险评估。
              </p>
              <div className="flex items-center text-green-500 text-sm">
                <span>实时运行中</span>
                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </Link>
          </motion.div>
          
          <motion.div 
            className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-purple-500/50 transition-all duration-300 group cursor-pointer overflow-hidden relative dark:bg-gray-800 dark:border-gray-700 light:bg-white light:border-gray-200"
            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full -mr-12 -mt-12 group-hover:bg-purple-600/20 transition-colors duration-300"></div>
            <Link to="/report-generation">  
              <div className="w-14 h-14 bg-purple-600/20 rounded-lg flex items-center justify-center mb-5 group-hover:bg-purple-600/30 transition-colors duration-300 relative z-10">
                <FileText size={28} className="text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 relative z-10 dark:text-white light:text-gray-900">可视化报表生成</h3>
              <p className="text-gray-400 mb-5 relative z-10 dark:text-gray-400 light:text-gray-600">
                智能生成多维度事件分析报告，支持交互式数据探索与决策支持，一键导出专业可视化分析结果。
              </p>
              <div className="flex items-center text-purple-500 text-sm">
                <span>实时运行中</span>
                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* 快速访问区域 */}
        {/* <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center dark:text-white light:text-gray-900">
            <BarChart3 size={24} className="mr-2 text-blue-500" />
            情报检索服务选项
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div 
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/intelligence-filter" className="block bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 group h-full dark:bg-gray-800 dark:border-gray-700 light:bg-white light:border-gray-200">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors duration-300">
                  <ExternalLink size={28} className="text-blue-500" />
                </div>
                <h3 className="text-white font-medium text-lg mb-2 dark:text-white light:text-gray-900">公开情报源</h3>
                <p className="text-gray-400 text-sm dark:text-gray-400 light:text-gray-600">
                  新闻、社交媒体、公开数据库等多源数据集成
                </p>
              </Link>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-green-500 transition-all duration-300 group cursor-pointer h-full dark:bg-gray-800 dark:border-gray-700 light:bg-white light:border-gray-200">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600/30 transition-colors duration-300">
                  <FileText size={28} className="text-green-500" />
                </div>
                <h3 className="text-white font-medium text-lg mb-2 dark:text-white light:text-gray-900">内部数据库</h3>
                <p className="text-gray-400 text-sm dark:text-gray-400 light:text-gray-600">
                  历史数据、分析报告、行动记录等结构化信息
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-amber-500 transition-all duration-300 group cursor-pointer h-full dark:bg-gray-800 dark:border-gray-700 light:bg-white light:border-gray-200">
                <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-600/30 transition-colors duration-300">
                  <BarChart3 size={28} className="text-amber-500" />
                </div>
                <h3 className="text-white font-medium text-lg mb-2 dark:text-white light:text-gray-900">数据分析结果</h3>
                <p className="text-gray-400 text-sm dark:text-gray-400 light:text-gray-600">
                  趋势分析、预测报告、统计摘要等分析成果
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300 group cursor-pointer h-full dark:bg-gray-800 dark:border-gray-700 light:bg-white light:border-gray-200">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors duration-300">
                  <FileText size={28} className="text-purple-500" />
                </div>
                <h3 className="text-white font-medium text-lg mb-2 dark:text-white light:text-gray-900">生成报告库</h3>
                <p className="text-gray-400 text-sm dark:text-gray-400 light:text-gray-600">
                  系统自动生成的所有报告存档，方便查阅回顾
                </p>
              </div>
            </motion.div>
          </div>
        </div> */}
        
        {/* 推荐功能区域 */}
        {/* <motion.div 
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-12 shadow-xl dark:bg-gray-800 dark:border-gray-700 light:bg-white light:border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <h2 className="text-2xl font-semibold mb-6 flex items-center dark:text-white light:text-gray-900">
            <BarChart3 size={24} className="mr-2 text-blue-500" />
            推荐功能模块
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              className="bg-gray-750 p-5 rounded-xl hover:bg-gray-700 transition-colors duration-300 cursor-pointer shadow-md dark:bg-gray-750 light:bg-gray-50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-white text-lg dark:text-white light:text-gray-900">实时预警事件分析</h3>
                <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">热门</span>
              </div>
            <p className="text-gray-400 text-sm mb-4 dark:text-gray-400 light:text-gray-600">
              提供实时预警事件监控与分析功能，帮助您及时了解最新事件动态与风险评估。
            </p>
            <Link to="/intelligence-aggregation" className="text-blue-500 text-sm flex items-center hover:text-blue-400 transition-colors duration-300">
              查看详情
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            </motion.div>
            
            <motion.div 
              className="bg-gray-750 p-5 rounded-xl hover:bg-gray-700 transition-colors duration-300 cursor-pointer shadow-md dark:bg-gray-750 light:bg-gray-50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium text-white text-lg dark:text-white light:text-gray-900">多维度事件关联分析</h3>
                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">推荐</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 dark:text-gray-400 light:text-gray-600">
                基于AI的事件关联分析功能，自动发现不同事件间的潜在联系，提供全面的事件图景。
              </p>
              <Link to="/intelligence-aggregation" className="text-green-500 text-sm flex items-center hover:text-green-400 transition-colors duration-300">
                查看详情
                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          </div>
        </motion.div> */}
      </main>
      
      {/* 页脚 */}
      <footer className="px-6 py-6 border-t border-gray-800 text-gray-500 text-sm mt-auto dark:border-gray-800 dark:text-gray-500 light:border-gray-200 light:text-gray-500">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">© 2026 {systemSettings.systemName} - {systemSettings.systemVersion}</div>
          <div className="flex flex-wrap justify-center space-x-6">
            <a href="#" className="hover:text-gray-300 transition-colors duration-300 dark:hover:text-gray-300 light:hover:text-gray-700">使用帮助</a>
            <a href="#" className="hover:text-gray-300 transition-colors duration-300 dark:hover:text-gray-300 light:hover:text-gray-700">隐私政策</a>
            <a href="#" className="hover:text-gray-300 transition-colors duration-300 dark:hover:text-gray-300 light:hover:text-gray-700">服务条款</a>
            <a href="#" className="hover:text-gray-300 transition-colors duration-300 dark:hover:text-gray-300 light:hover:text-gray-700">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;