import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
  Filter,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

import { MonthPeriod, getMonthInfo } from '../types/fulfillment';

export interface StaffDisplayItem {
  id: string;
  name: string;
  role: string;
  isLeadBackup: boolean;
  avatar: string;
  daily: number[];
  total: number;
  daysActive: number;
  daysOff: number;
  activeDailyAvg: number;
}

export interface StaffViewProps {
  staffData: StaffDisplayItem[];
  totalVolume: number;
  onAutoDistributeStaff: () => void;
  period: MonthPeriod;
  daysInMonth: number;
}

type StaffChartMode = 'area' | 'bar' | 'compare';

const STAFF_COLORS: Record<string, string> = {
  dina: '#047857',   // Emerald
  hambali: '#d97706',// Amber
  jihan: '#0284c7',  // Sky Blue
  wawan: '#7c3aed',  // Violet
  windi: '#db2777',  // Pink
};

export const StaffView: React.FC<StaffViewProps> = ({ 
  staffData, 
  totalVolume, 
  onAutoDistributeStaff,
  period,
  daysInMonth
}) => {
  const [includeLeader, setIncludeLeader] = useState<boolean>(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>('dina');
  const [chartMode, setChartMode] = useState<StaffChartMode>('area');
  const mInfo = getMonthInfo(period.month);

  // Filter staff based on toggle
  const displayedStaff = includeLeader
    ? staffData
    : staffData.filter(s => !s.isLeadBackup);

  const totalStaffVolume = staffData.reduce((acc, s) => acc + s.total, 0);
  const totalCoreStaffVolume = staffData
    .filter(s => !s.isLeadBackup)
    .reduce((acc, s) => acc + s.total, 0);

  const activeTotalRef = includeLeader ? totalStaffVolume : totalCoreStaffVolume;
  const sortedStaff = [...displayedStaff].sort((a, b) => b.total - a.total);
  const leaderStaff = staffData.find(s => s.isLeadBackup);

  // Selected staff object
  const activeStaff = staffData.find(s => s.id === selectedStaffId) || sortedStaff[0];

  const maxDailyVal = activeStaff && activeStaff.daily.length > 0 ? Math.max(...activeStaff.daily.slice(0, daysInMonth), 0) : 0;
  const peakDayIdx = activeStaff ? activeStaff.daily.slice(0, daysInMonth).indexOf(maxDailyVal) : -1;

  // Chart data for daysInMonth (supports both individual view & team comparison)
  const chartData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, idx) => {
      const day = idx + 1;
      const vol = activeStaff ? activeStaff.daily[idx] || 0 : 0;
      const isOff = vol === 0;
      const isPeak = maxDailyVal > 0 && vol === maxDailyVal;

      const row: Record<string, any> = {
        day,
        label: `${day}`,
        fullLabel: `${day} ${mInfo.name} ${period.year}`,
        volume: vol,
        isOff,
        isPeak,
      };

      // Add each staff's output for comparison mode
      staffData.forEach((s) => {
        row[s.id] = s.daily[idx] || 0;
      });

      return row;
    });
  }, [activeStaff, staffData, maxDailyVal, daysInMonth, mInfo, period]);

  // Custom Tooltip Recharts - Bersih, Elegan, Anti AI Slop
  const CustomStaffTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Mode Komparasi Tim (Semua 5 Staff)
      if (chartMode === 'compare') {
        const totalDay = staffData.reduce((acc, s) => acc + (data[s.id] || 0), 0);
        return (
          <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl border border-zinc-700/80 text-xs min-w-[230px] pointer-events-none">
            <div className="flex items-center justify-between border-b border-zinc-700 pb-1.5 mb-2 font-semibold text-zinc-200">
              <span>{data.fullLabel}</span>
              <span className="font-mono text-emerald-400 font-bold">{totalDay.toLocaleString('id-ID')} pkt</span>
            </div>
            <div className="space-y-1.5">
              {staffData.map(s => {
                const val = data[s.id] || 0;
                const color = STAFF_COLORS[s.id] || '#71717a';
                const isSelected = selectedStaffId === s.id;
                return (
                  <div 
                    key={s.id} 
                    className={`flex items-center justify-between text-xs px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-zinc-800 ring-1 ring-emerald-500/50' : ''
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className={isSelected ? 'font-bold text-white' : ''}>{s.name}</span>
                      {s.isLeadBackup && <span className="text-[9px] text-amber-400 font-mono">(Leader)</span>}
                    </span>
                    <span className="font-mono font-semibold">
                      {val === 0 ? <span className="text-zinc-500 font-normal">Off (0)</span> : `${val} pkt`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Mode Individu (Area atau Bar)
      const isOff = data.volume === 0;
      return (
        <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl border border-zinc-700/80 text-xs min-w-[210px] pointer-events-none">
          <div className="flex items-center justify-between border-b border-zinc-700 pb-1.5 mb-2">
            <span className="font-semibold text-zinc-200">{data.fullLabel}</span>
            {isOff ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                Off / Libur Shift
              </span>
            ) : data.isPeak ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Puncak Output
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Hadir Bekerja
              </span>
            )}
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Output {activeStaff?.name}:</span>
              <span className="font-mono font-bold text-white text-sm">
                {isOff ? '0' : data.volume.toLocaleString('id-ID')} <span className="text-xs font-normal text-zinc-400">pkt</span>
              </span>
            </div>

            {!isOff && activeStaff && activeStaff.activeDailyAvg > 0 && (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-800">
                <span className="text-zinc-400">vs Avg Hadir ({activeStaff.activeDailyAvg} pkt):</span>
                <span className={`font-mono font-semibold ${data.volume >= activeStaff.activeDailyAvg ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {data.volume >= activeStaff.activeDailyAvg ? `+${data.volume - activeStaff.activeDailyAvg}` : data.volume - activeStaff.activeDailyAvg} pkt
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const chartThemeColor = activeStaff?.isLeadBackup ? '#d97706' : '#047857';

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            Produktivitas & Distribusi Beban Kerja Staff Packing
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Total Output Staff: <strong className="text-zinc-900">{activeTotalRef.toLocaleString('id-ID')} paket</strong> • Angka <strong className="text-zinc-800">0 dihitung "Off / Libur Shift"</strong>.
          </p>
        </div>

        {/* Leader Toggle Switch */}
        <div className="flex items-center gap-2.5 bg-zinc-100 p-1.5 rounded-lg border border-zinc-200 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-700 font-medium">Sertakan Leader (Hambali):</span>
          <button
            onClick={() => setIncludeLeader(!includeLeader)}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${includeLeader
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-white text-zinc-700 border border-zinc-300'
              }`}
          >
            {includeLeader ? 'Aktif (5 Orang)' : 'Hanya 4 Staff Inti'}
          </button>
        </div>
      </div>

      {/* Smart Auto-Distribute Banner: When Ekspedisi has volume but Staff is empty */}
      {totalVolume > 0 && totalStaffVolume === 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-800 text-white shrink-0 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Data Ekspedisi ({totalVolume.toLocaleString('id-ID')} Paket) Terdeteksi, Tetapi Catatan Staff Masih 0
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                File yang Anda upload berisi {totalVolume.toLocaleString('id-ID')} paket kurir, tetapi tidak menyertakan sheet Staff. Sesuai <strong>SOP 02</strong>, klik tombol di sebelah kanan untuk membagi rata kuota harian ke 4 Staff Inti (Dina, Jihan, Wawan, Windi).
              </p>
            </div>
          </div>
          <button
            onClick={onAutoDistributeStaff}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Distribusikan Beban ke 4 Staff (SOP)</span>
          </button>
        </div>
      )}

      {/* Leader & SOP Protocol Alert Note */}
      {leaderStaff && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-950 flex items-center gap-2">
              Protokol Khusus: {leaderStaff.name} (Team Leader / Cadangan)
            </div>
            <p className="text-amber-800 leading-relaxed">
              Sesuai SOP, Hambali bertindak sebagai <strong>Team Leader sekaligus Backup</strong>. Jika seluruh staff inti hadir, ia fokus pada supervisi, rekonsiliasi data, dan koordinasi kurir. Namun ketika ada staff inti yang Off / berhalangan hadir (seperti tgl 4 & 10 Okt), ia langsung masuk ke workstation packing untuk memastikan SLA pesanan terpenuhi.
            </p>
          </div>
        </div>
      )}

      {/* Staff Selection Instructions */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <span className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-emerald-800" />
          <span>Pilih salah satu kartu staff di bawah untuk melihat <strong>Grafik & Detail Analisis Kinerjanya</strong>:</span>
        </span>
        <span className="text-[11px] text-emerald-800 font-medium">
          Staff Terpilih: <strong>{activeStaff?.name}</strong>
        </span>
      </div>

      {/* Staff Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {sortedStaff.map((staff, rank) => {
          const share = activeTotalRef > 0 ? ((staff.total / activeTotalRef) * 100).toFixed(1) : '0.0';
          const isBackup = staff.isLeadBackup;
          const isSelected = selectedStaffId === staff.id;

          return (
            <div
              key={staff.id}
              onClick={() => setSelectedStaffId(staff.id)}
              className={`bg-white rounded-xl border p-3.5 shadow-2xs transition-all cursor-pointer relative ${isSelected
                  ? 'ring-2 ring-emerald-800 border-emerald-800 bg-emerald-50/20 shadow-xs'
                  : isBackup
                    ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                    : 'border-zinc-200/90 hover:border-zinc-300'
                }`}
            >
              {isSelected && (
                <span className="absolute -top-2 right-3 px-1.5 py-0.2 bg-emerald-800 text-white text-[9px] font-bold rounded-full">
                  Dipilih
                </span>
              )}

              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isBackup ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                    {staff.avatar}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                      {staff.name}
                      {rank === 0 && !isBackup && staff.total > 0 && (
                        <span title="Top Performer">
                          <Award className="w-3 h-3 text-amber-500" />
                        </span>
                      )}
                    </h3>
                    <span className={`text-[9px] font-medium px-1 rounded inline-block ${isBackup ? 'bg-amber-200/70 text-amber-900' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                      {isBackup ? 'Leader/Backup' : 'Staff Inti'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-zinc-900 text-sm">
                    {staff.total.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] text-zinc-400 block font-mono">
                    {share}%
                  </span>
                </div>
              </div>

              {/* Stats Table Mini */}
              <div className="grid grid-cols-2 gap-1.5 py-2 border-y border-zinc-100 text-[11px]">
                <div>
                  <span className="text-[9px] text-zinc-400 block">Hadir</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {staff.daysActive} hr
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block">Off (0)</span>
                  <span className="font-mono text-zinc-500">
                    {staff.daysOff} hr
                  </span>
                </div>
              </div>

              {/* Rata-rata */}
              <div className="mt-2 text-[10px] text-zinc-500 flex items-center justify-between">
                <span>Avg/Hari:</span>
                <span className="font-mono font-semibold text-zinc-800">{staff.activeDailyAvg} pkt</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL INSPECTOR: GRAFIK RECHARTS LENGKAP UNTUK PRODUKTIVITAS STAFF */}
      {activeStaff && (
        <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-2xs space-y-4">
          
          {/* Header Inspector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {activeStaff.avatar}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  Grafik Analisis Kinerja: {activeStaff.name}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${activeStaff.isLeadBackup ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                    {activeStaff.role}
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Total Kontribusi: <strong className="text-zinc-900">{activeStaff.total.toLocaleString('id-ID')} paket</strong> {activeTotalRef > 0 ? `(${((activeStaff.total / activeTotalRef) * 100).toFixed(1)}% dari total tim)` : ''} • Rata-rata: <strong>{activeStaff.activeDailyAvg} pkt/hari hadir</strong>
                </p>
              </div>
            </div>

            {/* Mode Switcher: Area vs Bar vs Komparasi Tim */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setChartMode('area')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'area'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Tampilan Kurva Area Individu"
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
                title="Tampilan Batang Individu"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Batang (Bar)</span>
              </button>

              <button
                onClick={() => setChartMode('compare')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'compare'
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Komparasi Beban Semua 5 Staff"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>Komparasi 5 Tim</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs py-1">
            <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 block font-medium">TOTAL OUTPUT</span>
              <span className="font-mono font-bold text-zinc-900 text-sm">
                {activeStaff.total.toLocaleString('id-ID')} <span className="text-xs font-normal text-zinc-500">pkt</span>
              </span>
            </div>
            <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 block font-medium">HARI AKTIF KERJA</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                {activeStaff.daysActive} <span className="text-xs font-normal text-zinc-500">hari</span>
              </span>
            </div>
            <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 block font-medium">STATUS OFF (LIBUR)</span>
              <span className="font-mono font-semibold text-zinc-500 text-sm">
                {activeStaff.daysOff} <span className="text-xs font-normal text-zinc-400">hari</span>
              </span>
            </div>
            <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 block font-medium">RATA-RATA / HARI HADIR</span>
              <span className="font-mono font-semibold text-zinc-800 text-sm">
                {activeStaff.activeDailyAvg} <span className="text-xs font-normal text-zinc-500">pkt/hr</span>
              </span>
            </div>
            <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 block font-medium">OUTPUT TERTINGGI</span>
              <span className="font-mono font-semibold text-amber-700 text-sm">
                {maxDailyVal > 0 ? `${maxDailyVal} pkt (${peakDayIdx + 1} ${mInfo.short})` : '-'}
              </span>
            </div>
          </div>

          {/* Canvas Recharts untuk Produktivitas Staff */}
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="staffAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartThemeColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartThemeColor} stopOpacity={0.01} />
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
                  <Tooltip content={<CustomStaffTooltip />} />
                  {activeStaff.activeDailyAvg > 0 && (
                    <ReferenceLine 
                      y={activeStaff.activeDailyAvg} 
                      stroke="#71717a" 
                      strokeDasharray="4 4" 
                      label={{ value: `Avg Hadir: ${activeStaff.activeDailyAvg} pkt`, position: 'right', fill: '#71717a', fontSize: 10 }} 
                    />
                  )}
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke={chartThemeColor} 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#staffAreaGradient)"
                    activeDot={{ r: 6, fill: chartThemeColor, stroke: '#ffffff', strokeWidth: 2 }}
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
                  <Tooltip content={<CustomStaffTooltip />} />
                  {activeStaff.activeDailyAvg > 0 && (
                    <ReferenceLine 
                      y={activeStaff.activeDailyAvg} 
                      stroke="#71717a" 
                      strokeDasharray="4 4" 
                      label={{ value: `Avg Hadir: ${activeStaff.activeDailyAvg} pkt`, position: 'right', fill: '#71717a', fontSize: 10 }} 
                    />
                  )}
                  <Bar 
                    dataKey="volume" 
                    radius={[4, 4, 0, 0]}
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props;
                      const isOff = payload?.volume === 0;
                      const isPeak = payload?.isPeak;
                      const fillColor = isOff ? '#e4e4e7' : isPeak ? '#d97706' : chartThemeColor;
                      return (
                        <rect 
                          x={x} 
                          y={y} 
                          width={width} 
                          height={Math.max(height, isOff ? 4 : 0)} 
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
                /* Mode Komparasi Tim (Semua 5 Staff) */
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                  <Tooltip content={<CustomStaffTooltip />} />
                  {staffData.map(s => {
                    const color = STAFF_COLORS[s.id] || '#71717a';
                    const isSelected = selectedStaffId === s.id;
                    return (
                      <Line 
                        key={s.id}
                        type="monotone" 
                        dataKey={s.id} 
                        name={s.name}
                        stroke={color} 
                        strokeWidth={isSelected ? 3.5 : 2}
                        dot={false}
                        activeDot={{ r: 5, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    );
                  })}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend Strip untuk Komparasi */}
          {chartMode === 'compare' && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2 border-t border-zinc-100">
              {staffData.map(s => {
                const color = STAFF_COLORS[s.id] || '#71717a';
                const isSelected = selectedStaffId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStaffId(s.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      isSelected ? 'bg-zinc-100 font-bold text-zinc-900 ring-1 ring-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span>{s.name}</span>
                    {s.isLeadBackup && <span className="text-[10px] text-amber-600 font-normal">(Leader)</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Daily Table Matrix View for this staff */}
          <div className="pt-2 border-t border-zinc-100">
            <span className="text-[11px] font-semibold text-zinc-700 block mb-2">
              Rincian Tanggal Kerja {activeStaff.name} (1 - {daysInMonth} {mInfo.name}):
            </span>
            <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1">
              {activeStaff.daily.slice(0, daysInMonth).map((val, idx) => {
                const isOff = val === 0;
                return (
                  <div
                    key={idx}
                    title={`Tgl ${idx + 1}: ${isOff ? 'OFF (Libur)' : `${val} pkt`}`}
                    className={`p-1 text-center rounded border font-mono text-[10px] transition-colors ${isOff
                        ? 'bg-zinc-50 border-zinc-200 text-zinc-300'
                        : activeStaff.isLeadBackup
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900 font-bold'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold'
                      }`}
                  >
                    <div className="text-[8px] text-zinc-400 font-sans">{idx + 1}</div>
                    <div>{isOff ? '-' : val}</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Staff Detail Breakdown Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-800" />
            Tabel Komparasi Efisiensi Staff
          </h3>
          {selectedStaffId && (
            <button
              onClick={() => setSelectedStaffId(null)}
              className="text-xs text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
            >
              Reset Pilihan
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3 font-medium">Nama Staff</th>
                <th className="py-2.5 px-3 font-medium">Peran / Role</th>
                <th className="py-2.5 px-3 font-medium text-right">Hari Aktif</th>
                <th className="py-2.5 px-3 font-medium text-right">Hari Off (0)</th>
                <th className="py-2.5 px-3 font-medium text-right">Output Tertinggi/Hari</th>
                <th className="py-2.5 px-3 font-medium text-right">Rata-rata/Hari Hadir</th>
                <th className="py-2.5 px-3 font-medium text-right font-bold text-zinc-900">Total Output</th>
                <th className="py-2.5 px-3 font-medium text-right">Porsi (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {displayedStaff.map((s) => {
                const maxSingleDay = s.daily.length > 0 ? Math.max(...s.daily) : 0;
                const share = activeTotalRef > 0 ? ((s.total / activeTotalRef) * 100).toFixed(1) : '0.0';
                const isSelected = selectedStaffId === s.id;

                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStaffId(s.id)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/70 font-medium' : 'hover:bg-zinc-50/80'
                      }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.isLeadBackup ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                      {s.name}
                      {isSelected && (
                        <span className="text-[9px] px-1 py-0.2 bg-emerald-800 text-white rounded">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500">
                      {s.role}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                      {s.daysActive} hr
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                      {s.daysOff} hr
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-700">
                      {maxSingleDay} pkt
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-700">
                      {s.activeDailyAvg} pkt/hr
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                      {s.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                      {share}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-100/70 border-t-2 border-zinc-300 font-semibold text-zinc-900">
              <tr>
                <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[11px] tracking-wider text-zinc-600">
                  Total Terpenuhi:
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-emerald-900">
                  {activeTotalRef.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {activeTotalRef > 0 ? '100%' : '0%'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
