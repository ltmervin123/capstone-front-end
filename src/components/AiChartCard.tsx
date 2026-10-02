import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Sparkles, Loader2 } from 'lucide-react';

export interface ChartMetric {
  label: string;
  value: string | number;
}

export interface ChartConfig {
  type: 'bar' | 'donut' | 'pie' | 'line';
  title: string;
  description?: string;
  metrics?: ChartMetric[];
  xAxisKey?: string;
  yAxisKey?: string;
  data: Record<string, string | number | undefined>[];
}

const NMC_PALETTE = [
  '#14532d', // NMC Forest Green
  '#eab308', // Warm Gold
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f43f5e', // Coral Rose
  '#0284c7', // Sky Blue
  '#a855f7', // Purple
  '#f97316', // Orange
  '#15803d', // Leaf Green
  '#ca8a04', // Deep Gold
];

interface AiChartCardProps {
  rawContent: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    fill?: string;
    payload?: { name?: string; category?: string };
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0];
    const displayLabel = label || dataItem.name || dataItem.payload?.name || dataItem.payload?.category;
    const value = dataItem.value;

    return (
      <div className="bg-white/95 backdrop-blur-md border border-green-100 shadow-xl rounded-2xl p-3 text-xs pointer-events-none">
        {displayLabel && (
          <p className="font-black text-green-950 text-[11px] mb-1">{displayLabel}</p>
        )}
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: dataItem.color || dataItem.fill || '#14532d' }}
          />
          <span className="font-bold text-gray-600">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const AiChartCard: React.FC<AiChartCardProps> = ({ rawContent }) => {
  const { config, isStreamingError } = useMemo(() => {
    try {
      // Strip potential enclosing code markers or whitespace
      let clean = rawContent.trim();
      if (clean.startsWith('```json:chart')) {
        clean = clean.replace(/^```json:chart\s*/i, '');
      } else if (clean.startsWith('```chart')) {
        clean = clean.replace(/^```chart\s*/i, '');
      }
      if (clean.endsWith('```')) {
        clean = clean.slice(0, -3).trim();
      }

      const parsed = JSON.parse(clean) as ChartConfig;
      if (!parsed || !Array.isArray(parsed.data)) {
        return { config: null, isStreamingError: false };
      }
      return { config: parsed, isStreamingError: false };
    } catch {
      // JSON is likely still streaming or incomplete
      return { config: null, isStreamingError: true };
    }
  }, [rawContent]);

  if (isStreamingError) {
    return (
      <div className="my-4 p-4 rounded-2xl bg-green-50/80 border border-green-200/80 animate-pulse flex items-center gap-3">
        <Loader2 className="animate-spin text-green-800" size={16} />
        <span className="text-xs font-bold text-green-900 tracking-wide">
          Compiling NMC-HR visual analytics...
        </span>
      </div>
    );
  }

  if (!config) {
    // If not valid chart config, return raw content as fallback
    return (
      <pre className="p-3 bg-gray-100 rounded-xl text-xs overflow-x-auto">
        <code>{rawContent}</code>
      </pre>
    );
  }

  const { type, title, description, metrics, data, xAxisKey, yAxisKey } = config;

  // Determine key names safely
  const sample = data[0] || {};
  const effectiveXKey =
    xAxisKey ||
    ('category' in sample
      ? 'category'
      : 'name' in sample
      ? 'name'
      : 'department' in sample
      ? 'department'
      : Object.keys(sample)[0]);

  const effectiveYKey =
    yAxisKey ||
    ('value' in sample
      ? 'value'
      : 'count' in sample
      ? 'count'
      : Object.keys(sample).find((k) => typeof sample[k] === 'number') || Object.keys(sample)[1]);

  const getChartIcon = () => {
    switch (type) {
      case 'donut':
      case 'pie':
        return <PieIcon size={16} className="text-yellow-500" />;
      case 'line':
        return <TrendingUp size={16} className="text-yellow-500" />;
      default:
        return <BarChart3 size={16} className="text-yellow-500" />;
    }
  };

  return (
    <div className="my-5 bg-white rounded-3xl border border-gray-150 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-900 rounded-xl flex items-center justify-center">
              {getChartIcon()}
            </div>
            <h4 className="text-sm font-black text-green-950 uppercase tracking-tight">
              {title}
            </h4>
          </div>
          {description && (
            <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
              {description}
            </p>
          )}
        </div>
        <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-800 rounded-full text-[9px] font-black uppercase tracking-wider border border-green-100 shrink-0">
          <Sparkles size={11} className="text-yellow-500" />
          AI Visual
        </span>
      </div>

      {/* KPI Highlight Cards */}
      {metrics && metrics.length > 0 && (
        <div
          className={`grid gap-2.5 mb-5 ${
            metrics.length === 1
              ? 'grid-cols-1'
              : metrics.length === 2
              ? 'grid-cols-2'
              : metrics.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100/80 flex flex-col justify-between"
            >
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider truncate">
                {m.label}
              </span>
              <span className="text-base font-black text-green-950 mt-1">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'donut' || type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={effectiveYKey}
                nameKey={effectiveXKey}
                cx="50%"
                cy="50%"
                innerRadius={type === 'donut' ? 45 : 0}
                outerRadius={75}
                paddingAngle={type === 'donut' ? 4 : 1}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={NMC_PALETTE[index % NMC_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(val) => (
                  <span className="text-[11px] font-semibold text-green-950">
                    {val}
                  </span>
                )}
                wrapperStyle={{ paddingTop: '10px' }}
              />
            </PieChart>
          ) : type === 'line' ? (
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey={effectiveXKey}
                tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={effectiveYKey}
                stroke="#14532d"
                strokeWidth={3}
                dot={{ r: 4, fill: '#eab308', stroke: '#14532d', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#14532d', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey={effectiveXKey}
                tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={effectiveYKey} radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={NMC_PALETTE[index % NMC_PALETTE.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
