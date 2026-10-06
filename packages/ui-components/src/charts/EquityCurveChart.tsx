import React from 'react';

interface ChartPoint {
  date: string;
  equity: number;
}

interface EquityCurveChartProps {
  data: ChartPoint[];
  height?: number;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  data,
  height = 200,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-xs font-mono h-48">
        No equity curve data available.
      </div>
    );
  }

  const maxEquity = Math.max(...data.map((d) => d.equity));
  const minEquity = Math.min(...data.map((d) => d.equity));
  const range = maxEquity - minEquity || 1;

  // Render responsive SVG sparkline path
  const points = data
    .map((d, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((d.equity - minEquity) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2 font-mono text-xs text-slate-400">
        <span>Equity Peak: <strong className="text-emerald-400">${maxEquity.toLocaleString()}</strong></span>
        <span>Base: <strong className="text-slate-200">${minEquity.toLocaleString()}</strong></span>
      </div>
      <div style={{ height: `${height}px` }} className="w-full relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
};
