import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/authContext';
import { SystemSettingsContext } from '../contexts/systemSettingsContext';
import { Bell, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const { user } = useContext(AuthContext);
  const { systemSettings } = useContext(SystemSettingsContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  // 获取当前路径
  const currentPath = location.pathname;
  
  // 导航菜单项
  const navItems = [
    { path: '/', label: '首页' },
    { path: '/intelligence-filter', label: '资料检索' },
    // { path: '/intelligence-aggregation', label: '情报聚合' },
    // { path: '/report-generation', label: '报表生成' },
    { path: '/online-search', label: '结合分析' },
    // { path: '/data-analysis', label: '数据分析' },
    { path: '/system-settings', label: '系统设置', isAdminOnly: true },
  ];

  const getLastSearchedQuery = () => {
    const lastQuery = String(localStorage.getItem('lastQuery') || '').trim();
    const homeLastQuery = String(localStorage.getItem('homeLastQuery') || '').trim();
    return lastQuery || homeLastQuery;
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center">
        <div className="text-xl font-bold text-white mr-8">事件报告智能生成系统</div>
        <div className="text-sm text-gray-400 ml-2">{systemSettings.systemVersion}</div>
      </div>
      
      <nav className="flex items-center space-x-4">
        {navItems.map((item) => {
          // 如果是管理员专属项且用户不是管理员，则跳过
          if (item.isAdminOnly && user?.role !== 'admin') {
            return null;
          }

          const isAggregationItem = item.path === '/intelligence-aggregation';
          const isReportItem = item.path === '/report-generation';
          const isOnlineSearchItem = item.path === '/online-search';

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 transition-colors ${
                currentPath === item.path
                  ? 'text-white bg-blue-600 rounded-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={(e) => {
                if (isAggregationItem || isReportItem || isOnlineSearchItem) {
                  e.preventDefault();
                  const lastQuery = getLastSearchedQuery();
                  if (lastQuery) {
                    const targetPath = isAggregationItem
                      ? '/intelligence-aggregation'
                      : isReportItem
                        ? '/report-generation'
                        : '/online-search';
                    navigate(`${targetPath}?keyword=${encodeURIComponent(lastQuery)}`);
                  } else {
                    navigate(item.path);
                    toast.warning('请先搜索情报');
                  }
                  return;
                }
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="flex items-center space-x-4">
        <button className="text-gray-400 hover:text-white">
          <Bell size={20} />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-white">{user?.name || '用户'}</span>
          <button className="text-gray-400 hover:text-white" onClick={onLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;