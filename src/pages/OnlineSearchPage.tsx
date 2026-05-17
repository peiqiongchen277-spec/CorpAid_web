import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Globe, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  eventReportExportPdf,
  eventReportGenerateReportOutlineSubmit,
  eventReportGenerateReportStart,
  eventReportGenerateReportStatus,
} from '@/lib/api/report';
import { findPassageByQuery } from '@/lib/api/passage';
import { SystemSettingsContext } from '@/contexts/systemSettingsContext';
import * as echarts from 'echarts';

const ONLINE_SEARCH_ACTIVE_JOB_KEY = 'onlineSearchActiveJob';

type ActiveJob = {
  jobId: string;
  topic: string;
  wordCount: string;
  selectedFormats: Array<'markdown' | 'html' | 'pdf'>;
  createdAt: string;
};

type PassageItem = {
  id: string | number;
  query: string;
  name: string;
  content: string;
  time: string;
  type: string;
  source: string;
  region: string;
  sourceType: string;
  level: string;
  levelColor: string;
  events: any[];
};

type ReportChartItem = {
  key: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | string;
  categories: string[];
  values: number[];
  palette?: string[];
  unit?: string;
};

type ReportChartData = {
  summary?: Record<string, any>;
  charts: ReportChartItem[];
};

const REPORT_BASE_STYLE = `
<style>
.report-root{font-family:Arial,"Microsoft YaHei",sans-serif;line-height:1.7;color:#0f172a;padding:24px;max-width:1100px;margin:0 auto;background:#fff;}
.report-root h1,.report-root h2,.report-root h3,.report-root h4{color:#0f172a;}
.report-root table{border-collapse:collapse;width:100%;margin:12px 0 18px 0;}
.report-root th,.report-root td{border:1px solid #cbd5e1;padding:8px 10px;font-size:13px;text-align:left;}
.report-root th{background:#f1f5f9;}
.report-root .data-appendix{margin-top:28px;padding-top:8px;border-top:2px solid #e2e8f0;}
.report-root .data-appendix h2{margin-bottom:8px;}
.report-root .data-appendix p{color:#334155;font-size:14px;}
.report-root .chart-container{width:100%;height:360px;margin:8px 0 20px 0;border:1px solid #e2e8f0;border-radius:8px;background:#fff;}
.report-root .reference-appendix{margin-top:28px;padding-top:8px;border-top:2px solid #e2e8f0;}
.report-root .reference-appendix h2{margin-bottom:8px;}
.report-root .reference-appendix p{color:#334155;font-size:14px;}
.report-root .reference-list{margin:0;padding-left:18px;}
.report-root .reference-list li{margin:10px 0;line-height:1.5;}
.report-root .reference-list a{color:#0ea5e9;text-decoration:none;}
.report-root .reference-list a:hover{text-decoration:underline;}
.report-root .reference-list .ref-url{font-size:12px;color:#64748b;word-break:break-all;margin-top:2px;}
</style>
`;

const sourceTypeLabelMap: Record<number, string> = {
  0: '政府公报',
  1: '公开新闻',
  2: '社交媒体',
  3: '内部情报',
  4: '专家分析'
};

