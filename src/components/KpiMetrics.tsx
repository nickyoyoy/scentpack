import React from 'react';
import { 
  Package, 
  TrendingUp, 
  Truck, 
  Award, 
  Flame, 
  UserCheck 
} from 'lucide-react';

export interface TopRankProp {
  name: string;
  total: number;
  share: number | string;
}

export interface PeakDayProp {
  date: string | number;
  volume: number;
}

export interface LeaderStatsProp {
  daysActive: number;
  total: number;
}

export interface KpiMetricsProps {
  totalVolume: number;
  dailyAvg: number;
  topCourier: TopRankProp;
  topStaff: TopRankProp;
  peakDay: PeakDayProp;
  leaderStats: LeaderStatsProp;
  daysInMonth?: number;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ 
  totalVolume, 
  dailyAvg, 
  topCourier, 
  topStaff, 
  peakDay, 
  leaderStats,
  daysInMonth = 31 
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      
      {/* 1. Total Volume */}
      <div className="bg-white rounded-lg border border-zinc-200/80 p-3.5 shadow-2xs hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-xs font-medium text-zinc-500">Total Pengiriman</span>
          <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-800">
            <Package className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight text-zinc-900">
          {totalVolume.toLocaleString('id-ID')}
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          100% pesanan terkirim
        </p>
      </div>

      {/* 2. Rata-rata Harian */}
      <div className="bg-white rounded-lg border border-zinc-200/80 p-3.5 shadow-2xs hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-xs font-medium text-zinc-500">Rata-rata Harian</span>
          <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight text-zinc-900">
          {dailyAvg.toLocaleString('id-ID')}
          <span className="text-xs font-normal text-zinc-400 ml-1">pkt/hari</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Stabil di {daysInMonth} hari
        </p>
      </div>

      {/* 3. Hari Tersibuk (Peak Day) */}
      <div className="bg-white rounded-lg border border-zinc-200/80 p-3.5 shadow-2xs hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-xs font-medium text-zinc-500">Hari Puncak (Peak)</span>
          <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight text-zinc-900">
          {peakDay.date}
        </div>
        <p className="text-[11px] text-amber-700 font-medium mt-0.5">
          {peakDay.volume.toLocaleString('id-ID')} paket (Promo/Payday)
        </p>
      </div>

      {/* 4. Top Ekspedisi */}
      <div className="bg-white rounded-lg border border-zinc-200/80 p-3.5 shadow-2xs hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-xs font-medium text-zinc-500">Kurir Terbanyak</span>
          <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-800">
            <Truck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight text-zinc-900">
          {topCourier.name}
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {topCourier.total.toLocaleString('id-ID')} pkt ({topCourier.share}%)
        </p>
      </div>

      {/* 5. Top Staff */}
      <div className="bg-white rounded-lg border border-zinc-200/80 p-3.5 shadow-2xs hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-xs font-medium text-zinc-500">Top Staff Inti</span>
          <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight text-zinc-900">
          {topStaff.name}
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {topStaff.total.toLocaleString('id-ID')} pkt ({topStaff.share}%)
        </p>
      </div>

      {/* 6. Leader Backup Status */}
      <div className="bg-white rounded-lg border border-zinc-200/80 p-3.5 shadow-2xs hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-xs font-medium text-zinc-500">Leader Backup</span>
          <div className="p-1.5 rounded-md bg-zinc-100 text-zinc-700">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight text-zinc-900">
          Hambali
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {leaderStats.daysActive} hari backup ({leaderStats.total.toLocaleString('id-ID')} pkt)
        </p>
      </div>

    </div>
  );
};

