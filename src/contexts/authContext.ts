import * as React from 'react';
import { createContext, useState, ReactNode, FC } from "react";
import {registerUser, userLogin} from "@/lib/api/user";

// 用户信息接口
export interface UserInfo {
  name: string;
  role: string;
  avatar?: string;
  permissions?: string[];
  lastLogin?: string;
}

// 认证上下文接口
export interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  setIsAuthenticated: (value: boolean) => void;
  setUser: (user: UserInfo | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, email: string, phone: string) => Promise<boolean>;
}

// 模拟用户数据
const mockUser: UserInfo = {
  name: '管理员',
  role: 'admin'
};

// 创建认证上下文
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  setIsAuthenticated: () => {},
  setUser: () => {},
  login: async () => false,
  logout: () => {},
  register: async () => false
});

// 认证提供者组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // 从localStorage中恢复认证状态
    const savedAuth = localStorage.getItem('isAuthenticated');
    return savedAuth === 'true';
  });
  const [user, setUser] = useState<UserInfo | null>(() => {
    // 从localStorage中恢复用户信息
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  // 登录方法
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await userLogin({
        username: username,
        password: password
      })
      if (response.data != null) {
        const userInfo: UserInfo = {
          name: username,
          role: response.data,
        };
        setIsAuthenticated(true);
        setUser(userInfo);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(userInfo));
        return true;
      }
      else{
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  // 登出方法
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  // 注册方法
  const register = async (username: string, password: string, email: string, phone: string): Promise<boolean> => {
    try {
      const response = await registerUser({
        username: username,
        password: password,
        email: email,
        phone: phone
      })
      return response.data != null;
    } catch (error) {
      console.error('注册失败:', error);
      return false;
    }
  };

  // 上下文值
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    setIsAuthenticated,
    setUser,
    login,
    logout,
    register
  };

  return React.createElement(
      AuthContext.Provider,
      { value: contextValue },
      children
  );
};