const OnlineSearchPage: React.FC = () => {
  const { systemSettings } = useContext(SystemSettingsContext);
  const [searchParams] = useSearchParams();

  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState('2000');
  const [selectedFormats, setSelectedFormats] = useState<Array<'markdown' | 'html' | 'pdf'>>(['markdown']);
  const [loading, setLoading] = useState(false);
  const [markdownReport, setMarkdownReport] = useState('');
  const [htmlReport, setHtmlReport] = useState('');
  const [reportChartData, setReportChartData] = useState<ReportChartData>({ charts: [] });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<PassageItem[]>([]);
  const [selectedIntelligence, setSelectedIntelligence] = useState<PassageItem | null>(null);
  const [selectedPassageIds, setSelectedPassageIds] = useState<Array<string | number>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [needSearchFirst, setNeedSearchFirst] = useState(false);
  const hasPromptedNeedSearchRef = useRef(false);
  const isMountedRef = useRef(true);
  const pollingJobIdRef = useRef<string | null>(null);
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const [outlineTitles, setOutlineTitles] = useState<string[]>([]);
  const [outlineDesignPlan, setOutlineDesignPlan] = useState('');
  const [outlineJobId, setOutlineJobId] = useState('');
  const [outlineSubmitting, setOutlineSubmitting] = useState(false);
  const htmlPreviewRef = useRef<HTMLDivElement | null>(null);
  const chartInstancesRef = useRef<echarts.ECharts[]>([]);

  const searchParamsKey = searchParams.toString();

  const selectedPrivatePassages = useMemo(() => {
    const selectedSet = new Set(selectedPassageIds.map((id) => String(id)));
    return filteredEvents
      .filter((item) => selectedSet.has(String(item.id)))
      .map((item) => ({
        id: item.id,
        query: item.query,
        name: item.name,
        content: item.content,
        time: item.time,
        type: item.type,
        source: item.source,
        region: item.region,
        sourceType: item.sourceType,
        level: item.level,
        events: item.events,
      }));
  }, [filteredEvents, selectedPassageIds]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const saveActiveJob = (job: ActiveJob) => {
    localStorage.setItem(ONLINE_SEARCH_ACTIVE_JOB_KEY, JSON.stringify(job));
  };

  const getActiveJob = (): ActiveJob | null => {
    try {
      const raw = localStorage.getItem(ONLINE_SEARCH_ACTIVE_JOB_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.jobId) {
        return null;
      }
      return parsed as ActiveJob;
    } catch {
      return null;
    }
  };

  const clearActiveJob = () => {
    localStorage.removeItem(ONLINE_SEARCH_ACTIVE_JOB_KEY);
  };

  const normalizeOutlineTitles = (titles: unknown, outlineText: unknown): string[] => {
    if (Array.isArray(titles)) {
      const cleaned = titles.map((item) => String(item || '').trim()).filter(Boolean);
      if (cleaned.length > 0) {
        return cleaned;
      }
    }

    const text = String(outlineText || '').trim();
    if (!text) {
      return ['标题', '报告概述', '预期标题清单'];
    }

    const lines = text
      .split('\n')
      .map((line) => String(line || '').replace(/^#{1,6}\s*/, '').replace(/^[-*+]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 20);

    return lines.length > 0 ? lines : ['标题', '报告概述', '预期标题清单'];
  };

  const normalizeDesignPlan = (designPlan: unknown): string => {
    if (typeof designPlan === 'string') {
      return designPlan.trim();
    }
    if (designPlan === null || designPlan === undefined) {
      return '';
    }
    try {
      return JSON.stringify(designPlan, null, 2);
    } catch {
      return String(designPlan);
    }
  };

  const extractStyleDesignPlan = (designPlan: unknown, stylePlan: unknown): string => {
    const styleText = normalizeDesignPlan(stylePlan);
    if (styleText) {
      return styleText;
    }

    const fullText = normalizeDesignPlan(designPlan);
    if (!fullText) {
      return '';
    }

    const sectionPattern = /\[(整体风格|版式规范|字体与字号规范|颜色与主题规范)\]\s*([\s\S]*?)(?=\n\[(整体风格|版式规范|字体与字号规范|颜色与主题规范|图表设计与插入位置|导出与打印建议)\]|$)/g;
    const sections: string[] = [];
    let match: RegExpExecArray | null = sectionPattern.exec(fullText);
    while (match) {
      const name = String(match[1] || '').trim();
      const content = String(match[2] || '').trim();
      if (name && content) {
        sections.push(`[${name}]\n${content}`);
      }
      match = sectionPattern.exec(fullText);
    }

    return sections.length > 0 ? sections.join('\n\n') : fullText;
  };

  const toggleFormat = (formatKey: 'markdown' | 'html' | 'pdf') => {
    setSelectedFormats((prev) => {
      if (prev.includes(formatKey)) {
        return prev.filter((item) => item !== formatKey);
      }
      return [...prev, formatKey];
    });
  };

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const downloadBlobFile = (blob: Blob, filename: string) => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const base64ToBlob = (base64Data: string, contentType: string): Blob => {
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: contentType });
  };

  const buildStyledHtml = (htmlFragment: string) => {
    return `${REPORT_BASE_STYLE}${String(htmlFragment || '')}`;
  };

  const buildStandaloneHtmlForDownload = (htmlFragment: string, chartData: ReportChartData) => {
    const dataJson = JSON.stringify(chartData || { charts: [] }).replace(/</g, '\\u003c');
    return `<!doctype html><html><head><meta charset="utf-8" />${REPORT_BASE_STYLE}</head><body>${String(htmlFragment || '')}
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<script>
(function(){
  function buildOption(chart){
    var colors = Array.isArray(chart.palette) && chart.palette.length ? chart.palette : ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4'];
    var unit = chart.unit || '';
    if ((chart.type || 'bar') === 'pie') {
      var pieData = (chart.categories || []).map(function(c, i){ return {name: c, value: (chart.values || [])[i] || 0}; });
      return {
        color: colors,
        tooltip: { trigger: 'item', formatter: '{b}: {c}' + unit + ' ({d}%)' },
        legend: { bottom: 0 },
        series: [{ type: 'pie', radius: ['38%','68%'], data: pieData, label: { formatter: '{b}: {d}%' } }]
      };
    }
    return {
      color: colors,
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 40, bottom: 70 },
      xAxis: { type: 'category', data: chart.categories || [], axisLabel: { rotate: 20 } },
      yAxis: { type: 'value', axisLabel: { formatter: unit ? '{value}' + unit : '{value}' } },
      series: [{ type: (chart.type === 'line' ? 'line' : 'bar'), data: chart.values || [], smooth: chart.type === 'line', areaStyle: chart.type === 'line' ? {} : undefined }]
    };
  }
  var payload = ${dataJson};
  var chartMap = {};
  (payload && payload.charts || []).forEach(function(c){ chartMap[c.key] = c; });
  document.querySelectorAll('.chart-container[data-chart-key]').forEach(function(el){
    var key = el.getAttribute('data-chart-key') || '';
    var chart = chartMap[key];
    if(!chart || !Array.isArray(chart.categories) || !Array.isArray(chart.values)){ return; }
    var inst = echarts.init(el);
    inst.setOption(buildOption(chart));
  });
})();
</script></body></html>`;
  };

  const buildChartOption = (chart: ReportChartItem, disableAnimation: boolean = false): echarts.EChartsOption => {
    const colors = Array.isArray(chart.palette) && chart.palette.length > 0
      ? chart.palette
      : ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
    const unit = String(chart.unit || '');

    if (chart.type === 'pie') {
      return {
        animation: !disableAnimation,
        color: colors,
        tooltip: {
          trigger: 'item',
          formatter: `{b}: {c}${unit} ({d}%)`,
        },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['38%', '68%'],
          animation: !disableAnimation,
          data: chart.categories.map((name, idx) => ({
            name,
            value: Number(chart.values[idx] ?? 0),
          })),
          label: { formatter: '{b}: {d}%' },
        }],
      };
    }

    return {
      animation: !disableAnimation,
      color: colors,
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 40, bottom: 70 },
      xAxis: {
        type: 'category',
        data: chart.categories,
        axisLabel: { rotate: chart.categories.length > 5 ? 28 : 12 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: unit ? `{value}${unit}` : '{value}',
        },
      },
      series: [{
        type: chart.type === 'line' ? 'line' : 'bar',
        data: chart.values,
        animation: !disableAnimation,
        smooth: chart.type === 'line',
        areaStyle: chart.type === 'line' ? {} : undefined,
        barMaxWidth: chart.type === 'bar' ? 42 : undefined,
      }],
    };
  };

  const renderChartsToRoot = (
    root: HTMLElement,
    chartData: ReportChartData,
    disableAnimation: boolean = false,
  ): echarts.ECharts[] => {
    const chartMap = new Map<string, ReportChartItem>();
    (chartData?.charts || []).forEach((item) => {
      if (item?.key) {
        chartMap.set(item.key, item);
      }
    });

    const created: echarts.ECharts[] = [];
    const nodes = root.querySelectorAll<HTMLElement>('.chart-container[data-chart-key]');
    nodes.forEach((el) => {
      const key = String(el.getAttribute('data-chart-key') || '').trim();
      const chart = chartMap.get(key);
      if (!chart || !Array.isArray(chart.categories) || !Array.isArray(chart.values)) {
        return;
      }
      const ins = echarts.init(el);
      ins.setOption(buildChartOption(chart, disableAnimation), true);
      created.push(ins);
    });
    return created;
  };

  const buildPdfReadyHtml = async (htmlFragment: string, chartData: ReportChartData) => {
    const tempWrapper = document.createElement('div');
    tempWrapper.style.position = 'fixed';
    tempWrapper.style.left = '-100000px';
    tempWrapper.style.top = '0';
    tempWrapper.style.width = '794px';
    tempWrapper.style.background = '#ffffff';
    tempWrapper.style.color = '#000000';
    tempWrapper.style.padding = '24px';
    tempWrapper.style.boxSizing = 'border-box';
    tempWrapper.innerHTML = buildStyledHtml(htmlFragment);

    document.body.appendChild(tempWrapper);
    const chartInstances = renderChartsToRoot(tempWrapper, chartData, true);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    chartInstances.forEach((ins) => {
      ins.resize();
      const dom = ins.getDom() as HTMLElement;
      const dataUrl = ins.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = String(dom.getAttribute('data-chart-key') || 'chart');
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '8px 0 20px 0';
      dom.replaceWith(img);
    });

    chartInstances.forEach((ins) => ins.dispose());
    const readyHtml = `<!doctype html><html><head><meta charset="utf-8" />${REPORT_BASE_STYLE}</head><body>${tempWrapper.innerHTML}</body></html>`;
    document.body.removeChild(tempWrapper);
    return readyHtml;
  };

  const handleSearchPassages = async (keyword: string) => {
    const finalKeyword = String(keyword || '').trim();
    if (!finalKeyword) {
      setFilteredEvents([]);
      setSelectedIntelligence(null);
      return;
    }

    setIsSearching(true);
    try {
      const response = await findPassageByQuery(finalKeyword);
      if (response?.data) {
        const mappedEvents: PassageItem[] = response.data.map((event: any) => {
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
        setFilteredEvents(mappedEvents);
        setSelectedIntelligence(mappedEvents[0] || null);
        setSelectedPassageIds([]);
      } else {
        setFilteredEvents([]);
        setSelectedIntelligence(null);
        setSelectedPassageIds([]);
      }
    } catch (error) {
      console.error('联网检索页面加载搜索结果失败:', error);
      setFilteredEvents([]);
      setSelectedIntelligence(null);
      setSelectedPassageIds([]);
      toast.error('加载搜索结果失败，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const togglePassageSelection = (passageId: string | number) => {
    setSelectedPassageIds((prev) => {
      const idStr = String(passageId);
      const exists = prev.some((id) => String(id) === idStr);
      if (exists) {
        return prev.filter((id) => String(id) !== idStr);
      }
      return [...prev, passageId];
    });
  };

  const applyCompletedResult = (
    finalTopic: string,
    resultData: any,
    selectedFormatsFromJob: Array<'markdown' | 'html' | 'pdf'>
  ) => {
    const markdownContent = String(resultData?.markdown || resultData?.final_report || '');
    const htmlContent = String(resultData?.html || '');
    const chartData: ReportChartData = {
      charts: Array.isArray(resultData?.chart_data?.charts) ? resultData.chart_data.charts : [],
      summary: resultData?.chart_data?.summary || {},
    };
    const downloadableHtml = buildStandaloneHtmlForDownload(htmlContent, chartData);

    if (!markdownContent) {
      toast.warning('报告内容为空，请调整请求后重试');
      return;
    }

    const safeTopic = finalTopic.replace(/[\\/:*?"<>|]/g, '_').trim() || 'report';
    const fileDate = new Date().toISOString().slice(0, 10);
    const selectedSet = new Set(selectedFormatsFromJob);

    if (selectedSet.has('markdown')) {
      downloadTextFile(markdownContent, `${safeTopic}_调研报告_${fileDate}.md`, 'text/markdown;charset=utf-8');
    }

    if (selectedSet.has('html')) {
      if (htmlContent) {
        downloadTextFile(downloadableHtml, `${safeTopic}_调研报告_${fileDate}.html`, 'text/html;charset=utf-8');
      } else {
        toast.warning('已勾选HTML格式，但HTML内容为空');
      }
    }

    if (selectedSet.has('pdf')) {
      if (htmlContent) {
        void exportHtmlReportToPDF(htmlContent, finalTopic, true, chartData);
      } else {
        toast.warning('已勾选PDF格式，但HTML内容为空，无法导出PDF');
      }
    }

    if (!isMountedRef.current) {
      return;
    }

    setMarkdownReport(markdownContent);
    setHtmlReport(htmlContent);
    setReportChartData(chartData);
    toast.success('联网检索报告生成成功，已按所选格式自动下载');
  };

  const pollJobUntilDone = async (job: ActiveJob) => {
    const maxPollCount = 120;
    const pollIntervalMs = 3000;
    let lastStatus = '';

    try {
      for (let i = 0; i < maxPollCount; i++) {
        if (!isMountedRef.current) {
          return;
        }

        const statusResp: any = await eventReportGenerateReportStatus(job.jobId);
        const statusData = statusResp?.data;
        const status = String(statusData?.status || '').toLowerCase();
        lastStatus = status;

        if (status === 'completed') {
          clearActiveJob();
          applyCompletedResult(job.topic, statusData?.result || null, job.selectedFormats);
          return;
        }

        if (status === 'outline_completed') {
          const nextTitles = normalizeOutlineTitles(statusData?.outline_titles, statusData?.outline_text);
          const nextDesignPlan = extractStyleDesignPlan(statusData?.design_plan, statusData?.design_style_plan);
          if (isMountedRef.current) {
            setOutlineTitles(nextTitles);
            setOutlineDesignPlan(nextDesignPlan);
            setOutlineJobId(job.jobId);
            setShowOutlineModal(true);
            setLoading(false);
            toast.info('大纲规划已完成，请确认是否修改后点击继续生成');
          }
          return;
        }

        if (status === 'failed') {
          clearActiveJob();
          toast.error(String(statusData?.error || '报告生成失败'));
          return;
        }

        await sleep(pollIntervalMs);
      }

      toast.error(`报告生成超时，当前状态：${lastStatus || 'unknown'}`);
    } finally {
      if (pollingJobIdRef.current === job.jobId) {
        pollingJobIdRef.current = null;
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const keywordFromUrl = String(searchParams.get('keyword') || '').trim();
    const fallback = String(localStorage.getItem('lastQuery') || localStorage.getItem('homeLastQuery') || '').trim();
    const keywordForSearch = keywordFromUrl || fallback;

    if (!keywordForSearch) {
      setNeedSearchFirst(true);
      setSearchKeyword('');
      setFilteredEvents([]);
      setSelectedIntelligence(null);
      if (!hasPromptedNeedSearchRef.current) {
        toast.warning('请先至“情报筛选”界面搜索情报');
        hasPromptedNeedSearchRef.current = true;
      }
    } else {
      setNeedSearchFirst(false);
      hasPromptedNeedSearchRef.current = false;
      setSearchKeyword(keywordForSearch);
      void handleSearchPassages(keywordForSearch);
    }

    if (keywordFromUrl) {
      setTopic(keywordFromUrl);
    } else {
      if (fallback) {
        setTopic(fallback);
      }
    }

    const activeJob = getActiveJob();
    if (activeJob?.jobId) {
      setTopic(activeJob.topic || keywordFromUrl);
      setWordCount(activeJob.wordCount || '2000');
      setSelectedFormats(
        Array.isArray(activeJob.selectedFormats) && activeJob.selectedFormats.length > 0
          ? activeJob.selectedFormats
          : ['markdown']
      );
      if (pollingJobIdRef.current !== activeJob.jobId) {
        pollingJobIdRef.current = activeJob.jobId;
        setLoading(true);
        toast.info('检测到进行中的报告任务，正在恢复轮询...');
        void pollJobUntilDone(activeJob).finally(() => {
          if (isMountedRef.current && pollingJobIdRef.current === null) {
            setLoading(false);
          }
        });
      }
    };
  }, [searchParamsKey]);

  const updateOutlineTitle = (index: number, value: string) => {
    setOutlineTitles((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const removeOutlineTitle = (index: number) => {
    setOutlineTitles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addOutlineTitle = () => {
    setOutlineTitles((prev) => [...prev, '']);
  };

  const submitOutlineAndContinue = async () => {
    const jobId = String(outlineJobId || '').trim();
    if (!jobId) {
      toast.error('缺少任务ID，无法提交大纲');
      return;
    }

    const cleanedTitles = outlineTitles.map((item) => String(item || '').trim()).filter(Boolean);
    if (cleanedTitles.length === 0) {
      toast.warning('请至少保留一个章节标题');
      return;
    }

    setOutlineSubmitting(true);
    try {
      await eventReportGenerateReportOutlineSubmit({
        job_id: jobId,
        outline_titles: cleanedTitles,
        ...(outlineDesignPlan.trim() ? { design_plan: outlineDesignPlan.trim() } : {}),
        ...(selectedPrivatePassages.length > 0 ? { private_data_json: selectedPrivatePassages } : {}),
      });

      setShowOutlineModal(false);
      setLoading(true);

      const activeJob = getActiveJob();
      const resumeJob: ActiveJob = activeJob?.jobId === jobId
        ? { ...activeJob, selectedFormats: activeJob.selectedFormats || ['markdown'] }
        : {
            jobId,
            topic: String(topic || '').trim(),
            wordCount: String(wordCount || '').trim() || '2000',
            selectedFormats: selectedFormats.length > 0 ? selectedFormats : ['markdown'],
            createdAt: new Date().toISOString(),
          };

      saveActiveJob(resumeJob);
      pollingJobIdRef.current = jobId;
      toast.info('已提交新大纲，继续生成完整报告...');

      await pollJobUntilDone(resumeJob);
    } catch (error) {
      console.error('提交大纲失败:', error);
      toast.error('提交大纲失败，请重试');
    } finally {
      setOutlineSubmitting(false);
      if (isMountedRef.current && pollingJobIdRef.current === null) {
        setLoading(false);
      }
    }
  };

  const handleGenerate = async () => {
    if (loading) {
      toast.info('当前已有生成任务在进行中，请稍候');
      return;
    }

    const finalTopic = String(topic || '').trim();
    const finalWordCount = String(wordCount || '').trim();
    const finalSelectedFormats = selectedFormats;

    if (!finalTopic) {
      toast.warning('请输入查询主题');
      return;
    }
    if (!finalWordCount) {
      toast.warning('请输入字数');
      return;
    }
    if (!Array.isArray(finalSelectedFormats) || finalSelectedFormats.length === 0) {
      toast.warning('请至少勾选一种格式要求');
      return;
    }

    const formatLabelMap: Record<'markdown' | 'html' | 'pdf', string> = {
      markdown: 'markdown格式',
      html: 'html格式',
      pdf: 'pdf格式',
    };
    const finalFormatText = finalSelectedFormats.map((item) => formatLabelMap[item]).join('、');

    const prompt = `生成一份关于${finalTopic}的调研报告，${finalWordCount}字，${finalFormatText}`;
    const payload: { prompt: string; private_data_json?: unknown } = { prompt };
    if (selectedPrivatePassages.length > 0) {
      payload.private_data_json = selectedPrivatePassages;
    }

    setLoading(true);
    setOutlineDesignPlan('');
    try {
      const startResp: any = await eventReportGenerateReportStart(payload);
      const jobId = String(startResp?.data?.job_id || '').trim();
      if (!jobId) {
        toast.error('报告任务创建失败，未获取到任务ID');
        return;
      }

      toast.info('报告生成任务已提交，正在轮询进度...');

      const activeJob: ActiveJob = {
        jobId,
        topic: finalTopic,
        wordCount: finalWordCount,
        selectedFormats: finalSelectedFormats,
        createdAt: new Date().toISOString(),
      };
      saveActiveJob(activeJob);
      pollingJobIdRef.current = jobId;

      setSelectedFormats(finalSelectedFormats);

      await pollJobUntilDone(activeJob);
    } catch (error) {
      console.error('联网检索报告生成失败:', error);
      toast.error('联网检索报告生成失败，请稍后重试');
      clearActiveJob();
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const exportHtmlReportToPDF = async (
    htmlContentInput?: string,
    topicInput?: string,
    silent: boolean = false,
    chartDataInput?: ReportChartData,
  ) => {
    const targetHtml = String(htmlContentInput ?? htmlReport ?? '');
    const targetTopic = String(topicInput ?? topic ?? '');
    const targetChartData = chartDataInput ?? reportChartData;

    if (!targetHtml) {
      toast.warning('当前暂无HTML报告可导出');
      return;
    }

    try {
      if (!silent) {
        toast.info('正在导出PDF，请稍候...');
      }

      const pdfReadyHtml = await buildPdfReadyHtml(targetHtml, targetChartData);

      const safeTopic = String(targetTopic || 'report').replace(/[\\/:*?"<>|]/g, '_').trim() || 'report';
      const fileDate = new Date().toISOString().slice(0, 10);

      const exportResp: any = await eventReportExportPdf({
        html_content: pdfReadyHtml,
        file_name: `${safeTopic}_调研报告_${fileDate}.pdf`,
      });
      const pdfBase64 = String(exportResp?.data?.pdf_base64 || '');
      const serverFileName = String(exportResp?.data?.file_name || `${safeTopic}_调研报告_${fileDate}.pdf`);

      if (!pdfBase64) {
        toast.error('PDF导出失败：服务端未返回有效PDF数据');
        return;
      }

      const pdfBlob = base64ToBlob(pdfBase64, 'application/pdf');
      downloadBlobFile(pdfBlob, serverFileName);
      if (!silent) {
        toast.success('PDF导出成功');
      }
    } catch (error) {
      console.error('导出PDF失败:', error);
      toast.error('导出PDF失败，请稍后重试');
    }
  };

  useEffect(() => {
    const root = htmlPreviewRef.current;
    if (!root) {
      return;
    }

    chartInstancesRef.current.forEach((ins) => ins.dispose());
    chartInstancesRef.current = [];

    if (!htmlReport) {
      root.innerHTML = '';
      return;
    }

    root.innerHTML = buildStyledHtml(htmlReport);
    chartInstancesRef.current = renderChartsToRoot(root, reportChartData);

    return () => {
      chartInstancesRef.current.forEach((ins) => ins.dispose());
      chartInstancesRef.current = [];
    };
  }, [htmlReport, reportChartData]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="p-6 ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-1 h-full">
            <div className="bg-gray-800 rounded-lg p-4 h-full max-h-[520px] flex flex-col border border-gray-700">
              <h3 className="text-base font-medium mb-4">搜索结果</h3>

              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-2">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-md transition-colors cursor-pointer border ${selectedIntelligence?.id === event.id ? 'bg-blue-900/20 border-blue-600' : 'bg-gray-750 border-transparent hover:bg-gray-700'}`}
                      onClick={() => {
                        setSelectedIntelligence(event);
                        setTopic(String(event.query || '').trim());
                        togglePassageSelection(event.id);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedPassageIds.some((id) => String(id) === String(event.id))}
                          onChange={(e) => {
                            e.stopPropagation();
                            togglePassageSelection(event.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 h-4 w-4 rounded border-gray-500 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <h4 className="text-sm font-medium text-white mb-1 flex-grow">{event.name}</h4>
                        <span className={`px-2 py-0.5 ${event.levelColor} text-white text-xs rounded-full whitespace-nowrap`}>
                          {event.level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{event.content}</p>
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
                    <p>{needSearchFirst ? '请先至“情报筛选”界面搜索情报' : (isSearching ? '加载中...' : '暂无搜索结果')}</p>
                  </div>
                )}
              </div>

              {!!searchKeyword && filteredEvents.length > 0 && (
                <div className="mt-3 p-2 bg-blue-600/20 text-blue-400 text-xs rounded-md text-center">
                  已匹配关键词 "{searchKeyword}"，显示 {filteredEvents.length} 条结果
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center mb-4">
                <Globe size={18} className="mr-2 text-emerald-400" />
                <h2 className="text-lg font-medium">联网检索</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">查询主题</label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="例如：全球半导体产业链韧性"
                    className="w-full p-3 bg-gray-750 border border-gray-600 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">字数</label>
                  <input
                    type="number"
                    min={1}
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    placeholder="例如：2000"
                    className="w-full p-3 bg-gray-750 border border-gray-600 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">格式要求</label>
                  <div className="w-full p-3 bg-gray-750 border border-gray-600 rounded-md text-sm">
                    <div className="flex flex-wrap gap-4">
                      <label className="inline-flex items-center gap-2 text-gray-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFormats.includes('markdown')}
                          onChange={() => toggleFormat('markdown')}
                          className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        markdown格式
                      </label>
                      <label className="inline-flex items-center gap-2 text-gray-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFormats.includes('html')}
                          onChange={() => toggleFormat('html')}
                          className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        html格式
                      </label>
                      <label className="inline-flex items-center gap-2 text-gray-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFormats.includes('pdf')}
                          onChange={() => toggleFormat('pdf')}
                          className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        pdf格式
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    可选：私有数据（勾选左侧情报后自动生成）
                  </label>
                  <div className="w-full p-3 bg-gray-750 border border-gray-600 rounded-md min-h-[110px]">
                    {selectedPrivatePassages.length > 0 ? (
                      <>
                        <div className="text-xs text-emerald-400 mb-2">已选择 {selectedPrivatePassages.length} 条情报</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedPrivatePassages.map((item) => (
                            <span
                              key={`private-${item.id}`}
                              className="px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-300 text-xs"
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">请在左侧“搜索结果”中勾选需要注入的情报数据</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                      loading
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" /> 生成中...
                      </>
                    ) : (
                      <>
                        <Globe size={16} className="mr-2" /> 确认并生成
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {markdownReport && (
              <div className="bg-gray-800 rounded-lg border border-emerald-600/30 p-4">
                <h3 className="text-base font-medium text-emerald-400 mb-3 flex items-center">
                  <Globe size={16} className="mr-2" /> 联网检索生成报告
                </h3>
                <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">{markdownReport}</pre>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-emerald-300 mb-2">HTML报告预览</h4>
                  <div className="bg-white rounded-md h-[70vh] overflow-auto border border-gray-700">
                    {htmlReport ? (
                      <div ref={htmlPreviewRef} className="w-full min-h-full" />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        HTML报告为空，请查看已下载的Markdown文件。
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showOutlineModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">大纲规划已完成，请修改关键内容</h3>
              <button
                onClick={() => setShowOutlineModal(false)}
                disabled={outlineSubmitting}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-auto">
              <div className="mb-4 rounded-lg border border-gray-700 bg-gray-900/60 p-3">
                <div className="text-sm font-medium text-emerald-300 mb-2">可视化设计方案（Designer）</div>
                <textarea
                  value={outlineDesignPlan}
                  onChange={(e) => setOutlineDesignPlan(e.target.value)}
                  className="w-full p-2.5 bg-gray-750 border border-gray-600 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm min-h-[180px]"
                  placeholder="请补充或修改可视化风格方案"
                  disabled={outlineSubmitting}
                />
                <div className="mt-2 text-xs text-gray-400">仅展示并编辑 design_plan 中的风格相关模块，提交后将作为新的可视化设计方案参与后续生成。</div>
              </div>

              {outlineTitles.map((title, index) => (
                <div key={`outline-${index}`} className="flex items-start gap-2">
                  <span className="text-sm text-gray-400 w-10 text-right pt-2">{index + 1}.</span>
                  <textarea
                    value={title}
                    onChange={(e) => updateOutlineTitle(index, e.target.value)}
                    className="flex-1 p-2.5 bg-gray-750 border border-gray-600 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    placeholder="请输入模块内容"
                    rows={index === 2 ? 8 : 3}
                  />
                  <button
                    onClick={() => removeOutlineTitle(index)}
                    disabled={outlineSubmitting || outlineTitles.length <= 1}
                    className="px-2 py-1.5 text-xs rounded bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50 mt-1"
                  >
                    删除
                  </button>
                </div>
              ))}

              <button
                onClick={addOutlineTitle}
                disabled={outlineSubmitting}
                className="px-3 py-2 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                + 新增章节
              </button>
            </div>

            <div className="px-5 py-4 border-t border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowOutlineModal(false)}
                disabled={outlineSubmitting}
                className="px-4 py-2 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={submitOutlineAndContinue}
                disabled={outlineSubmitting}
                className="px-4 py-2 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {outlineSubmitting ? '提交中...' : '确认并继续生成'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default OnlineSearchPage;
