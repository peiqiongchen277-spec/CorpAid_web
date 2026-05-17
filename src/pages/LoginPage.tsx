import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { useContext } from 'react';
import { SystemSettingsContext } from '@/contexts/systemSettingsContext';
import { toast } from 'sonner';
import { Lock, User, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin, register } = useContext(AuthContext);
  const { systemSettings } = useContext(SystemSettingsContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // 登录逻辑
        const success = await authLogin(username, password);
        if (success) {
          toast.success('登录成功');
          navigate('/');
        } else {
          toast.error('用户名或密码错误');
        }
      } else {
        // 注册逻辑
        const success = await register(username, password, email, phone);
        if (success) {
          toast.success('注册成功，请登录');
          setIsLogin(true);
        } else {
          toast.error('用户名或密码为空');
        }
      }
    } catch (error) {
      toast.error('操作失败，请重试');
      console.error('Login/Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700"
        >
          {/* 顶部装饰条 */}
          <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

          {/* 表单容器 */}
          <div className="p-6 md:p-8">
            {/* 标题和切换按钮 */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {isLogin ? '欢迎回来' : '创建新账户'}
              </h1>
              <p className="text-gray-400">
                {isLogin ? '请输入您的账户信息' : '加入我们的智能分析平台'}
              </p>
            </div>

            {/* 登录/注册表单 */}
            <form onSubmit={handleSubmit}>
              {/* 用户名 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">用户名</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="请输入用户名"
                      required
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">密码</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="请输入密码"
                      required
                  />
                </div>
              </div>

              {/* 注册时显示的额外字段 */}
              {!isLogin && (
                  <>
                    {/* 邮箱 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">邮箱</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            placeholder="请输入邮箱"
                            required
                        />
                      </div>
                    </div>

                    {/* 手机号 */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-1">手机号</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            placeholder="请输入手机号"
                            required
                        />
                      </div>
                    </div>
                  </>
              )}

              {/* 提交按钮 */}
              <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
              >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : null}
                {isLogin ? '登录' : '注册'}
              </button>
            </form>

            {/* 切换登录/注册 */}
            <div className="mt-6 text-center">
              <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
              >
                {isLogin ? '还没有账户？立即注册' : '已有账户？返回登录'}
              </button>
            </div>

            {/* 系统说明 */}
            <div className="mt-8 text-center text-xs text-gray-500">
              <p>{systemSettings.systemName} © 2025</p>
              <p className="mt-1">{systemSettings.systemVersion}</p>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default LoginPage;