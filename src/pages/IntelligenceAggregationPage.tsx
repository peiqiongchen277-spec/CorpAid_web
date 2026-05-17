// 完整修复后的IntelligenceAggregationPage.tsx文件
import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download, RefreshCw, BarChart3,
    Network, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { intelligenceEventsData } from './IntelligenceFilterPage';
import * as echarts from 'echarts';
import {findEventDetailByQueryAndEid, findEventRelationByQuery, findPredictionsByQuery} from "@/lib/api/event";
import {findPassageByQuery} from "@/lib/api/passage";
import { SystemSettingsContext } from '@/contexts/systemSettingsContext';

// 关系类型颜色映射
const relationColors = {
  'TIME': '#3B82F6', // 蓝色 - 时间关系
  'SUB': '#10B981', // 绿色 - 子事件关系
  'CAUS': '#EF4444', // 红色 - 因果关系
  'COF': '#8B5CF6'  // 紫色 - 并发关系
};

// 关系类型名称映射
const relationNames = {
  'TIME': '时间关系',
  'SUB': '子事件关系',
  'CAUS': '因果关系',
  'COF': '并发关系'
};

const sourceTypeLabelMap: Record<number, string> = {
  0: '政府公报',
  1: '公开新闻',
  2: '社交媒体',
  3: '内部情报',
  4: '专家分析'
};

const normalizeRelationType = (relation: any) => String(relation || '').trim().toUpperCase();

const getEdgeRelation = (edge: any) => normalizeRelationType(edge?.relationType ?? edge?.relation);

const isCausalEdge = (edge: any) => getEdgeRelation(edge) === 'CAUS';

const toEidLabel = (value: any) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  if (/^eid/i.test(raw)) {
    const suffix = raw.replace(/^eid\s*/i, '');
    return `eid${suffix}`;
  }

  if (/^\d+$/.test(raw)) {
    return `eid${raw}`;
  }

  return raw;
};

const normalizeNodeId = (value: any) => toEidLabel(value);

const normalizeForSimilarity = (text: string) => {
  return (text || '')
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[.,!?;:'"“”‘’()\[\]{}<>，。！？；：、【】（）《》…\-_/\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const textToTokens = (text: string) => {
  const normalized = normalizeForSimilarity(text);
  const tokens = normalized.match(/[\u4e00-\u9fa5]|[a-z0-9]+/g) || [];
  return new Set(tokens);
};

const calcTextSimilarity = (a: string, b: string) => {
  const na = normalizeForSimilarity(a);
  const nb = normalizeForSimilarity(b);
  if (!na || !nb) return 0;

  // 直接包含优先
  if ((na.length > 8 && nb.includes(na)) || (nb.length > 8 && na.includes(nb))) {
    return 1;
  }

  const aSet = textToTokens(na);
  const bSet = textToTokens(nb);
  if (aSet.size === 0 || bSet.size === 0) return 0;

  let intersection = 0;
  aSet.forEach((token) => {
    if (bSet.has(token)) intersection += 1;
  });
  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const getLineMatchResult = (content: string, subEvents: any[]) => {
  const lines = (content || '').split('\n');
  const lineToEids = new Map<number, string[]>();
  const subEventKeyToLine = new Map<string, number>();

  if (!lines.length || !subEvents || subEvents.length === 0) {
    return { lineToEids, subEventKeyToLine };
  }

  subEvents.forEach((subEvent: any, idx: number) => {
    const subText = String(subEvent?.text || '').trim();
    const subKey = String(subEvent?.eid ?? subEvent?.id ?? idx);
    const subLabel = `eid${subEvent?.eid ?? subEvent?.id ?? idx + 1}`;
    if (!subText) return;

    let bestIdx = -1;
    let bestScore = 0;

    lines.forEach((line, idx) => {
      const score = calcTextSimilarity(subText, line);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });

    if (bestIdx >= 0 && bestScore >= 0.2) {
      const labels = lineToEids.get(bestIdx) || [];
      if (!labels.includes(subLabel)) {
        labels.push(subLabel);
      }
      lineToEids.set(bestIdx, labels);
      subEventKeyToLine.set(subKey, bestIdx);
    }
  });

  return { lineToEids, subEventKeyToLine };
};

// 模拟数据 - 用于初始展示
const mockRelationData = [
  {
    "id": 1,
    "sourceEvent": "eid1",
    "targetEvent": "eid2",
    "relationType": "CAUS",
    "eventQuery": "Arab_league"
  },
  {
    "id": 2,
    "sourceEvent": "eid1",
    "targetEvent": "eid3",
    "relationType": "TIME",
    "eventQuery": "Arab_league"
  },
  {
    "id": 3,
    "sourceEvent": "eid1",
    "targetEvent": "eid4",
    "relationType": "TIME",
    "eventQuery": "Arab_league"
  },
  {
    "id": 4,
    "sourceEvent": "eid3",
    "targetEvent": "eid14",
    "relationType": "SUB",
    "eventQuery": "Arab_league"
  },
  {
    "id": 5,
    "sourceEvent": "eid4",
    "targetEvent": "eid18",
    "relationType": "CAUS",
    "eventQuery": "Arab_league"
  },
  {
    "id": 6,
    "sourceEvent": "eid1",
    "targetEvent": "eid19",
    "relationType": "COF",
    "eventQuery": "Arab_league"
  }
];

// 模拟事件详情数据 - 简化为只保留eid和detail
const mockEventDetails: Record<string, any> = {
  "eid1": {
    id: "eid1",
    detail: "The Arab League issued a blanket condemnation on April 26 of the use of force against pro-democracy Arab protesters."
  },
  "eid2": {
    id: "eid2",
    detail: "The Arab League has remained silent on Syria , although it swiftly suspended Libya 's membership over Gaddafi 's efforts to quell opposition."
  },
  "eid3": {
    id: "eid3",
    detail: "France and Britain took a lead in pushing U.N. moves against Syrian President Bashar al-Assad."
  },
  "eid4": {
    id: "eid4",
    detail: "Russia said it would veto intervention against Syria in the United Nations Security Council."
  },
  "eid14": {
    id: "eid14",
    detail: "The situation in Syria continues to escalate with ongoing protests and government response."
  },
  "eid18": {
    id: "eid18",
    detail: "International community expresses concern over the deteriorating situation in Syria."
  },
  "eid19": {
    id: "eid19",
    detail: "Saudi Arabia recalls its ambassador from Damascus in protest against Syria's deadly crackdown."
  }
};

const normalizePredictionItems = (predictionSource: any) => {
  if (!predictionSource) return [];

  if (Array.isArray(predictionSource)) {
    return predictionSource
      .map((item: any) => ({
        text: String(item?.text ?? '').trim(),
        accuracy: item?.accuracy ?? '-'
      }))
      .filter((item: any) => item.text);
  }

  const textList = Array.isArray(predictionSource?.text)
    ? predictionSource.text
    : [];
  const accuracyList = Array.isArray(predictionSource?.accuracy)
    ? predictionSource.accuracy
    : [];

  if (textList.length > 0) {
    return textList
      .map((text: any, index: number) => ({
        text: String(text ?? '').trim(),
        accuracy: accuracyList[index] ?? '-'
      }))
      .filter((item: any) => item.text);
  }

  return [];
};

const buildPredictableNodeMap = (rawData: any): Record<string, any> => {
  const map: Record<string, any> = {};
  const toPredictableFlag = (value: any) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    if (typeof value === 'number') return value !== 0;
    return true;
  };
  const list = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.predictableNodes)
        ? rawData.predictableNodes
        : [];

  list.forEach((item: any) => {
    const eid = normalizeNodeId(item?.eid ?? item?.id ?? item?.eventId ?? item?.nodeId);
    if (!eid) return;

    const predictions = normalizePredictionItems(item?.predictions ?? item?.prediction);
    map[eid] = {
      eid,
      predictable: toPredictableFlag(item?.predictable),
      detail: item?.detail || item?.text || item?.description || '',
      predictions
    };
  });

  return map;
};

