// API服务文件，使用axios与后端通信
import axios from 'axios'
import { toast } from 'sonner';

//创建axios实例
const api  = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 基础URL，实际使用时需要替换为后端API的基础URL
  timeout: 50000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么，比如添加token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response.data;
  },
  (error) => {
    // 对响应错误做点什么
    const message = error.response?.data?.message || '网络请求失败';
    toast.error(message);
    return Promise.reject(error);
  }
);

// API接口定义
export const intelligenceAPI = {
  // 情报搜索
  searchIntelligence: (keyword: string) => {
    return api.get(`/intelligence/search`, { params: { keyword } });
  },

  // 获取所有事件（初始加载）
  findAllEvents: (params?: {
    page?: number;
    pageSize?: number;
    sort?: string;
  }) => {
    return api.get(`/intelligence/findAll`, { params });
  },
  // 获取事件列表
  getEvents: (params?: {
    keyword?: string;
    category?: string;
    level?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => {
    return api.get(`/intelligence/events`, { params });
  },
  
  // 获取事件详情
  getEventDetail: (eventId: number) => {
    return api.get(`/intelligence/events/${eventId}`);
  },
  
  // 获取事件关系数据（用于图谱展示）
  getEventRelations: (query: string) => {
    return api.get(`/intelligence/relations`, { params: { query } });
  },
  
  // 获取统计数据
  getStatistics: (params?: {
    timeRange?: string;
    category?: string;
    level?: string;
  }) => {
    return api.get(`/intelligence/statistics`, { params });
  },
  
  // 获取趋势分析
  getTrendAnalysis: (params?: {
    timeRange?: string;
    category?: string;
  }) => {
    return api.get(`/intelligence/trends`, { params });
  },
  
  // 生成报告
  generateReport: (query: string) => {
    return api.post(`/report/generate`, { query });
  },
  
  // 获取报告详情
  getReportDetail: (reportId: string) => {
    return api.get(`/report/${reportId}`);
  },
  
  // 导出数据
  exportData: (type: string, params?: any) => {
    return api.get(`/export/${type}`, { 
      params,
      responseType: 'blob' 
    });
  },
};

// 用户相关API
export const userAPI = {
  // 登录
  login: (username: string, password: string) => {
    return api.post(`/auth/login`, { username, password });
  },
  
  // 登出
  logout: () => {
    return api.post(`/auth/logout`);
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return api.get(`/user/info`);
  },
  
  // 获取用户列表
  getUserList: (params?: {
    page?: number;
    pageSize?: number;
    role?: string;
  }) => {
    return api.get(`/user/list`, { params });
  },
  
  // 更新用户信息
  updateUser: (userId: number, data: any) => {
    return api.put(`/user/${userId}`, data);
  },
};

// 系统设置API
export const systemAPI = {
  // 获取系统设置
  getSystemSettings: () => {
    return api.get(`/system/settings`);
  },
  
  // 更新系统设置
  updateSystemSettings: (settings: any) => {
    return api.put(`/system/settings`, settings);
  },
  
  // 获取系统信息
  getSystemInfo: () => {
    return api.get(`/system/info`);
  },
};

export default api;