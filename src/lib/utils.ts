import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// 工具函数，用于合并 Tailwind CSS 类
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化数字，添加千位分隔符
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 格式化百分比
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// 格式化日期
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// 获取价值等级对应的颜色
export function getValueLevelColor(level: string): string {
  switch (level) {
    case '高价值':
      return 'bg-red-500';
    case '中价值':
      return 'bg-amber-500';
    case '低价值':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

// 获取趋势对应的颜色
export function getTrendColor(trend: string): string {
  return trend === '上升' ? 'text-green-500' : 'text-red-500';
}