// 统计数据类型定义
interface IntelligenceStats {
  eventKeyword: string;
  totalIntelligence: number;
  totalEvents: number;
  relationTypeCounts: { [key: string]: number };
  intelligenceEvents: Array<{
    name: string;
    id: string;
    eventCount: number;
    eventIds: string[];
  }>;
}

  // 初始化Echarts实例
  const initializeECharts = (chartRef: React.RefObject<HTMLDivElement>, edges: any[], nodes: any[], showAllEdges: boolean = false, hiddenEdges: any[] = [], predictableNodeMap: Record<string, any> = {}, showCausalGraph: boolean = false, callbacks?: { onNodeClick?: (node: any) => void }) => {
  if (!chartRef.current) {
    console.error('Chart container not found');
    return () => {};
  }
  
  // 根据showCausalGraph状态决定显示哪些边
  let edgesToDisplay = edges || [];
  if (showCausalGraph) {
    // 只显示因果关系的边
    edgesToDisplay = edgesToDisplay.filter((edge: any) => isCausalEdge(edge));
  }

  try {
    // 清除已存在的图表实例
    const existingInstance = echarts.getInstanceByDom(chartRef.current);
    if (existingInstance) {
      existingInstance.dispose();
    }
    
    // 初始化新的图表实例
    const myChart = echarts.init(chartRef.current);

    const getBoundedSize = () => {
      const el = chartRef.current;
      if (!el) {
        return { width: 0, height: 0 };
      }

      const parent = el.parentElement;
      const width = Math.min(el.clientWidth, parent?.clientWidth ?? el.clientWidth);
      const height = Math.min(el.clientHeight, parent?.clientHeight ?? el.clientHeight);

      return {
        width: Math.max(0, width),
        height: Math.max(0, height)
      };
    };
    
    const currentPredictableNodeIds = Object.keys(predictableNodeMap).filter(
      (nodeId) => predictableNodeMap[nodeId]?.predictable
    );
    
    // 准备节点数据，只使用eid和detail
    // 如果显示所有边，我们需要识别出通过隐藏边连接的节点
    // 首先创建一个集合存储所有通过隐藏边连接的节点ID
    const hiddenEdgeNodes = new Set<string>();
    
    if (showAllEdges && hiddenEdges.length > 0) {
      hiddenEdges.forEach(edge => {
        hiddenEdgeNodes.add(normalizeNodeId(edge.source));
        hiddenEdgeNodes.add(normalizeNodeId(edge.target));
      });
    }
      
      // 定义原始颜色和高亮颜色
      const originalColor = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
        {
          color: '#45B7D1',
          offset: 0
        },
        {
          color: '#29B6F6',
          offset: 1
        }
      ]);
      
      // 高亮颜色 - 使用不同的渐变色来区分
      const highlightedColor = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
        {
          color: '#FFB300',
          offset: 0
        },
        {
          color: '#FF9800',
          offset: 1
        }
      ]);
      // 可预测节点颜色
      const predictableColor = new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
        {
          color: '#C084FC',
          offset: 0
        },
        {
          color: '#9333EA',
          offset: 1
        }
      ]);

      // 确定节点是否有因果关系
      const hasCausalRelationship = (nodeId: string): boolean => {
        // 检查节点是否在因果关系边的任意一端
        return edgesToDisplay.some((edge: any) =>
          (normalizeNodeId(edge.source) === normalizeNodeId(nodeId) || normalizeNodeId(edge.target) === normalizeNodeId(nodeId)) && isCausalEdge(edge)
        );
      };
      
      const chartNodes = nodes.map((node: any) => {
        // 检查节点是否通过隐藏边连接
        const normalizedNodeId = normalizeNodeId(node.id);
        const isHighlighted = showAllEdges && hiddenEdgeNodes.has(normalizedNodeId);
        const predictableNodeInfo = predictableNodeMap[normalizedNodeId];
        // 检查节点是否为可预测节点
        const isPredictable = currentPredictableNodeIds.includes(normalizedNodeId);
        // 检查节点是否有因果关系
        const hasCausalRel = hasCausalRelationship(node.id);
        
        // 只有在显示事件因果图且节点有因果关系时才显示
        const shouldShowNode = !showCausalGraph || hasCausalRel;
        
    return {
      id: normalizedNodeId,
      name: normalizedNodeId, // 只使用eid作为名称
      symbolSize: shouldShowNode ? 40 : 0, // 没有因果关系的节点大小设为0（隐藏）
      value: {
        eid: normalizedNodeId,
        detail: predictableNodeInfo?.detail || node.detail || node.text || node.description || '暂无详细信息',
        isPredictable: isPredictable,
        predictions: isPredictable ? (predictableNodeInfo?.predictions || []) : []
      },
      itemStyle: {
        // 只有在显示事件因果图的情况下，可预测节点才显示为紫色
        // 否则，所有节点使用相同的样式
        color: showCausalGraph && isPredictable ? predictableColor : (isHighlighted ? highlightedColor : originalColor),
        borderWidth: showCausalGraph && isPredictable ? 4 : (isHighlighted ? 3 : 2), // 可预测节点边框更粗
        borderColor: showCausalGraph && isPredictable ? '#F0ABFC' : (isHighlighted ? '#FFEB3B' : '#81D4FA'),
        shadowBlur: showCausalGraph && isPredictable ? 20 : 15,
        shadowColor: showCausalGraph && isPredictable ? 'rgba(168, 85, 247, 0.7)' : (isHighlighted ? 'rgba(255, 193, 7, 0.6)' : 'rgba(33, 150, 243, 0.5)')
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(33, 150, 243, 0.7)'
        }
      },
      label: {
        show: shouldShowNode, // 没有因果关系的节点隐藏标签
        position: 'top',
        color: '#fff',
        fontSize: 12,
        fontWeight: 'normal'
      }
    };
  }).filter(node => node.symbolSize > 0); // 过滤掉隐藏的节点
    
         // 准备边数据 - 去掉边上的文字
    let chartEdges = edgesToDisplay.map((edge: any) => {
      const relation = getEdgeRelation(edge);
      return {
      source: normalizeNodeId(edge.source),
      target: normalizeNodeId(edge.target),
      name: relation,
      lineStyle: {
        color: relationColors[relation as keyof typeof relationColors] || '#3B82F6',
        width: 2,
        curveness: 0.2
      },
      label: {
        show: false  // 隐藏边上的文字
      },
      emphasis: {
        lineStyle: {
          width: 4
        }
      }
    }});
      // 如果需要显示所有边，添加隐藏的边并设置为虚线，同时添加高亮效果
      // 但在显示事件因果图时，不显示非因果关系的边
     if (showAllEdges && hiddenEdges.length > 0 && !showCausalGraph) {
      // 只有在非因果图模式下才显示所有边
      const hiddenChartEdges = hiddenEdges.map((edge: any) => {
        // 在显示因果图模式下，只添加因果关系的隐藏边
        if (showCausalGraph && !isCausalEdge(edge)) {
          return null;
        }

        const relation = getEdgeRelation(edge);
        const edgeColor = relationColors[relation as keyof typeof relationColors] || '#3B82F6';
        return {
          source: normalizeNodeId(edge.source),
          target: normalizeNodeId(edge.target),
          name: relation,
          lineStyle: {
            color: edgeColor,
            width: 3, // 增加宽度，使虚线更明显
            curveness: 0.2,
            type: 'dashed',  // 设置为虚线
            dashPattern: [8, 4], // 调整虚线样式，使线段更长，间隔更小
            // 增强高亮效果
            shadowBlur: 15, // 增加阴影模糊度
            shadowColor: edgeColor,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            opacity: 1 // 确保完全不透明
          },
          label: {
            show: false  // 隐藏边上的文字
          },
          emphasis: {
            lineStyle: {
              width: 5, // 鼠标悬停时更粗
              shadowBlur: 20, // 增强悬停时的阴影效果
              shadowColor: edgeColor,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              opacity: 1
            }
          }
        };
      }).filter((edge): edge is NonNullable<typeof edge> => Boolean(edge)); // 过滤掉null值
      
      chartEdges = [...chartEdges, ...hiddenChartEdges];
    }

    const pairRelationsMap = new Map<string, string[]>();
    chartEdges.forEach((edge: any) => {
      const source = normalizeNodeId(edge.source);
      const target = normalizeNodeId(edge.target);
      const relation = normalizeRelationType(edge.name);
      if (!source || !target || !relation) return;

      const key = [source, target].sort().join('__');
      const relations = pairRelationsMap.get(key) || [];
      relations.push(relation);
      pairRelationsMap.set(key, relations);
    });
    
    // 注册点击事件
    myChart.on('click', (params) => {
      if (params.dataType === 'node' && callbacks && callbacks.onNodeClick) {
        callbacks.onNodeClick(params.data);
      }
    });
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        renderMode: 'html',
        appendToBody: true,
        confine: false,
        enterable: true,
        extraCssText: 'z-index: 99999; max-width: 520px; white-space: normal; pointer-events: auto;',
        triggerOn: 'mousemove', // 普通节点仍然使用鼠标悬停触发
        formatter: (params: any) => {
          if (params.dataType === 'node' && params.data && params.data.value) {
            const { eid, detail, isPredictable } = params.data.value;
            
            if (isPredictable && showCausalGraph) {
              // 可预测节点的tooltip提示用户点击查看详情
              return `
                <div style="background: rgba(17, 24, 39, 0.98); padding: 12px; border-radius: 12px; border: 0.5px solid rgba(255, 255, 255, 0.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25); max-width: 400px;">
                  <div style="font-weight: bold; color: #C084FC; margin-bottom: 6px;">eid: ${eid} <span style="background-color: rgba(168, 85, 247, 0.2); color: #A78BFA; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 6px;">可预测节点</span></div>
                  <div style="color: #E5E7EB; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">点击查看详细信息和预测分析</div>
                </div>
              `;
            } else {
              // 普通节点的tooltip
              return `<div style="background: rgba(17, 24, 39, 0.98); padding: 12px; border-radius: 12px; border: 0.5px solid rgba(255, 255, 255, 0.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);">
                  <div style="font-weight: bold; color: #3B82F6; margin-bottom: 6px;">eid: ${eid}</div>
                  <div style="color: #E5E7EB; font-size: 13px; line-height: 1.5;">${detail}</div>
                </div>
              `;
            }
          }

          if (params.dataType === 'edge' && params.data) {
            const source = normalizeNodeId(params.data.source);
            const target = normalizeNodeId(params.data.target);
            const key = [source, target].sort().join('__');
            const relationList = pairRelationsMap.get(key) || [];

            if (relationList.length > 0) {
              const relationCounts = relationList.reduce((acc: Record<string, number>, rel: string) => {
                acc[rel] = (acc[rel] || 0) + 1;
                return acc;
              }, {});

              const relationHtml = Object.entries(relationCounts)
                .map(([rel, count]) => {
                  const relLabel = relationNames[rel as keyof typeof relationNames] || rel;
                  const relColor = relationColors[rel as keyof typeof relationColors] || '#3B82F6';
                  return `<div style="display:flex; align-items:center; margin-top:6px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${relColor}; margin-right:8px;"></span><span style="color:#E5E7EB; font-size:12px;">${relLabel}${count > 1 ? ` × ${count}` : ''}</span></div>`;
                })
                .join('');

              return `
                <div style="background: rgba(17, 24, 39, 0.98); padding: 12px; border-radius: 12px; border: 0.5px solid rgba(255, 255, 255, 0.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25); min-width: 200px;">
                  <div style="font-weight: bold; color: #93C5FD; margin-bottom: 4px;">${source} ↔ ${target}</div>
                  <div style="color:#9CA3AF; font-size:11px;">关系类型（共 ${relationList.length} 条）</div>
                  ${relationHtml}
                </div>
              `;
            }
          }

          return params.data && params.data.name ? params.data.name : '未知关系';
        }
      },
      // 保留图例但隐藏底部的图例说明，使用自定义图例
      legend: [
        {
          data: Object.values(relationNames),
          bottom: 10,
          textStyle: {
            color: '#9CA3AF'
          },
          show: false  // 隐藏ECharts自带的图例，使用自定义图例
        }
      ],
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut' as const,
      series: [
        {
          type: 'graph',
          layout: 'force',
          left: '2%',
          top: '2%',
          right: '2%',
          bottom: '2%',
          force: {
            repulsion: 1200,
            edgeLength: 150,
            gravity: 0.3
          },
          roam: true,
          label: {
            show: true
          },
          data: chartNodes,
          links: chartEdges,
          lineStyle: {
            color: '#3B82F6',
            width: 1.5,
            curveness: 0.2
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 5
            }
          }
        }
      ]
    };
    
    // 确保有数据才设置选项
    if (chartNodes.length > 0 && chartEdges.length > 0) {
      myChart.setOption(option);
    } else {
      console.warn('No data available for chart');
      // 显示空数据提示
      const emptyOption = {
        backgroundColor: 'transparent',
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: {
            color: '#9CA3AF'
          }
        }
      };
      myChart.setOption(emptyOption);
    }

    const initialSize = getBoundedSize();
    myChart.resize({
      width: initialSize.width,
      height: initialSize.height,
      animation: { duration: 0 }
    });
    
    // 响应窗口大小变化
    const handleResize = () => {
      const nextSize = getBoundedSize();
      myChart.resize({
        width: nextSize.width,
        height: nextSize.height,
        animation: { duration: 0 }
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    // 返回清理函数
    return () => {
      myChart.off('click'); // 移除事件监听器
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
     } catch (error) {
      console.error('Failed to initialize ECharts:', error);
      return () => {};
    }
  };

// 统计数据展示组件
const StatsDisplay: React.FC<{ stats: IntelligenceStats }> = ({ stats }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium flex items-center">
          <BarChart3 size={18} className="mr-2 text-blue-500" />
          统计数据概览
        </h3>
      </div>
      
      {/* 统计指标卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-750 p-3 rounded-md">
          <div className="text-xl font-bold text-white mb-1">{stats.totalIntelligence}</div>
          <div className="text-xs text-gray-400">总情报数量</div>
        </div>
        <div className="bg-gray-750 p-3 rounded-md">
          <div className="text-xl font-bold text-white mb-1">{stats.totalEvents}</div>
          <div className="text-xs text-gray-400">总事件数量</div>
        </div>
        <div className="bg-gray-750 p-3 rounded-md">
          <div className="text-xl font-bold text-white mb-1">
            {Object.values(stats.relationTypeCounts).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-xs text-gray-400">总关系数量</div>
        </div>
      </div>
      
      {/* 关系类型分布 */}
      <div className="bg-gray-750 p-4 rounded-md mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Network size={16} className="mr-2 text-blue-500" />
          关系类型分布
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
          {Object.entries(stats.relationTypeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: relationColors[type as keyof typeof relationColors] || '#3B82F6' }}
              ></div>
              <div className="text-xs text-gray-300">{relationNames[type as keyof typeof relationNames] || type}: {count}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 各情报事件统计 */}
      <div className="bg-gray-750 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
          <FileText size={16} className="mr-2 text-blue-500" />
          各情报事件统计
        </h4>
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
          {stats.intelligenceEvents.map((item, index) => (
            <div key={index} className="p-2 bg-gray-700 rounded-md">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-white flex-grow">{item.name}</div>
                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded-full whitespace-nowrap">
                  {item.eventCount} 个事件
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.eventIds.map((eid, idx) => (
                  <span 
                    key={idx} 
                    className="px-1.5 py-0.5 bg-gray-600 text-xs rounded-md text-gray-300"
                  >
                    {eid}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const IntelligenceAggregationPage: React.FC = () => {
  const { systemSettings } = useContext(SystemSettingsContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 状态管理
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isAggregating, setIsAggregating] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [selectedIntelligence, setSelectedIntelligence] = useState<any>(null);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [graphData, setGraphData] = useState<{edges: any[], nodes: any[]}>({edges: [], nodes: []});
  // 新增状态：存储原始完整的边数据
  const [originalEdges, setOriginalEdges] = useState<any[]>([]);
  // 新增状态：存储被隐藏的边数据
  const [hiddenEdges, setHiddenEdges] = useState<any[]>([]);
  // 新增状态：控制是否显示所有边
  const [showAllEdges, setShowAllEdges] = useState(false);
  // 新增状态：控制是否只显示因果关系图
  const [showCausalGraph, setShowCausalGraph] = useState(false);
  const [intelligenceStats, setIntelligenceStats] = useState<IntelligenceStats>({
    eventKeyword: '',
    totalIntelligence: 0,
    totalEvents: 0,
    relationTypeCounts: {},
    intelligenceEvents: []
  });
  // 新增状态：管理可预测节点的弹出框
  const [showPredictablePopup, setShowPredictablePopup] = useState(false);
  const [selectedPredictableNode, setSelectedPredictableNode] = useState<any>(null);
  const [showPredictions, setShowPredictions] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [needSearchFirst, setNeedSearchFirst] = useState(false);
  const [predictableNodeMap, setPredictableNodeMap] = useState<Record<string, any>>({});
  const hasPromptedNeedSearchRef = useRef(false);
  
  // 图表引用
  const chartRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const chartRefEnhanced = useRef<HTMLDivElement>(null);
  const cleanupEnhancedRef = useRef<(() => void) | null>(null);
  const contentLineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const selectedContentText = String(selectedIntelligence?.content || '').replace(/\\n/g, '\n');
  const lineMatchResult = useMemo(
    () => getLineMatchResult(selectedContentText, selectedIntelligence?.events || []),
    [selectedContentText, selectedIntelligence?.events]
  );
  
  useEffect(() => {
    setActiveLineIndex(null);
  }, [selectedIntelligence?.id]);

   // 组件挂载时初始化mock数据
  useEffect(() => {
    // 设置初始的mock数据以确保图表能够显示
    const initialEdges = mockRelationData.map(rel => ({
      source: rel.sourceEvent,
      target: rel.targetEvent,
      relation: rel.relationType,
      query: rel.eventQuery
    }));
    
    // 随机隐藏30%的边
    const { visibleEdges, hidden } = randomHideEdges(initialEdges, 0.3);
    
    const nodes = Object.values(mockEventDetails).map(event => ({
      id: event.id,
      detail: event.detail
    }));
    
    setGraphData({
      edges: visibleEdges,
      nodes: nodes
    });
    
    // 保存原始边和隐藏的边
    setOriginalEdges(initialEdges);
    setHiddenEdges(hidden);
    setPredictableNodeMap({});
    
    // 初始化mock统计数据
    calculateStatistics(intelligenceEventsData, mockRelationData, Object.values(mockEventDetails));
    // 然后根据显示状态更新统计数据
    updateStatisticsBasedOnDisplayedData();
  }, []);
  
  // 左列图谱：始终显示“初步关系识别”原图谱（保持不变）
  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (showGraph && graphData && graphData.nodes && graphData.nodes.length > 0) {
      const timer = setTimeout(() => {
        cleanupRef.current = initializeECharts(
          chartRef,
          graphData.edges || [],
          graphData.nodes || [],
          false,
          [],
          predictableNodeMap,
          false,
          {
            onNodeClick: handleNodeClick
          }
        );
      }, 100);

      return () => clearTimeout(timer);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [showGraph, graphData, predictableNodeMap]);

  // 右列图谱：显示“深度关系识别”或“事件因果图”
  useEffect(() => {
    if (cleanupEnhancedRef.current) {
      cleanupEnhancedRef.current();
      cleanupEnhancedRef.current = null;
    }

    if (!showGraph || !graphData?.nodes?.length) {
      return;
    }

    if (!showAllEdges && !showCausalGraph) {
      return;
    }

    const timer = setTimeout(() => {
      if (showAllEdges && !showCausalGraph) {
        // 深度关系识别：右侧基于“可见边+补全边”渲染，补全边用虚线高亮，连接节点使用highlightedColor
        cleanupEnhancedRef.current = initializeECharts(
          chartRefEnhanced,
          graphData.edges || [],
          graphData.nodes || [],
          true,
          hiddenEdges || [],
          predictableNodeMap,
          false,
          {
            onNodeClick: handleNodeClick
          }
        );
        return;
      }

      // 事件因果图：右侧使用全量边后再抽取因果关系
      const allEdges = originalEdges.length > 0 ? originalEdges : [...graphData.edges, ...hiddenEdges];
      cleanupEnhancedRef.current = initializeECharts(
        chartRefEnhanced,
        allEdges,
        graphData.nodes || [],
        false,
        [],
        predictableNodeMap,
        true,
        {
          onNodeClick: handleNodeClick
        }
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [showGraph, graphData, originalEdges, hiddenEdges, showAllEdges, showCausalGraph, predictableNodeMap]);
  
  // 处理节点点击事件
  const handleNodeClick = (node: any) => {
    if (node && node.value && node.value.isPredictable) {
      setSelectedPredictableNode(node.value);
      setShowPredictablePopup(true);
      setShowPredictions(false);
    }
  };
  
  // 关闭弹出框
  const closePredictablePopup = () => {
    setShowPredictablePopup(false);
    setSelectedPredictableNode(null);
    setShowPredictions(false);
  };
  
  // 监听showAllEdges状态变化，更新统计数据
  useEffect(() => {
    // 确保在DOM更新后执行统计数据更新，以获得最新的状态
    const timer = setTimeout(() => {
      updateStatisticsBasedOnDisplayedData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [showAllEdges, showCausalGraph, graphData, filteredEvents, hiddenEdges, originalEdges, searchKeyword]);
  
  // 计算统计数据的函数
  const calculateStatistics = (intelligenceList: any[], relationData: any[], eventDetails: any[]) => {
    try {
      // 计算总情报数量
      const totalIntelligence = intelligenceList.length;
      
      // 从事件详情中获取总事件数量
      const totalEvents = eventDetails.length;

      //获取事件关键词
      const eventKeyword = intelligenceList.length > 0 ? intelligenceList[0].query : searchKeyword;
      
      // 计算不同关系类型的数量
      const relationTypeCounts: { [key: string]: number } = {};
      relationData.forEach(rel => {
        const relationType = normalizeRelationType(rel.relationType || rel.relation);
        relationTypeCounts[relationType] = (relationTypeCounts[relationType] || 0) + 1;
      });
      console.log('Relation Type Counts:', relationTypeCounts);
      
      // 计算每个情报的事件数量和对应的eid列表
      const intelligenceEvents: Array<{
        name: string;
        id: string;
        eventCount: number;
        eventIds: string[];
      }> = intelligenceList.map((item) => {
        // 从mock数据中找到对应情报的事件
        const originalEvent = intelligenceList.find(e => e.id === item.id);
        const eventIds = (originalEvent?.events || [])
          .map((e: any) => toEidLabel(e?.eid ?? e?.id))
          .filter(Boolean);
        
        return {
          name: item.name || item.title || `情报 ${item.id}`,
          id: item.id.toString(),
          eventCount: eventIds.length,
          eventIds: eventIds
        };
      });
      
      // 更新统计数据状态
      setIntelligenceStats({
        eventKeyword,
        totalIntelligence,
        totalEvents,
        relationTypeCounts,
        intelligenceEvents
      });
    } catch (error) {
      console.error('计算统计数据失败:', error);
      // 失败时设置默认值
      setIntelligenceStats({
        eventKeyword: '',
        totalIntelligence: 0,
        totalEvents: 0,
        relationTypeCounts: {},
        intelligenceEvents: []
      });
    }
  };

  const buildStatsByDisplayedGraph = (
    intelligenceList: any[],
    displayedEdges: any[],
    displayedNodes: any[],
    fallbackKeyword?: string
  ): IntelligenceStats => {
    const nodeIds = new Set<string>();
    displayedEdges.forEach((edge: any) => {
      const sourceId = normalizeNodeId(edge.source);
      const targetId = normalizeNodeId(edge.target);
      if (sourceId) nodeIds.add(sourceId);
      if (targetId) nodeIds.add(targetId);
    });

    const relationTypeCounts: { [key: string]: number } = {};
    displayedEdges.forEach((edge: any) => {
      const relationType = normalizeRelationType(edge.relationType || edge.relation);
      relationTypeCounts[relationType] = (relationTypeCounts[relationType] || 0) + 1;
    });

    const intelligenceEvents = intelligenceList
      .map((item) => {
        const originalEvent = intelligenceList.find((e: any) => e.id === item.id);
        const originalEventIds = (originalEvent?.events || [])
          .map((e: any) => toEidLabel(e?.eid ?? e?.id))
          .filter(Boolean);
        const displayedEventIds = originalEventIds.filter((eid: string) => nodeIds.has(eid));
        return {
          name: item.name || item.title || `情报 ${item.id}`,
          id: item.id.toString(),
          eventCount: displayedEventIds.length,
          eventIds: displayedEventIds
        };
      })
      .filter((event: any) => event.eventCount > 0);

    return {
      eventKeyword: intelligenceList.length > 0 ? intelligenceList[0].query : (fallbackKeyword ?? searchKeyword),
      totalIntelligence: intelligenceList.length,
      totalEvents: displayedNodes.length,
      relationTypeCounts,
      intelligenceEvents
    };
  };
    // 根据当前显示的边和节点重新计算统计数据的函数
  const updateStatisticsBasedOnDisplayedData = () => {
    try {
      if (!graphData || !graphData.nodes) return;
      
      // 确定当前显示的边
      let displayedEdges = [];
      if (showCausalGraph) {
        const allEdges = originalEdges.length > 0 ? originalEdges : [...graphData.edges, ...hiddenEdges];
        displayedEdges = allEdges.filter((edge: any) => isCausalEdge(edge));
        console.log('Causal Graph Mode: Displaying only causal edges. Total:', displayedEdges.length);
      } else if (showAllEdges && hiddenEdges.length > 0) {
        // 如果显示所有边，包括原始边和隐藏的边
        displayedEdges = [...graphData.edges, ...hiddenEdges];
        console.log('Showing all edges. Visible edges:', graphData.edges.length, 'Hidden edges:', hiddenEdges.length, 'Total displayed edges:', displayedEdges.length);
      } else {
        // 只显示当前可见的边
        displayedEdges = [...graphData.edges];
        console.log('Showing only visible edges. Total:', displayedEdges.length);
      }
      
      // 确定当前显示的节点
      // 首先获取所有通过可见边连接的节点ID
      const nodeIds = new Set<string>();
      displayedEdges.forEach(edge => {
        const sourceId = normalizeNodeId(edge.source);
        const targetId = normalizeNodeId(edge.target);
        if (sourceId) nodeIds.add(sourceId);
        if (targetId) nodeIds.add(targetId);
      });
      
      // 过滤出当前显示的节点
      const displayedNodes = graphData.nodes.filter((node: any) => nodeIds.has(normalizeNodeId(node.id)));
      
      // 计算当前显示的边的关系类型分布
      const relationTypeCounts: { [key: string]: number } = {};
      displayedEdges.forEach((edge: any) => {
        const relationType = normalizeRelationType(edge.relationType || edge.relation);
        relationTypeCounts[relationType] = (relationTypeCounts[relationType] || 0) + 1;
      });
      
      // 计算总情报数量和总事件数量
      const totalIntelligence = filteredEvents.length;
      const totalEvents = displayedNodes.length; 
      //获取事件关键词
      const eventKeyword = filteredEvents.length > 0 ? filteredEvents[0].query : searchKeyword;
      // 计算每个情报的事件数量（基于当前显示的节点）
      const intelligenceEvents = filteredEvents.map((item) => {
        // 获取原始事件的eid列表
        const originalEvent = filteredEvents.find(e => e.id === item.id);
        const originalEventIds = (originalEvent?.events || [])
          .map((e: any) => toEidLabel(e?.eid ?? e?.id))
          .filter(Boolean);
        // 过滤出当前显示的节点中属于该情报的事件ID
        const displayedEventIds = originalEventIds.filter((eid: string) => nodeIds.has(eid));
        
        return {
          name: item.name || item.title || `情报 ${item.id}`,
          id: item.id.toString(),
          eventCount: displayedEventIds.length,
          eventIds: displayedEventIds
        };
      }).filter(event => event.eventCount > 0); // 只保留有显示事件的情报

      // 更新统计数据状态
      setIntelligenceStats({
        eventKeyword,
        totalIntelligence,
        totalEvents,
        relationTypeCounts,
        intelligenceEvents
      });
    } catch (error) {
      console.error('基于显示数据计算统计失败:', error);
    }
  };

    // 搜索相关query下的所有情报
  const handleSearch = async (keyword?: string) => {
    const finalKeyword = (keyword ?? searchKeyword).trim();

    if (!finalKeyword) {
      setFilteredEvents([]);
      setIsFilterApplied(false);
      setShowGraph(false);
      return;
    }

    setIsAggregating(true);
    
    try {
      // 使用后端的findPassagesByQuery接口获取数据
      const response = await findPassageByQuery(finalKeyword);
      
      if (response && response.data) {
        const mappedEvents = response.data.map((event: any) => {
          const sourceTypeValue = Number(event?.sourceType);
          const sourceTypeLabel = Number.isNaN(sourceTypeValue)
            ? ''
            : (sourceTypeLabelMap[sourceTypeValue] || '未知来源类型');

          return {
            id: event.id,
            query: event.query,
            name: event.name || event.title || '未命名情报',
            content: event.text || event.content || event.description || '暂无正文',
            time: event.time || event.date || '-',
            type: event.type || event.eventType || '-',
            source: event.source || event.psg_source || '-',
            region: event.region || event.psg_region || '-',
            sourceType: sourceTypeLabel,
            level: event.level || '-',
            levelColor: event.levelColor || 'bg-gray-600',
            events: event.events || []
          };
        });

        // 如果API返回数据，使用API数据
        setFilteredEvents(mappedEvents);
        setSelectedIntelligence(mappedEvents[0] || null);
      } else {
        setFilteredEvents([]);
        setSelectedIntelligence(null);
      }
      setIsFilterApplied(true);
      setShowGraph(false); // 搜索后隐藏图谱，等待重新聚合
    } catch (error) {
      console.error('搜索情报失败:', error);
      setFilteredEvents([]);
      setSelectedIntelligence(null);
      setIsAggregating(false);
      setShowGraph(false); 
    } finally {
      setIsAggregating(false);
    }
  };

  // 从筛选页跳转并携带keyword时，自动发起查询
  useEffect(() => {
    const keywordFromUrl = (searchParams.get('keyword') || '').trim();
    if (!keywordFromUrl) {
      setNeedSearchFirst(true);
      setFilteredEvents([]);
      setSelectedIntelligence(null);
      setIsFilterApplied(false);
      setShowGraph(false);

      if (!hasPromptedNeedSearchRef.current) {
        toast.warning('请先至“情报筛选”界面搜索情报');
        hasPromptedNeedSearchRef.current = true;
      }
      return;
    }

    setNeedSearchFirst(false);
    hasPromptedNeedSearchRef.current = false;
    setSearchKeyword(keywordFromUrl);
    handleSearch(keywordFromUrl);
  }, [searchParams]);

    // 重新聚合并生成事件关系图谱
  const reaggregateData = async () => {
    // 检查是否有搜索关键词和搜索结果
    if (!searchKeyword) {
      // 提示用户先搜索
      toast.warning('请先搜索相关关键词');
      return;
    }
    
    // 检查搜索结果是否为空
    if (filteredEvents.length === 0) {
      toast.warning('搜索结果为空，无法生成关系图谱');
      return;
    }

    setIsAggregating(true);

    try {
      let predictableNodes: Record<string, any> = {};
      try {
        const predictionResponse = await findPredictionsByQuery(searchKeyword, 'True');
        predictableNodes = buildPredictableNodeMap(predictionResponse?.data);
      } catch (predictionError) {
        console.error('获取可预测节点失败:', predictionError);
      }
      setPredictableNodeMap(predictableNodes);

      // 1. 先通过findRelationByQuery获取关系数据
      const relationResponse = await findEventRelationByQuery(searchKeyword);
      
      if (relationResponse && relationResponse.data){
        const relationData = relationResponse.data;
        console.log('Relation Data:', relationData);
        
        // 提取所有唯一的事件ID
        const eventIds = new Set<string>();
        relationData.forEach((item: any) => {
          const sourceEvent = String(item?.sourceEvent ?? '').trim();
          const targetEvent = String(item?.targetEvent ?? '').trim();
          if (sourceEvent) eventIds.add(sourceEvent);
          if (targetEvent) eventIds.add(targetEvent);
        });
        
        // 2. 为每个事件ID通过findDetailByQueryAndEid获取详情
        const nodes: any[] = [];
        const eventIdArray = Array.from(eventIds);
        console.log('Unique Event IDs to Fetch Details For:', eventIdArray);
        
        // 模拟并发请求所有事件详情
        const detailPromises = eventIdArray.map(eid => 
          findEventDetailByQueryAndEid(searchKeyword, eid)
        );
        
        const detailResponses = await Promise.all(detailPromises);
        
        // 处理详情响应
        detailResponses.forEach((response, index) => {
          const rawEid = eventIdArray[index];
          const normalizedEid = normalizeNodeId(rawEid);
          if (response && response.data) {
            // 使用API返回的详情
            nodes.push({
              id: normalizedEid,
              detail: response.data|| "暂无详细信息"
            });
          } else {
            // 使用mock数据作为备用
            if (mockEventDetails[normalizedEid]) {
              nodes.push({
                id: mockEventDetails[normalizedEid].id,
                detail: mockEventDetails[normalizedEid].detail
              });
            } else {
              // 如果没有mock数据，创建默认节点
              nodes.push({
                id: normalizedEid,
                detail: `这是关于${normalizedEid}的事件详情，与${searchKeyword}相关。`
              });
            }
          }
        });
        
        // 转换关系数据格式以适应ECharts
        const allEdges = relationData.map((item: any) => ({
          source: normalizeNodeId(item.sourceEvent),
          target: normalizeNodeId(item.targetEvent),
          relation: item.relationType,
          query: item.eventQuery
        }));
        
        console.log('All Edges Before Hiding:', allEdges);
        // 随机隐藏30%的边
        const { visibleEdges, hidden } = randomHideEdges(allEdges, 0.3);
        console.log('Visible Edges:', visibleEdges);
        console.log('Hidden Edges:', hidden);
        
        setGraphData({ edges: visibleEdges, nodes });
        setOriginalEdges(allEdges);
        setHiddenEdges(hidden);
        setShowAllEdges(false); // 重置显示所有边的状态
        setShowCausalGraph(false); // 重置因果图状态

        // 计算并更新统计数据
        calculateStatistics(filteredEvents, relationData, nodes);
        // 然后根据显示状态更新统计数据
        setIntelligenceStats(buildStatsByDisplayedGraph(filteredEvents, visibleEdges, nodes.filter((n: any) => {
          const nodeId = normalizeNodeId(n.id);
          return visibleEdges.some((e: any) => normalizeNodeId(e.source) === nodeId || normalizeNodeId(e.target) === nodeId);
        }), searchKeyword));
      } else {
        // 使用mock数据作为备用
        const mockAllEdges = mockRelationData.map(rel => ({
          source: rel.sourceEvent,
          target: rel.targetEvent,
          relation: rel.relationType,
          query: rel.eventQuery
        }));
        
        // 随机隐藏30%的边
        const { visibleEdges, hidden } = randomHideEdges(mockAllEdges, 0.3);
        
        setGraphData({
          edges: visibleEdges,
          nodes: Object.values(mockEventDetails).map(event => ({
            id: event.id,
            detail: event.detail
          }))
        });
        setOriginalEdges(mockAllEdges);
        setHiddenEdges(hidden);
        setShowAllEdges(false); // 重置显示所有边的状态
        setShowCausalGraph(false); // 重置因果图状态
        setShowGraph(true);
        
        // 使用模拟数据计算统计信息
        calculateStatistics(filteredEvents, mockRelationData, Object.values(mockEventDetails));
        // 然后根据显示状态更新统计数据
        const mockNodes = Object.values(mockEventDetails).map(event => ({
          id: event.id,
          detail: event.detail
        }));
        setIntelligenceStats(buildStatsByDisplayedGraph(filteredEvents, visibleEdges, mockNodes.filter((n: any) => {
          const nodeId = normalizeNodeId(n.id);
          return visibleEdges.some((e: any) => normalizeNodeId(e.source) === nodeId || normalizeNodeId(e.target) === nodeId);
        }), searchKeyword));
      }
      
      setShowGraph(true);
    } catch (error) {
      console.error('获取事件关系数据失败:', error);
      // 错误处理，使用mock数据
      const mockAllEdges = mockRelationData.map(rel => ({
        source: rel.sourceEvent,
        target: rel.targetEvent,
        relation: rel.relationType,
        query: rel.eventQuery
      }));
      
      // 随机隐藏30%的边
      const { visibleEdges, hidden } = randomHideEdges(mockAllEdges, 0.3);
      
      setGraphData({
        edges: visibleEdges,
        nodes: Object.values(mockEventDetails).map(event => ({
          id: event.id,
          detail: event.detail
        }))
      });
      setOriginalEdges(mockAllEdges);
      setHiddenEdges(hidden);
      setShowAllEdges(false); // 重置显示所有边的状态
      setShowCausalGraph(false); // 重置因果图状态
      setShowGraph(true);
      
      // 使用模拟数据计算统计信息
      calculateStatistics(filteredEvents, mockRelationData, Object.values(mockEventDetails));
      // 然后根据显示状态更新统计数据
      const mockNodes = Object.values(mockEventDetails).map(event => ({
        id: event.id,
        detail: event.detail
      }));
      setIntelligenceStats(buildStatsByDisplayedGraph(filteredEvents, visibleEdges, mockNodes.filter((n: any) => {
        const nodeId = normalizeNodeId(n.id);
        return visibleEdges.some((e: any) => normalizeNodeId(e.source) === nodeId || normalizeNodeId(e.target) === nodeId);
      }), searchKeyword));
    } finally {
      setIsAggregating(false);
    }
  };

  // 导出图谱数据
  const exportGraphData = () => {
    // 模拟导出功能
    const link = document.createElement('a');
    const dataStr = JSON.stringify(graphData, null, 2);
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataStr);
    link.download = `event_relation_graph_${searchKeyword}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubEventClick = (subEvent: any, idx: number) => {
    const subKey = String(subEvent?.eid ?? subEvent?.id ?? idx);
    const lineIndex = lineMatchResult.subEventKeyToLine.get(subKey);
    if (lineIndex === undefined) return;

    setActiveLineIndex(lineIndex);
    const lineEl = contentLineRefs.current[lineIndex];
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const renderHighlightedContent = () => {
    const contentText = selectedContentText;
    const lines = contentText.split('\n');

    if (!contentText.trim()) {
      return <span>暂无正文</span>;
    }

    return lines.map((line, idx) => {
      const matchedEids = lineMatchResult.lineToEids.get(idx) || [];
      const isMatched = matchedEids.length > 0;
      const isActive = activeLineIndex === idx;
      return (
        <div
          key={`content-line-${idx}`}
          ref={(el) => {
            contentLineRefs.current[idx] = el;
          }}
          className={isMatched ? `rounded px-1 py-0.5 ${isActive ? 'bg-yellow-400/40 text-yellow-100 ring-1 ring-yellow-300/70' : 'bg-yellow-500/20 text-yellow-200'}` : ''}
        >
          <span>{line || ' '}</span>
          {isMatched && (
            <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
              {matchedEids.map((eidLabel) => (
                <span key={`${idx}-${eidLabel}`} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-200">
                  {eidLabel}
                </span>
              ))}
            </span>
          )}
        </div>
      );
    });
  };

  const handleViewReport = () => {
    const keywordForReport = String(selectedIntelligence?.query || searchKeyword || '').trim();
    if (!keywordForReport) {
      toast.warning('请先搜索相关关键词');
      return;
    }

    navigate(`/report-generation?keyword=${encodeURIComponent(keywordForReport)}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* 主内容区域 */}
      <main className="p-6">
        {/* 主要内容区 - 两列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* 左侧 - 筛选面板 */}
          <div className="lg:col-span-1 h-full">
            {/* <div className="bg-gray-800 rounded-lg p-4 mb-6"> */}
              {/* <h3 className="text-base font-medium mb-4">情报搜索</h3> */}
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
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              </div> */}
              
               {/* 搜索按钮 */}
               {/* <button 
                 className={`w-full py-2 rounded-md transition-colors ${
                   isAggregating 
                     ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                     : 'bg-blue-600 text-white hover:bg-blue-700'
                 }`}
                 onClick={() => handleSearch()}
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
            
            {/* 待聚合事件列表 */}
            <div className="bg-gray-800 rounded-lg p-4 h-full max-h-[520px] flex flex-col border border-gray-700">
              <h3 className="text-base font-medium mb-4">搜索结果</h3>
              
              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-2">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-md transition-colors cursor-pointer border ${selectedIntelligence?.id === event.id ? 'bg-blue-900/20 border-blue-600' : 'bg-gray-750 border-transparent hover:bg-gray-700'}`}
                      onClick={() => setSelectedIntelligence(event)}
                    >
                      <div className="flex items-start">
                        <h4 className="text-sm font-medium text-white mb-1 flex-grow">{event.name}</h4>
                        <span className={`px-2 py-0.5 ${event.levelColor} text-white text-xs rounded-full whitespace-nowrap`}>
                          {event.level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{event.content || event.description}</p>
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
                    <div className="text-4xl flex items-center justify-center mb-2">🔍</div>
                    <p>{needSearchFirst ? '请先至“情报筛选”界面搜索情报' : '事件提取中'}</p>
                  </div>
                )}
              </div>
              
              {/* 搜索结果提示 */}
              {isFilterApplied && (
                <div className="mt-3 p-2 bg-blue-600/20 text-blue-400 text-xs rounded-md text-center">
                  已匹配关键词 "{intelligenceStats.eventKeyword}"，显示 {filteredEvents.length} 条结果
                </div>
              )}
              
              {/* 重新聚合按钮 */}
              {/* {filteredEvents.length > 0 && (
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
                      <RefreshCw size={16} className="mr-2 animate-spin" /> 正在生成关系图谱...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" /> 重新聚合生成关系图谱
                    </>
                  )}
                </button>
              )} */}
            </div>
          </div>
          
          {/* 右侧 - 情报详情 */}
          <div className="lg:col-span-2 h-full">
            {/* 选中情报详情模块 */}
            <div className="bg-gray-800 max-h-80 rounded-lg p-4 border border-gray-700 h-full min-h-[520px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">情报详情</h3>
                <button
                  className="px-6 py-1 text-x1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  onClick={handleViewReport}
                >
                  查看分析报告
                </button>
              </div>

              {selectedIntelligence ? (
                <>
                  <h4 className="text-lg font-semibold text-white mb-3">{selectedIntelligence.name}</h4>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 text-xs">
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300">日期：{selectedIntelligence.time || '-'}</span>
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300">事件类型：{selectedIntelligence.type || '-'}</span>
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300">情报来源：{selectedIntelligence.sourceType || selectedIntelligence.source || '-'}</span>
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300">相关地区：{selectedIntelligence.region || '-'}</span>
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300">价值等级：{selectedIntelligence.level || '-'}</span>
                  </div>

                  <div className="bg-gray-750 rounded-md p-3 mb-3 text-sm text-gray-300 whitespace-pre-line break-words max-h-48 overflow-y-auto">
                    {renderHighlightedContent()}
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-2">提取事件</div>
                    {selectedIntelligence.events && selectedIntelligence.events.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedIntelligence.events.map((subEvent: any, idx: number) => (
                          <div
                            key={`${subEvent.eid || subEvent.id || idx}`}
                            className="bg-gray-750 rounded-md p-2 cursor-pointer hover:bg-gray-700 transition-colors"
                            onClick={() => handleSubEventClick(subEvent, idx)}
                          >
                            <div className="text-xs text-blue-300 mb-1">eid{subEvent.eid || subEvent.id || idx + 1}</div>
                            <div className="text-xs text-gray-300 whitespace-pre-line break-words">{subEvent.text || '暂无子事件描述'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">暂无相关子事件</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-x1 text-center text-gray-400">{needSearchFirst ? '请先至“情报筛选”界面搜索情报' : '点击左侧“搜索结果”中的情报项，可在此查看详情和提取出的相关事件。'}</div>
              )}
            </div>

           </div>
         </div>

        {/* 关系识别与统计（全宽布局，按上方 1:2 列宽分布） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-stretch max-h-[780px] ">
          {/* 左列：统计数据展示区域 */}
          <div className="lg:col-span-1 h-full">
            {showGraph ? (
              <StatsDisplay stats={intelligenceStats} />
            ) : (
              <div className="bg-gray-800 flex items-center justify-center rounded-lg p-6 text-x1 text-gray-400 border border-gray-700 h-full">
                统计数据将在完成“初步关系识别”后展示。
              </div>
            )}
          </div>

          {/* 右列：事件关系图谱容器 */}
          <div className="lg:col-span-2 h-full">
            {!showGraph ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center h-full border border-gray-700">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-medium text-gray-300 mb-2">事件关系图谱</h3>
                <p className="text-gray-400 mb-6">
                  点击下方"初步关系识别"按钮，系统将为您生成完整的事件关系网络
                </p>
                {searchKeyword && (
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center mx-auto"
                    onClick={reaggregateData}
                    disabled={isAggregating}
                  >
                    {isAggregating ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" /> 正在生成...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" /> 初步关系识别
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                {/* 图谱标题栏 */}
                <div className="bg-gray-800 rounded-t-lg p-4 flex justify-between items-center">
                  <div className='max-w-[80%]'>
                    <h3 className="text-base font-medium">{intelligenceStats.eventKeyword} 事件关系图谱</h3>
                  </div>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded flex items-center hover:bg-blue-700 transition-colors"
                    onClick={exportGraphData}
                  >
                    <Download size={14} className="mr-1" /> 导出图谱数据
                  </button>
                </div>

                {/* 事件关系图谱容器（双列） */}
                <div className="bg-gray-800 rounded-b-lg p-4 border border-gray-700 w-full">
                  {/* 图例说明 */}
                  <div className="bg-gray-750 rounded-md p-4 mb-4">
                    <h4 className="text-sm font-medium mb-3">关系类型说明</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(relationColors).map(([relation, color]) => (
                        <div key={relation} className="flex items-center">
                          <div className="w-3 h-3 mr-2" style={{ backgroundColor: color }}></div>
                          <div className="text-xs text-gray-300">{relationNames[relation as keyof typeof relationNames]}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* 左列：原图谱 */}
                    <div className="bg-gray-750 rounded-md p-3">
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <div className="text-sm text-gray-300">初步关系识别图谱（原图）</div>
                        <div className="flex items-center gap-2">
                          <button
                            className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center ${showAllEdges ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            onClick={() => {
                              setShowAllEdges((prev) => !prev);
                              setShowCausalGraph(false);
                            }}
                          >
                            <RefreshCw size={14} className="mr-1" /> {showAllEdges ? '隐藏深度结果' : '深度关系识别'}
                          </button>
                          <button
                            className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center ${showCausalGraph ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            onClick={() => {
                              setShowCausalGraph((prev) => !prev);
                              if (!showCausalGraph) {
                                setShowAllEdges(false);
                              }
                            }}
                          >
                            <RefreshCw size={14} className="mr-1" /> {showCausalGraph ? '关闭因果图' : '显示事件因果图'}
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-[600px] max-w-full max-h-[600px] overflow-hidden rounded-md">
                        <div
                          ref={chartRef}
                          style={{
                            userSelect: 'none',
                            height: '100%',
                            width: '100%',
                            maxHeight: '100%',
                            maxWidth: '100%'
                          }}
                        />
                      </div>
                    </div>

                    {/* 右列：深度/因果图谱 */}
                    <div className="bg-gray-750 rounded-md p-3">
                      <div className="text-sm text-gray-300 mb-2">
                        {showCausalGraph ? '事件因果图谱（右列）' : showAllEdges ? '深度关系识别图谱（右列）' : '深度关系识别/事件因果图谱（右列）'}
                      </div>
                      {(showAllEdges || showCausalGraph) ? (
                        <div className="w-full h-[600px] max-w-full max-h-[600px] overflow-hidden rounded-md">
                          <div
                            ref={chartRefEnhanced}
                            style={{
                              userSelect: 'none',
                              height: '100%',
                              width: '100%',
                              maxHeight: '100%',
                              maxWidth: '100%'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-[600px] flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-600 rounded-md">
                          点击“深度关系识别”或“显示事件因果图”，将在此展示对应图谱
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 可预测节点弹出框 */}
                  {showPredictablePopup && selectedPredictableNode && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                            <h3 className="text-lg font-medium text-white">可预测节点分析</h3>
                          </div>
                          <button className="text-gray-400 hover:text-white transition-colors" onClick={closePredictablePopup}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="p-4">
                          <div className="font-weight-bold text-lg text-purple-400 mb-4">
                            eid: {selectedPredictableNode.eid} <span className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full text-xs ml-2">可预测节点</span>
                          </div>

                          <div className="bg-gray-750 p-4 rounded-lg mb-4">
                            <div className="text-sm text-gray-300">{selectedPredictableNode.detail}</div>
                          </div>

                          <button
                            className="w-full py-2 bg-purple-900/30 text-purple-300 rounded-md hover:bg-purple-900/50 transition-colors flex items-center justify-center mb-4"
                            onClick={() => setShowPredictions(!showPredictions)}
                          >
                            {showPredictions ? '收起预测' : '展开预测'}
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-2 transition-transform ${showPredictions ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showPredictions && Array.isArray(selectedPredictableNode?.predictions) && (
                            <div className="bg-gray-750 p-4 rounded-lg">
                              <div className="text-sm font-medium text-purple-300 mb-3">
                                预测事件:
                              </div>

                              <ul className="space-y-3">
                                {selectedPredictableNode.predictions.map(
                                  (pred: any, index: number) => (
                                    <li key={index} className="flex justify-between items-start">
                                      <span className="text-sm text-gray-300">
                                        {index + 1}. {pred?.text || '-'}
                                      </span>
                                      <span className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full text-xs ml-2">
                                        {(() => {
                                          const raw = Number(pred?.accuracy);
                                          if (Number.isNaN(raw)) return '-';
                                          return `${raw <= 1 ? (raw * 100).toFixed(0) : raw.toFixed(0)}%`;
                                        })()}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
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
  
  // 随机隐藏指定比例的边的函数
  const randomHideEdges = (edges: any[], hideRatio: number = 0.3) => {
    // 复制原始边数组
    const edgesCopy = [...edges];
    
    // 随机打乱数组
    for (let i = edgesCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [edgesCopy[i], edgesCopy[j]] = [edgesCopy[j], edgesCopy[i]];
    }
    
    // 计算需要隐藏的边的数量
    const hiddenCount = Math.floor(edgesCopy.length * hideRatio);
    
    // 分割为可见边和隐藏边
    const hiddenEdges = edgesCopy.slice(0, hiddenCount);
    const visibleEdges = edgesCopy.slice(hiddenCount);
    
    return {
      visibleEdges,
      hidden: hiddenEdges
    };
  };

export default IntelligenceAggregationPage;