import * as React from 'react';
import { useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from './contexts/authContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IntelligenceFilterPage from './pages/IntelligenceFilterPage';
import IntelligenceAggregationPage from './pages/IntelligenceAggregationPage';
import DataAnalysisPage from './pages/DataAnalysisPage';
import ReportGenerationPage from './pages/ReportGenerationPage';
import OnlineSearchPage from './pages/OnlineSearchPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import LoginPage from './pages/LoginPage';
import { Empty } from './components/Empty';

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // 处理登出
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 受保护的路由组件
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // 管理员路由组件
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (user?.role !== 'admin') {
      return <Empty />;
    }
    return children;
  };

  return (
      <div className="App min-h-screen flex flex-col">
        {/* 只有非登录页面才显示导航栏 */}
        {isAuthenticated && <Navbar onLogout={handleLogout} />}

        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />

            <Route path="/intelligence-filter" element={
              <ProtectedRoute>
                <IntelligenceFilterPage />
              </ProtectedRoute>
            } />

            <Route path="/intelligence-aggregation" element={
              <ProtectedRoute>
                <IntelligenceAggregationPage />
              </ProtectedRoute>
            } />

            <Route path="/data-analysis" element={
              <ProtectedRoute>
                <DataAnalysisPage />
              </ProtectedRoute>
            } />

            <Route path="/report-generation" element={
              <ProtectedRoute>
                <ReportGenerationPage />
              </ProtectedRoute>
            } />

            <Route path="/online-search" element={
              <ProtectedRoute>
                <OnlineSearchPage />
              </ProtectedRoute>
            } />

            <Route path="/system-settings" element={
              <AdminRoute>
                <SystemSettingsPage />
              </AdminRoute>
            } />

            {/* 其他路由 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
  );
};

export default App;