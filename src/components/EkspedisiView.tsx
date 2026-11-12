import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  ArrowUpDown, 
  AlertTriangle 
} from 'lucide-react';
import { CourierCategory, MonthPeriod, getMonthInfo } from '../types/fulfillment';

export interface CourierDisplayItem {
  id: string;
  name: string;
  category: CourierCategory;
  color: string;
  daily: number[];
  total: number;
}

export interface EkspedisiViewProps {
  couriersData: CourierDisplayItem[];
  totalVolume: number;
  period?: MonthPeriod;
  daysInMonth?: number;
}

export const EkspedisiView: React.FC<EkspedisiViewProps> = ({ 
  couriersData, 
  totalVolume,
  period,
  daysInMonth = 31 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('VOLUME_DESC');
  const mInfo = period ? getMonthInfo(period.month) : { short: 'Okt', name: 'Oktober' };

  // Categories
  const categories = ['ALL', 'Reguler', 'Marketplace', 'Instant', 'Cargo'];

  // Filter & Search
  const filtered = couriersData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'VOLUME_DESC') return b.total - a.total;
    if (sortBy === 'VOLUME_ASC') return a.total - b.total;
    if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
    return 0;
  });

  const inactiveCouriers = couriersData.filter(c => c.total === 0);

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-800" />
            Monitoring 18 Layanan Logistik & Kurir
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Total {totalVolume.toLocaleString('id-ID')} paket terdistribusi ke {couriersData.length} ekspedisi terdaftar pada bulan Oktober.
          </p>
        </div>

        {/* Inactive alert pill */}
        {inactiveCouriers.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs border border-zinc-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{inactiveCouriers.length} Kurir Belum Ada Transaksi (0 pkt)</span>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari ekspedisi (JNE, SPX, Paxel...)"
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>

        {/* Category Tabs & Sort */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-lg">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-white text-zinc-900 shadow-2xs' 
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {cat === 'ALL' ? 'Semua' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 pl-2 border-l border-zinc-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-medium text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="VOLUME_DESC">Volume Tertinggi</option>
              <option value="VOLUME_ASC">Volume Terendah</option>
              <option value="NAME_ASC">Nama (A-Z)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Courier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((courier) => {
          const share = totalVolume > 0 ? ((courier.total / totalVolume) * 100).toFixed(1) : '0.0';
          const isZero = courier.total === 0;
          const avgPerDay = Math.round(courier.total / daysInMonth);
          const maxDay = courier.daily.length > 0 ? Math.max(...courier.daily.slice(0, daysInMonth)) : 0;

          return (
            <div 
              key={courier.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition-all ${
                isZero ? 'border-zinc-200 opacity-60' : 'border-zinc-200/90'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-3.5 h-3.5 rounded-md"
                    style={{ backgroundColor: courier.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      {courier.name}
                    </h3>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                      {courier.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                    {share}% share
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-100 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Total Paket</span>
                  <span className="font-mono font-bold text-zinc-900 text-sm">
                    {courier.total.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Rata-rata/Hari</span>
                  <span className="font-mono text-zinc-700 font-semibold">
                    {avgPerDay} <span className="text-[10px] font-normal text-zinc-400">pkt</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Puncak (Max)</span>
                  <span className="font-mono text-zinc-700 font-semibold">
                    {maxDay} <span className="text-[10px] font-normal text-zinc-400">pkt</span>
                  </span>
                </div>
              </div>

              {/* Mini Sparkline Dynamic Days */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span>Aktivitas 1 - {daysInMonth} {mInfo.short}</span>
                  <span>{isZero ? 'Tidak Ada Kiriman' : `${courier.daily.slice(0, daysInMonth).filter(v => v > 0).length} hari aktif`}</span>
                </div>
                <div className="flex items-end gap-0.5 h-6 bg-zinc-50 p-1 rounded">
                  {courier.daily.slice(0, daysInMonth).map((val, idx) => {
                    const sparkHeight = maxDay > 0 ? Math.max(10, Math.round((val / maxDay) * 100)) : 10;
                    return (
                      <div
                        key={idx}
                        title={`Tgl ${idx + 1}: ${val} pkt`}
                        style={{ height: `${val > 0 ? sparkHeight : 10}%` }}
                        className={`flex-1 rounded-xs transition-colors ${
                          val > 0 ? 'bg-emerald-700 hover:bg-emerald-500' : 'bg-zinc-200'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

