import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp,
  PieChart, 
  Users, 
  ArrowUpRight,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { ActiveTab, CourierCategory, MonthPeriod, getMonthInfo } from '../types/fulfillment';

export interface OverviewCourierItem {
  id: string;
  name: string;
  category: CourierCategory;
  color: string;
  total: number;
}

export interface OverviewStaffItem {
  id: string;
  name: string;
  isLeadBackup: boolean;
  avatar: string;
  total: number;
  daysActive: number;
  daysOff: number;
  activeDailyAvg: number;
}

export interface OverviewViewProps {
  dailyTotals: number[];
  couriersData: OverviewCourierItem[];
  staffData: OverviewStaffItem[];
  totalVolume: number;
  onSelectTab: (tab: ActiveTab) => void;
  period: MonthPeriod;
  daysInMonth: number;
}

type ChartMode = 'area' | 'bar' | 'combo';

export const OverviewView: React.FC<OverviewViewProps> = ({ 
  dailyTotals, 
  couriersData, 
  staffData, 
  totalVolume,
  onSelectTab,
  period,
  daysInMonth
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const mInfo = getMonthInfo(period.month);

  // Metrik dasar
  const maxInTotals = dailyTotals.length > 0 ? Math.max(...dailyTotals) : 0;
  const activeDaysCount = dailyTotals.filter(v => v > 0).length;
  const avgVolume = activeDaysCount > 0 ? Math.round(totalVolume / activeDaysCount) : 0;
  const peakDayIdx = dailyTotals.indexOf(maxInTotals);

  // Top 5 Couriers
  const sortedCouriers = [...couriersData].sort((a, b) => b.total - a.total);
  const top5Couriers = sortedCouriers.slice(0, 5);
  const othersCouriersTotal = sortedCouriers.slice(5).reduce((acc, c) => acc + c.total, 0);

  // Sort Staff
  const sortedStaff = [...staffData].sort((a, b) => b.total - a.total);

  // Format data untuk Recharts
  const chartData = useMemo(() => {
    return dailyTotals.map((vol, idx) => {
      const day = idx + 1;
      const isPeak = vol >= 1000;
      const diffAvg = vol - avgVolume;
      const pctDiffAvg = avgVolume > 0 ? Math.round((diffAvg / avgVolume) * 100) : 0;
      return {
        day,
        label: `${day}`,
        fullLabel: `${day} ${mInfo.name} ${period.year}`,
        volume: vol,
        isPeak,
        diffAvg,
        pctDiffAvg,
        barColor: isPeak ? '#d97706' : '#047857',
      };
    });
  }, [dailyTotals, avgVolume, mInfo, period]);

  // Custom Tooltip Recharts - Bersih, Presisi, Anti AI Slop
  interface TooltipPayloadItem {
    payload: {
      day: number;
      label: string;
      fullLabel: string;
      volume: number;
      isPeak: boolean;
      diffAvg: number;
      pctDiffAvg: number;
    };
  }

  const CustomChartTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 text-white px-3.5 py-3 rounded-xl shadow-xl border border-zinc-700/80 text-xs min-w-[220px] pointer-events-none transition-all">
          <div className="flex items-center justify-between border-b border-zinc-700/80 pb-2 mb-2">
            <span className="font-semibold text-zinc-200">{data.fullLabel}</span>
            {data.isPeak ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Peak Load
              </span>
            ) : data.volume > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Normal
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                Off / Nol (0)
              </span>
            )}
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Total Pengiriman:</span>
              <span className="font-mono font-bold text-white text-sm">
                {data.volume.toLocaleString('id-ID')} <span className="text-xs font-normal text-zinc-400">pkt</span>
              </span>
            </div>

            {avgVolume > 0 && data.volume > 0 && (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-800">
                <span className="text-zinc-400">vs Rata-rata ({avgVolume} pkt):</span>
                <span className={`font-mono font-semibold ${data.diffAvg >= 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {data.diffAvg >= 0 ? `+${data.diffAvg}` : data.diffAvg} ({data.diffAvg >= 0 ? '+' : ''}{data.pctDiffAvg}%)
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Main Trend Chart: Recharts Professional Area / Bar / Combo */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-2xs">
        
        {/* Header Grafik */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-800">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900">
                Tren Volume Pengiriman Harian (1 - {daysInMonth} {mInfo.name} {period.year})
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Kurva fluktuasi harian 18 ekspedisi. Garis putus-putus menunjukkan baseline rata-rata ({avgVolume} pkt/hari).
            </p>
          </div>
          
          {/* Chart Controls & Mode Switcher */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* View Switcher: Area vs Bar vs Combo */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setChartMode('area')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'area'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Tampilan Kurva Area & Garis"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                <span>Area & Tren</span>
              </button>

              <button
                onClick={() => setChartMode('bar')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'bar'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Tampilan Grafik Batang Harian"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Batang (Bar)</span>
              </button>

              <button
                onClick={() => setChartMode('combo')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'combo'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Tampilan Kombinasi Batang + Kurva"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kombinasi</span>
              </button>
            </div>

            {/* Badges Legend */}
            <div className="hidden lg:flex items-center gap-3 text-xs pl-2 border-l border-zinc-200">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span>
                <span className="text-zinc-600 text-[11px]">Volume Harian</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-zinc-600 text-[11px]">Peak (&gt;1.000 pkt)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 my-2 border-b border-zinc-100 text-xs">
          <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
            <span className="text-[10px] text-zinc-400 block font-medium">TOTAL BULAN INI</span>
            <span className="font-mono font-bold text-zinc-900 text-sm">
              {totalVolume.toLocaleString('id-ID')} <span className="text-xs font-normal text-zinc-500">pkt</span>
            </span>
          </div>
          <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
            <span className="text-[10px] text-zinc-400 block font-medium">RATA-RATA / HARI KERJA</span>
            <span className="font-mono font-semibold text-zinc-800 text-sm">
              {avgVolume.toLocaleString('id-ID')} <span className="text-xs font-normal text-zinc-500">pkt</span>
            </span>
          </div>
          <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
            <span className="text-[10px] text-zinc-400 block font-medium">HARI PUNCAK (PEAK)</span>
            <span className="font-mono font-semibold text-amber-700 text-sm">
              {maxInTotals > 0 ? `${peakDayIdx + 1} ${mInfo.short} (${maxInTotals.toLocaleString('id-ID')} pkt)` : '-'}
            </span>
          </div>
          <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
            <span className="text-[10px] text-zinc-400 block font-medium">HARI AKTIF PENGIRIMAN</span>
            <span className="font-mono font-semibold text-emerald-800 text-sm">
              {activeDaysCount} <span className="text-xs font-normal text-zinc-500">dari {daysInMonth} hari</span>
            </span>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-72 pt-3">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e4e4e7' }}
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                  interval={0}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                />
                <Tooltip content={<CustomChartTooltip />} />
                {avgVolume > 0 && (
                  <ReferenceLine 
                    y={avgVolume} 
                    stroke="#71717a" 
                    strokeDasharray="4 4" 
                    label={{ value: `Avg: ${avgVolume}`, position: 'right', fill: '#71717a', fontSize: 10 }} 
                  />
                )}
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#047857" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#emeraldAreaGradient)"
                  activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : chartMode === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e4e4e7' }}
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                  interval={0}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                />
                <Tooltip content={<CustomChartTooltip />} />
                {avgVolume > 0 && (
                  <ReferenceLine 
                    y={avgVolume} 
                    stroke="#71717a" 
                    strokeDasharray="4 4" 
                    label={{ value: `Avg: ${avgVolume}`, position: 'right', fill: '#71717a', fontSize: 10 }} 
                  />
                )}
                <Bar 
                  dataKey="volume" 
                  radius={[4, 4, 0, 0]}
                  fill="#047857"
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const isPeak = payload?.isPeak;
                    const fillColor = isPeak ? '#d97706' : '#047857';
                    return (
                      <rect 
                        x={x} 
                        y={y} 
                        width={width} 
                        height={height} 
                        fill={fillColor} 
                        rx={3} 
                        ry={3} 
                        className="transition-opacity hover:opacity-85"
                      />
                    );
                  }}
                />
              </BarChart>
            ) : (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldComboGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e4e4e7' }}
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                  interval={0}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                />
                <Tooltip content={<CustomChartTooltip />} />
                {avgVolume > 0 && (
                  <ReferenceLine 
                    y={avgVolume} 
                    stroke="#71717a" 
                    strokeDasharray="4 4" 
                    label={{ value: `Avg: ${avgVolume}`, position: 'right', fill: '#71717a', fontSize: 10 }} 
                  />
                )}
                <Bar 
                  dataKey="volume" 
                  radius={[3, 3, 0, 0]} 
                  fill="#e4e4e7" 
                  maxBarSize={16}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#047857" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#emeraldComboGradient)"
                  activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Caption footer */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-100 mt-2">
          <span>Arahkan kursor ke titik grafik untuk rincian tanggal spesifik</span>
          <span className="font-mono text-zinc-500">Periode: 1 - {daysInMonth} {mInfo.name} {period.year}</span>
        </div>

      </div>

      {/* 2. Grid Columns: Courier Share vs Staff Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Top Courier Breakdown */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-800" />
                Distribusi Volume Ekspedisi
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {totalVolume > 0 
                  ? `3 kurir teratas mendominasi ${((sortedCouriers.slice(0, 3).reduce((acc, c) => acc + c.total, 0) / totalVolume) * 100).toFixed(1)}% dari total ${totalVolume.toLocaleString('id-ID')} pengiriman`
                  : 'Belum ada catatan pengiriman (Data 0)'}
              </p>
            </div>
            <button
              onClick={() => onSelectTab('ekspedisi')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
            >
              Lihat 18 Kurir <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {top5Couriers.map((c) => {
              const share = totalVolume > 0 ? ((c.total / totalVolume) * 100).toFixed(1) : '0.0';
              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 flex items-center gap-1.5">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                      <span className="text-[10px] text-zinc-400 font-normal">({c.category})</span>
                    </span>
                    <span className="font-mono text-zinc-600">
                      <strong className="text-zinc-900">{c.total.toLocaleString('id-ID')}</strong> ({share}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${share}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Others */}
            <div className="space-y-1 pt-1 border-t border-zinc-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                  13 Ekspedisi Lainnya (AnterAja, SiCepat, dll)
                </span>
                <span className="font-mono text-zinc-600">
                  <strong className="text-zinc-800">{othersCouriersTotal.toLocaleString('id-ID')}</strong> ({totalVolume > 0 ? ((othersCouriersTotal/totalVolume)*100).toFixed(1) : '0.0'}%)
                </span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-2 rounded-full bg-zinc-400"
                  style={{ width: `${totalVolume > 0 ? ((othersCouriersTotal/totalVolume)*100).toFixed(1) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Staff Productivity & Backup Overview */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-800" />
                Kinerja Tim & Leader Backup
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                4 staff inti seimbang (~22-23%) • Hambali aktif sebagai Team Leader cadangan
              </p>
            </div>
            <button
              onClick={() => onSelectTab('staff')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
            >
              Detail Staff <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {sortedStaff.map((s) => {
              const share = totalVolume > 0 ? ((s.total / totalVolume) * 100).toFixed(1) : '0.0';
              const isBackup = s.isLeadBackup;

              return (
                <div 
                  key={s.id} 
                  className={`p-2.5 rounded-lg border transition-all ${
                    isBackup 
                      ? 'bg-amber-50/50 border-amber-200/70' 
                      : 'bg-zinc-50/70 border-zinc-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isBackup 
                          ? 'bg-amber-200 text-amber-900' 
                          : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {s.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                          {s.name}
                          {isBackup ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-medium">
                              Leader / Cadangan
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200/70 text-zinc-700 font-normal">
                              Staff Inti
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {isBackup 
                            ? `Aktif Backup: ${s.daysActive} hari • ${s.daysOff} hari Standby/SOP` 
                            : `Hadir: ${s.daysActive} hari • Off (0): ${s.daysOff} hari`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-zinc-900 text-sm">
                        {s.total.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {share}% • avg {s.activeDailyAvg} pkt/hr
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-zinc-200/50">
                    <div 
                      className={`h-1.5 rounded-full ${isBackup ? 'bg-amber-500' : 'bg-emerald-700'}`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
