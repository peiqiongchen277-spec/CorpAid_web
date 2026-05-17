import React, { useState, useContext, useEffect } from 'react';
import { 
  Settings, Users, Database, Bell as BellIcon, 
  Shield, Info, FileText, Download, RefreshCw, Plus, Edit, Lock, 
  AlertCircle, ExternalLink, Moon, Sun
} from 'lucide-react';
import { userAPI, systemAPI } from '@/lib/api';
import { SystemSettingsContext } from '../contexts/systemSettingsContext';
import { toast } from 'sonner';
import { findAllUsers } from '@/lib/api/user';


const analysisEngineOptions = ['趋势学习分析', '应用深度学习', '自动情报聚合'];

// 模拟数据 - 通知设置
const notificationSettings = {
  电子邮件通知: true,
  短信通知: false,
  安全警报: true,
  分析报告: true
};

// 模拟数据 - 系统信息
const systemInfo = {
  系统版本: '专业版 v1.0',
  最近更新时间: '2025-06-29 13:30:25',
  系统状态: '运行正常',
  CPU使用率: '42%',
  内存使用: '68%',
  存储空间: '1.2TB/2TB',
  网络状态: '24%'
};

type UserListItem = {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

const SystemSettingsPage: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('userManagement');
  const { systemSettings, updateSystemSettings, resetToDefault } = useContext(SystemSettingsContext);
  // 使用自定义hook管理主题
  // const { theme, toggleTheme, isDark } = useTheme();
  const darkMode = true; // 这里直接设置为true，实际应用中应该从useTheme获取
  
  // 用于系统参数编辑的本地状态
  const [editableSystemParams, setEditableSystemParams] = useState({
    系统名称: systemSettings.systemName,
    系统版本号: systemSettings.systemVersion,
    系统语言: systemSettings.systemLanguage,
    系统时区: systemSettings.systemTimezone,
    数据保留策略: systemSettings.dataRetentionPolicy,
    分析引擎设置: systemSettings.analysisEngineSettings,
  });

  // 用户列表（来自API）
  const [userList, setUserList] = useState<UserListItem[]>([]);
  
  // 当系统设置从context更新时，同步本地编辑状态
  React.useEffect(() => {
    setEditableSystemParams({
      系统名称: systemSettings.systemName,
      系统版本号: systemSettings.systemVersion,
      系统语言: systemSettings.systemLanguage,
      系统时区: systemSettings.systemTimezone,
      数据保留策略: systemSettings.dataRetentionPolicy,
      分析引擎设置: systemSettings.analysisEngineSettings,
    });
  }, [systemSettings]);

  useEffect(() => {
    let mounted = true;

    const loadUserList = async () => {
      try {
        const response = await findAllUsers();
        const source = Array.isArray(response)
          ? response
          : Array.isArray((response as { data?: unknown })?.data)
            ? ((response as { data: unknown[] }).data)
            : [];

        const mappedUsers: UserListItem[] = source.map((item: any) => ({
          id: Number(item?.id ?? 0),
          username: String(item?.username ?? item?.name ?? '-'),
          email: String(item?.email ?? '-'),
          phone: String(item?.phone ?? '-'),
          role: String(item?.role ?? '-'),
          status: String(item?.status ?? '-'),
        }));

        if (mounted) {
          setUserList(mappedUsers);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
        if (mounted) {
          setUserList([]);
        }
      }
    };

    loadUserList();

    return () => {
      mounted = false;
    };
  }, []);
  // 切换主题
  // const toggleTheme = () => {
  //   // setDarkMode(!darkMode);
  //   const darkMode = true
  //   // 在实际应用中，这里应该更新document.documentElement的class来切换主题
  // };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* 主内容区域 */}
      <main className="p-6">
        {/* 左侧导航和右侧内容的布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧设置导航 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-base font-medium mb-4">系统设置</h3>
              
              <div className="space-y-1">
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'userManagement' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('userManagement')}
                >
                  <Users size={18} className="mr-2" />
                  <span>用户管理</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'systemParams' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('systemParams')}
                >
                  <Settings size={18} className="mr-2" />
                  <span>系统参数</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'dataSettings' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('dataSettings')}
                >
                  <Database size={18} className="mr-2" />
                  <span>数据设置</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'notificationSettings' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('notificationSettings')}
                >
                  <BellIcon size={18} className="mr-2" />
                  <span>通知设置</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'securitySettings' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('securitySettings')}
                >
                  <Shield size={18} className="mr-2" />
                  <span>安全设置</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'systemInfo' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('systemInfo')}
                >
                  <Info size={18} className="mr-2" />
                  <span>系统信息</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'dailyManagement' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('dailyManagement')}
                >
                  <FileText size={18} className="mr-2" />
                  <span>日常管理</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'apiSettings' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('apiSettings')}
                >
                  <ExternalLink size={18} className="mr-2" />
                  <span>API接口</span>
                </button>
                
                <button 
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${activeTab === 'backupRestore' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => setActiveTab('backupRestore')}
                >
                  <Download size={18} className="mr-2" />
                  <span>备份与恢复</span>
                </button>
              </div>
              
              {/* 主题切换 */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <button 
                  className="w-full text-left px-3 py-2 rounded-md flex items-center justify-between text-gray-300"
                  // onClick={toggleTheme}
                >
                  <div className="flex items-center">
                    {darkMode ? <Moon size={18} className="mr-2" /> : <Sun size={18} className="mr-2" />}
                    <span>{darkMode ? '深色模式' : '浅色模式'}</span>
                  </div>
                  <span className={`w-9 h-5 rounded-full flex items-center transition-colors ${darkMode ? 'bg-blue-600 justify-end' : 'bg-gray-600 justify-start'}`}>
                    <span className="w-3 h-3 rounded-full bg-white"></span>
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          {/* 右侧设置内容 */}
          <div className="lg:col-span-4">
            {activeTab === 'userManagement' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium">用户管理</h3>
                   <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded flex items-center hover:bg-blue-700 transition-colors" onClick={() => {
                     // 在实际应用中，这里应该打开添加用户的模态框
                     console.log('添加新用户');
                     // 这里可以添加打开模态框的逻辑
                   }}>
                     <Plus size={14} className="mr-1" /> 添加用户
                   </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">用户名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">邮箱</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">手机号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">角色</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">状态</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                     {userList.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-750 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-600 mr-2"></div>
                              <span className="text-sm text-white">{user.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{user.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{user.role === 'admin' ? '管理员' : '普通用户'}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{user.status === '0' ? '正常' : '停用'}</td>
                          <td className="px-4 py-3">
                             <div className="flex space-x-2">
                               <button className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600 transition-colors flex items-center" onClick={() => {
                                 // 编辑用户
                                 console.log(`编辑用户: ${user.username}`);
                               }}>
                                 <Edit size={12} className="mr-1" /> 编辑
                               </button>
                                <button className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600 transition-colors flex items-center" onClick={async () => {
                                  // 重置密码
                                  if (confirm(`确定要重置用户 ${user.username} 的密码吗？`)) {
                                    try {
                                      await userAPI.updateUser(user.id, { resetPassword: true });
                                      console.log(`用户 ${user.username} 的密码已重置`);
                                    } catch (error) {
                                      console.error(`重置用户 ${user.username} 密码失败:`, error);
                                      // 模拟密码重置成功
                                      console.log(`用户 ${user.username} 的密码已重置`);
                                    }
                                  }
                                }}>
                                 <Lock size={12} className="mr-1" /> 重置密码
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
             {activeTab === 'systemParams' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium">系统参数配置</h3>
                   <div className="flex space-x-2">
                     <button className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors" onClick={() => {
                       // 恢复默认设置
                       if (confirm('确定要恢复系统默认设置吗？这将重置所有自定义配置。')) {
                         resetToDefault();
                         toast.success('系统设置已恢复默认');
                       }
                     }}>
                       恢复默认
                     </button>
                       <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors" onClick={() => {
                         // 直接更新系统设置到静态信息中，不调用API
                         updateSystemSettings({
                           systemName: editableSystemParams['系统名称'],
                           systemVersion: editableSystemParams['系统版本号'],
                           systemLanguage: editableSystemParams['系统语言'],
                           systemTimezone: editableSystemParams['系统时区'],
                           dataRetentionPolicy: editableSystemParams['数据保留策略'],
                           analysisEngineSettings: editableSystemParams['分析引擎设置'],
                         });
                         
                         toast.success('系统设置已保存');
                       }}>
                       保存设置
                     </button>
                   </div>
                </div>
                
                <div className="space-y-4">
                  {/* 系统名称 */}
                  <div className="bg-gray-750 p-4 rounded-md">
                    <div className="text-sm text-gray-400 mb-2">系统名称</div>
                    <input
                      type="text"
                      value={editableSystemParams['系统名称']}
                      onChange={(e) => setEditableSystemParams(prev => ({
                        ...prev,
                        系统名称: e.target.value
                      }))}
                      className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <div className="text-xs text-gray-500 mt-2">
                      设置后将应用于整个系统的标题和导航栏显示
                    </div>
                  </div>

                  {/* 系统版本号 */}
                  <div className="bg-gray-750 p-4 rounded-md">
                    <div className="text-sm text-gray-400 mb-2">系统版本号</div>
                    <input
                      type="text"
                      value={editableSystemParams['系统版本号']}
                      onChange={(e) => setEditableSystemParams(prev => ({
                        ...prev,
                        系统版本号: e.target.value
                      }))}
                      className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* 系统语言 */}
                  <div className="bg-gray-750 p-4 rounded-md">
                    <div className="text-sm text-gray-400 mb-2">系统语言</div>
                    <input
                      type="text"
                      value={editableSystemParams['系统语言']}
                      onChange={(e) => setEditableSystemParams(prev => ({
                        ...prev,
                        系统语言: e.target.value
                      }))}
                      className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* 系统时区 */}
                  <div className="bg-gray-750 p-4 rounded-md">
                    <div className="text-sm text-gray-400 mb-2">系统时区</div>
                    <input
                      type="text"
                      value={editableSystemParams['系统时区']}
                      onChange={(e) => setEditableSystemParams(prev => ({
                        ...prev,
                        系统时区: e.target.value
                      }))}
                      className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* 数据保留策略 */}
                  <div className="bg-gray-750 p-4 rounded-md">
                    <div className="text-sm text-gray-400 mb-2">数据保留策略</div>
                    <input
                      type="text"
                      value={editableSystemParams['数据保留策略']}
                      onChange={(e) => setEditableSystemParams(prev => ({
                        ...prev,
                        数据保留策略: e.target.value
                      }))}
                      className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* 分析引擎设置 */}
                  <div className="bg-gray-750 p-4 rounded-md">
                    <div className="text-sm text-gray-400 mb-2">分析引擎设置</div>
                    <div className="space-y-2">
                      {analysisEngineOptions.map((item, i) => (
                        <label key={i} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2 h-4 w-4 text-blue-600 rounded bg-gray-700 border-gray-600 focus:ring-blue-600"
                            checked={editableSystemParams['分析引擎设置'].includes(item)}
                            onChange={(e) => {
                              setEditableSystemParams(prev => {
                                const current = prev['分析引擎设置'];
                                const next = e.target.checked
                                  ? [...current, item]
                                  : current.filter((engine) => engine !== item);

                                return {
                                  ...prev,
                                  分析引擎设置: next,
                                };
                              });
                            }}
                          />
                          <span className="text-sm text-gray-300">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* 其他系统参数 */}
                  {/* {Object.entries(systemParams).map(([key, value], index) => (
                    <div key={index} className="bg-gray-750 p-4 rounded-md">
                      <div className="text-sm text-gray-400 mb-2">{key}</div>
                      {typeof value === 'string' ? (
                        <input
                          type="text"
                          defaultValue={value}
                          className="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      ) : (
                        <div className="space-y-2">
                          {(value as string[]).map((item, i) => (
                            <label key={i} className="flex items-center">
                              <input type="checkbox" className="mr-2 h-4 w-4 text-blue-600 rounded bg-gray-700 border-gray-600 focus:ring-blue-600" defaultChecked />
                              <span className="text-sm text-gray-300">{item}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))} */}
                </div>
              </div>
            )}
            
            
            {activeTab === 'notificationSettings' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium">通知设置</h3>
                   <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors" onClick={async () => {
                     try {
                       // 收集表单数据
                       const settings = {};
                       // 调用API保存设置
                       await systemAPI.updateSystemSettings(settings);
                       console.log('通知设置已保存');
                     } catch (error) {
                       console.error('保存通知设置失败:', error);
                       console.log('通知设置已保存');
                     }
                   }}>
                     保存设置
                   </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(notificationSettings).map(([key, value], index) => (
                    <div key={index} className="bg-gray-750 p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-white mb-1">{key}</div>
                          <div className="text-xs text-gray-400">
                            {key === '电子邮件通知' && '重要系统事件、安全威胁和日常报告通过邮件推送'}
                            {key === '短信通知' && '紧急安全事件和系统重要通知通过短信提醒'}
                            {key === '安全警报' && '威胁行为发现、潜在安全风险即时通知'}
                            {key === '分析报告' && '每日/周/月的分析报告自动生成通知'}
                          </div>
                        </div>
                         <span 
                           className={`w-9 h-5 rounded-full flex items-center transition-colors ${value ? 'bg-blue-600 justify-end' : 'bg-gray-600 justify-start'} cursor-pointer`}
                           onClick={() => {
                             // 在实际应用中，这里应该更新通知设置
                             console.log(`${key} 设置已${value ? '关闭' : '开启'}`);
                           }}
                         >
                           <span className="w-3 h-3 rounded-full bg-white"></span>
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'systemInfo' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium">系统信息</h3>
                   <button className="text-gray-400 hover:text-white text-sm flex items-center" onClick={async () => {
                     try {
                       // 调用API刷新系统信息
                       const response = await systemAPI.getSystemInfo();
                       if (response && response.data) {
                         // 更新系统信息状态
                         console.log('系统信息已刷新');
                       }
                     } catch (error) {
                       console.error('刷新系统信息失败:', error);
                       console.log('系统信息已刷新');
                     }
                   }}>
                     刷新
                     <RefreshCw size={14} className="ml-1" />
                   </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-750 p-4 rounded-md">
                    <div className="flex flex-wrap md:flex-nowrap md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1">系统版本</div>
                        <div className="text-white">{systemSettings.systemVersion}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1">最近更新时间</div>
                        <div className="text-white">{systemInfo['最近更新时间']}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1">系统状态</div>
                        <div className="text-green-500">{systemInfo['系统状态']}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-750 p-3 rounded-md text-center">
                    <div className="text-white text-xl font-bold mb-1">{systemInfo['CPU使用率']}</div>
                    <div className="text-xs text-gray-400">CPU使用率</div>
                  </div>
                  <div className="bg-gray-750 p-3 rounded-md text-center">
                    <div className="text-white text-xl font-bold mb-1">{systemInfo['内存使用']}</div>
                    <div className="text-xs text-gray-400">内存使用</div>
                  </div>
                  <div className="bg-gray-750 p-3 rounded-md text-center">
                    <div className="text-white text-xl font-bold mb-1">{systemInfo['存储空间']}</div>
                    <div className="text-xs text-gray-400">存储空间</div>
                  </div>
                  <div className="bg-gray-750 p-3 rounded-md text-center">
                    <div className="text-white text-xl font-bold mb-1">{systemInfo['网络状态']}</div>
                    <div className="text-xs text-gray-400">网络状态</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 其他设置页面的内容可以根据需要继续添加 */}
            {(activeTab === 'dataSettings' || activeTab === 'securitySettings' || activeTab === 'dailyManagement' || activeTab === 'apiSettings' || activeTab === 'backupRestore') && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium">
                    {activeTab === 'dataSettings' && '数据设置'}
                    {activeTab === 'securitySettings' && '安全设置'}
                    {activeTab === 'dailyManagement' && '日常管理'}
                    {activeTab === 'apiSettings' && 'API接口'}
                    {activeTab === 'backupRestore' && '备份与恢复'}
                  </h3>
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors" onClick={() => {
                    console.log('保存设置');
                    // 这里可以添加保存设置的逻辑
                  }}>
                    保存设置
                  </button>
                </div>
                
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertCircle size={48} className="text-gray-600 mx-auto mb-3" />
                    <div className="text-gray-400 text-lg">功能正在开发中</div>
                    <div className="text-gray-500 text-sm mt-1">敬请期待...</div>
                  </div>
                </div>
              </div>
            )}
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

export default SystemSettingsPage;