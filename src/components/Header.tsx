import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  BookOpen,
  Download,
  Trash2,
  Calendar,
  ChevronDown,
  Plus,
  Check,
  Clock,
  X,
  Cloud,
  RefreshCw
} from 'lucide-react';
import scentpackLogo from '../assets/logo.png';
import { MonthPeriod, INDONESIAN_MONTHS, getMonthInfo } from '../types/fulfillment';

export interface HeaderProps {
  onOpenInput: () => void;
  onOpenUpload: () => void;
  onOpenSop: () => void;
  onExportData: () => void;
  onOpenClearModal: () => void;
  totalVolume: number;
  selectedPeriod: MonthPeriod;
  onPeriodChange: (period: MonthPeriod) => void;
  onRemovePeriod?: (period: MonthPeriod) => void;
  availablePeriods: MonthPeriod[];
  daysInMonth: number;
  cloudStatus?: 'local' | 'syncing' | 'synced' | 'error';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInput,
  onOpenUpload,
  onOpenSop,
  onExportData,
  onOpenClearModal,
  totalVolume,
  selectedPeriod,
  onPeriodChange,
  onRemovePeriod,
  availablePeriods,
  daysInMonth,
  cloudStatus = 'local',
}) => {
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState<boolean>(false);
  const [pickerMonth, setPickerMonth] = useState<number>(selectedPeriod.month);
  const [pickerYear, setPickerYear] = useState<number>(selectedPeriod.year);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync internal picker state when selectedPeriod changes
  useEffect(() => {
    setPickerMonth(selectedPeriod.month);
    setPickerYear(selectedPeriod.year);
  }, [selectedPeriod]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsPeriodMenuOpen(false);
      }
    };
    if (isPeriodMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPeriodMenuOpen]);

  const currentMonthInfo = getMonthInfo(selectedPeriod.month);

  const handleApplyCustomPeriod = () => {
    onPeriodChange({ year: pickerYear, month: pickerMonth });
    setIsPeriodMenuOpen(false);
  };

  const yearsList = useMemo<number[]>(() => {
    const list: number[] = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
    availablePeriods.forEach(p => {
      if (!list.includes(p.year)) list.push(p.year);
    });
    return list.sort((a, b) => a - b);
  }, [availablePeriods]);

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-4">

          {/* Brand & Context */}
          <div className="flex items-center space-x-3">
            <img
              src={scentpackLogo}
              alt="ScentPack Logo"
              className="h-10 w-10 rounded-lg object-contain shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
                  ScentPack
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  Fulfillment & Ekspedisi
                </span>

                {/* Period Selector Dropdown Trigger */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/70 border border-emerald-300 rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="Klik untuk memilih bulan & tahun laporan"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{currentMonthInfo.name} {selectedPeriod.year}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Period Popover */}
                  {isPeriodMenuOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-zinc-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-800" />
                          Pilih Periode Dashboard
                        </span>
                        <span className="text-[10px] text-zinc-400">Multi-Bulan & Tahun</span>
                      </div>

                      {/* Quick Available Periods */}
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                          Periode Aktif Tersimpan:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {availablePeriods.map((p) => {
                            const isCurrent = p.year === selectedPeriod.year && p.month === selectedPeriod.month;
                            const m = getMonthInfo(p.month);
                            const isBasePeriod = p.year === 2026 && p.month === 10;
                            return (
                              <div
                                key={`${p.year}-${p.month}`}
                                className={`group flex items-center rounded-md font-medium text-xs transition-colors ${
                                  isCurrent
                                    ? 'bg-emerald-800 text-white shadow-2xs'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    onPeriodChange(p);
                                    setIsPeriodMenuOpen(false);
                                  }}
                                  className="px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                                >
                                  {isCurrent && <Check className="w-3 h-3" />}
                                  <span>{m.short} {p.year}</span>
                                </button>
                                {onRemovePeriod && !isBasePeriod && !isCurrent && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemovePeriod(p);
                                    }}
                                    className="pr-1.5 pl-0.5 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title={`Hapus periode ${m.name} ${p.year}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Selector for any Month & Year */}
                      <div className="pt-2 border-t border-zinc-100 space-y-2">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                          Pilih / Tambah Bulan Baru:
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Bulan:</label>
                            <select
                              value={pickerMonth}
                              onChange={(e) => setPickerMonth(Number(e.target.value))}
                              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-zinc-800 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-700"
                            >
                              {INDONESIAN_MONTHS.map((m) => (
                                <option key={m.number} value={m.number}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Tahun:</label>
                            <select
                              value={pickerYear}
                              onChange={(e) => setPickerYear(Number(e.target.value))}
                              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-zinc-800 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-700"
                            >
                              {yearsList.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={handleApplyCustomPeriod}
                          className="w-full mt-2 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tampilkan / Buka Periode Ini</span>
                        </button>
                      </div>

                      <div className="text-[10px] text-zinc-400 bg-zinc-50 p-2 rounded border border-zinc-100 flex items-start gap-1">
                        <Clock className="w-3 h-3 text-zinc-400 mt-0.5 shrink-0" />
                        <span>Data antar-bulan tersimpan terpisah dan tidak akan saling timpa atau hilang.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Periode: 1 - {daysInMonth} {currentMonthInfo.name} {selectedPeriod.year} (Rekap Bulanan) • <strong className="text-zinc-800 font-semibold">{totalVolume.toLocaleString('id-ID')} Total Paket</strong></span>
                <span className="text-zinc-300">•</span>
                {cloudStatus === 'synced' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700" title="Data tersimpan & sinkron otomatis di Server Supabase">
                    <Cloud className="w-3 h-3" />
                    <span>Cloud Sync</span>
                  </span>
                ) : cloudStatus === 'syncing' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700" title="Menyimpan ke Server Supabase...">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </span>
                ) : cloudStatus === 'error' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600" title="Koneksi Supabase bermasalah, tersimpan di browser sementara">
                    <Cloud className="w-3 h-3" />
                    <span>Sync Offline</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400" title="Database Cloud belum dihubungkan (tersimpan di memori browser)">
                    <Cloud className="w-3 h-3" />
                    <span>Lokal</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onOpenSop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-md transition-colors cursor-pointer"
              title="Lihat Standar Operasional Prosedur"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>SOP Gudang</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Upload Excel / CSV</span>
            </button>

            <button
              onClick={onOpenInput}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Data Harian</span>
            </button>

            <button
              onClick={onExportData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md border border-zinc-200 transition-colors cursor-pointer"
              title="Export CSV / Laporan"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Tombol Hapus Semua Data */}
            <button
              onClick={onOpenClearModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-rose-700 hover:bg-rose-50 rounded-md border border-zinc-200 hover:border-rose-200 transition-colors cursor-pointer"
              title="Hapus / Kosongkan Seluruh Data"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Hapus Data</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
