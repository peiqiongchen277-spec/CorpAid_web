import React, { createContext, useState, ReactNode, FC, useEffect } from "react";

// 系统设置接口
export interface SystemSettings {
  systemName: string;
  systemVersion: string;
  systemLanguage: string;
  systemTimezone: string;
  dataRetentionPolicy: string;
  analysisEngineSettings: string[];
  [key: string]: any;
}

// 系统设置上下文接口
export interface SystemSettingsContextType {
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  resetToDefault: () => void;
}

// 默认系统设置
const DEFAULT_SETTINGS: SystemSettings = {
  systemName: "事件要情智能分析平台",
  systemVersion: "专业版 v1.0",
  systemLanguage: "简体中文",
  systemTimezone: "UTC+08:00 (北京、重庆、香港特别行政区、乌鲁木齐)",
  dataRetentionPolicy: "保留所有数据(推荐)",
  analysisEngineSettings: ["趋势学习分析", "应用深度学习", "自动情报聚合"]
};

// 创建系统设置上下文
export const SystemSettingsContext = createContext<SystemSettingsContextType>({
  systemSettings: DEFAULT_SETTINGS,
  updateSystemSettings: () => {},
  resetToDefault: () => {}
});

// 系统设置提供者组件
interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider: FC<SystemSettingsProviderProps> = ({ children }) => {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    // 从localStorage中恢复系统设置
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('恢复系统设置失败:', error);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 保存系统设置到localStorage
  useEffect(() => {
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  // 更新系统设置
  const updateSystemSettings = (settings: Partial<SystemSettings>) => {
    setSystemSettings(prevSettings => ({
      ...prevSettings,
      ...settings
    }));
  };

  // 重置为默认设置
  const resetToDefault = () => {
    setSystemSettings(DEFAULT_SETTINGS);
  };

  // 上下文值
  const contextValue: SystemSettingsContextType = {
    systemSettings,
    updateSystemSettings,
    resetToDefault
  };

  return React.createElement(
    SystemSettingsContext.Provider,
    { value: contextValue },
    children
  );
};