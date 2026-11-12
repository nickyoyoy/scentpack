import React, { useState } from 'react';
import { 
  Layers, 
  FileSpreadsheet
} from 'lucide-react';
import { MonthPeriod, getMonthInfo } from '../types/fulfillment';

export interface MatrixRowItem {
  id: string;
  name: string;
  daily: number[];
  total: number;
}

export interface MatrixViewProps {
  couriersData: MatrixRowItem[];
  staffData: MatrixRowItem[];
  dailyTotals: number[];
  period: MonthPeriod;
  daysInMonth: number;
}

export const MatrixView: React.FC<MatrixViewProps> = ({ 
  couriersData, 
  staffData, 
  dailyTotals,
  period,
  daysInMonth 
}) => {
  const [activeMatrix, setActiveMatrix] = useState<'EXPEDITION' | 'STAFF'>('EXPEDITION');
  const [dateRange, setDateRange] = useState<'ALL' | '1-10' | '11-20' | '21-31'>('ALL');

  const mInfo = getMonthInfo(period.month);

  // Determine days to display
  let startDay = 0;
  let endDay = daysInMonth;
  if (dateRange === '1-10') {
    startDay = 0;
    endDay = Math.min(10, daysInMonth);
  } else if (dateRange === '11-20') {
    startDay = 10;
    endDay = Math.min(20, daysInMonth);
  } else if (dateRange === '21-31') {
    startDay = 20;
    endDay = daysInMonth;
  }

  const daysSlice = Array.from({ length: Math.max(0, endDay - startDay) }, (_, i) => startDay + i);

  // Rows to render
  const rows = activeMatrix === 'EXPEDITION' ? couriersData : staffData;

  // Calculate slice total
  const sliceDailyTotals = daysSlice.map(dayIdx => dailyTotals[dayIdx] || 0);
  const sliceGrandTotal = sliceDailyTotals.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      
      {/* Controls & Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
        
        {/* Table Type Selector */}
        <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveMatrix('EXPEDITION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeMatrix === 'EXPEDITION'
                ? 'bg-emerald-900 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Table 1: Ekspedisi (18 Kurir)</span>
          </button>

          <button
            onClick={() => setActiveMatrix('STAFF')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeMatrix === 'STAFF'
                ? 'bg-emerald-900 text-white shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Table 2: Staff Packing (5 Tim)</span>
          </button>
        </div>

        {/* Date Range Segmentation */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Rentang Tanggal:</span>
          <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-lg text-xs">
            {[
              { id: 'ALL' as const, label: `1 - ${daysInMonth} ${mInfo.short} (Penuh)` },
              { id: '1-10' as const, label: `1 - 10 ${mInfo.short}` },
              { id: '11-20' as const, label: `11 - 20 ${mInfo.short}` },
              { id: '21-31' as const, label: `21 - ${daysInMonth} ${mInfo.short}` },
            ].map((rng) => (
              <button
                key={rng.id}
                onClick={() => setDateRange(rng.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateRange === rng.id
                    ? 'bg-white text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {rng.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Spreadsheet Matrix Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] relative">
          <table className="w-full text-xs border-collapse">
            
            {/* Header: Exact forest green from Excel (#1e4834) */}
            <thead className="bg-[#1b4332] text-white sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-2 text-center border border-emerald-800/60 w-10 font-bold sticky left-0 bg-[#1b4332] z-30">
                  No
                </th>
                <th className="py-2.5 px-3 text-left border border-emerald-800/60 min-w-[150px] font-bold sticky left-10 bg-[#1b4332] z-30">
                  {activeMatrix === 'EXPEDITION' ? 'Nama Ekspedisi' : 'Nama Staff'}
                </th>

                {daysSlice.map((d) => (
                  <th 
                    key={d} 
                    className="py-2.5 px-2 text-center border border-emerald-800/60 min-w-[55px] font-medium"
                  >
                    {d + 1} {mInfo.short}
                  </th>
                ))}

                <th className="py-2.5 px-3 text-right border border-emerald-800/60 min-w-[75px] font-bold bg-[#143427] sticky right-0 z-20">
                  TOTAL
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-200">
              {rows.map((row, index) => {
                const isHambali = row.id === 'hambali';

                return (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-zinc-50 transition-colors ${
                      isHambali ? 'bg-amber-50/40' : index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/40'
                    }`}
                  >
                    {/* Sticky No */}
                    <td className="py-2 px-2 text-center border border-zinc-200 font-mono text-zinc-500 sticky left-0 bg-inherit z-10">
                      {index + 1}
                    </td>

                    {/* Sticky Name */}
                    <td className="py-2 px-3 border border-zinc-200 font-semibold text-zinc-900 sticky left-10 bg-inherit z-10 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isHambali && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Leader Backup" />
                        )}
                        <span>{row.name}</span>
                        {isHambali && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-normal">
                            Leader
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Daily values */}
                    {daysSlice.map((d) => {
                      const val = row.daily[d] || 0;
                      const isZero = val === 0;

                      return (
                        <td 
                          key={d}
                          className={`py-2 px-1 text-center border border-zinc-200 font-mono ${
                            isZero 
                              ? 'text-zinc-300 font-light' 
                              : val >= 300 
                              ? 'text-emerald-800 font-bold bg-emerald-50/70' 
                              : 'text-zinc-800'
                          }`}
                          title={`${row.name} - ${d + 1} ${mInfo.name}: ${isZero ? '0 (Off/Nol)' : `${val} paket`}`}
                        >
                          {val}
                        </td>
                      );
                    })}

                    {/* Sticky Total Column */}
                    <td className="py-2 px-3 text-right border border-zinc-200 font-mono font-bold text-zinc-900 bg-zinc-100/90 sticky right-0 z-10">
                      {row.total.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Sticky Bottom Total Row */}
            <tfoot className="bg-[#1b4332] text-white font-bold sticky bottom-0 z-20">
              <tr>
                <td colSpan={2} className="py-3 px-3 text-center border border-emerald-800 tracking-wider text-xs sticky left-0 bg-[#1b4332] z-30">
                  TOTAL
                </td>

                {daysSlice.map((d) => {
                  const dayTotal = dailyTotals[d] || 0;
                  return (
                    <td 
                      key={d} 
                      className="py-3 px-1 text-center border border-emerald-800 font-mono text-xs"
                    >
                      {dayTotal.toLocaleString('id-ID')}
                    </td>
                  );
                })}

                <td className="py-3 px-3 text-right border border-emerald-800 font-mono text-sm bg-[#143427] text-emerald-200 sticky right-0 z-20">
                  {sliceGrandTotal.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>

      {/* Helper Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs border border-zinc-200 bg-emerald-50"></span>
          <span>Beban Tinggi (&gt;= 300 pkt)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs border border-zinc-200 bg-white text-zinc-400 text-center font-mono text-[9px] leading-3">0</span>
          <span>Status Off (Staff Libur) / Nol Transaksi</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs border border-amber-300 bg-amber-50"></span>
          <span>Hambali (Team Leader / Cadangan)</span>
        </span>
      </div>

    </div>
  );
};

