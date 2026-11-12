import React, { useState } from 'react';
import { 
  X, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Truck, 
  Users 
} from 'lucide-react';
import { CourierMeta, StaffMeta, MonthPeriod, getMonthInfo } from '../types/fulfillment';

export interface DataEntryPayload {
  day: number;
  couriers: Record<string, number>;
  staff: Record<string, number>;
  total: number;
}

export interface DataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: DataEntryPayload) => void;
  couriersList: CourierMeta[];
  staffList: StaffMeta[];
  currentPeriod: MonthPeriod;
  daysInMonth: number;
  initialDay?: number;
}

export const DataEntryModal: React.FC<DataEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  couriersList, 
  staffList, 
  currentPeriod,
  daysInMonth,
  initialDay = 1 
}) => {
  if (!isOpen) return null;

  const currentMonthInfo = getMonthInfo(currentPeriod.month);
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  
  // State for couriers & staff inputs for selected day
  const [courierInputs, setCourierInputs] = useState<Record<string, number>>(
    couriersList.reduce((acc, c) => ({ ...acc, [c.id]: 0 }), {})
  );

  const [staffInputs, setStaffInputs] = useState<Record<string, number>>(
    staffList.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {})
  );

  // Totals
  const totalEkspedisi = Object.values(courierInputs).reduce((a, b) => Number(a || 0) + Number(b || 0), 0);
  const totalStaff = Object.values(staffInputs).reduce((a, b) => Number(a || 0) + Number(b || 0), 0);
  const isBalanced = totalEkspedisi === totalStaff && totalEkspedisi > 0;
  const difference = totalEkspedisi - totalStaff;

  const handleCourierChange = (id: string, val: string) => {
    setCourierInputs(prev => ({ ...prev, [id]: Math.max(0, parseInt(val, 10) || 0) }));
  };

  const handleStaffChange = (id: string, val: string) => {
    setStaffInputs(prev => ({ ...prev, [id]: Math.max(0, parseInt(val, 10) || 0) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      day: selectedDay,
      couriers: courierInputs,
      staff: staffInputs,
      total: totalEkspedisi
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Input & Update Data Harian
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Masukkan jumlah paket fisik per ekspedisi dan per staff untuk tanggal yang dipilih.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Date Selector */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <label className="text-xs font-semibold text-zinc-700">
              Pilih Tanggal:
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
              className="bg-white border border-zinc-300 rounded-lg px-3 py-1 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 cursor-pointer"
            >
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d} {currentMonthInfo.name} {currentPeriod.year}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-400">
              (Status & Rekonsiliasi Hari Kerja)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Input Ekspedisi */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-800" />
                  1. Ekspedisi / Kurir
                </h3>
                <span className="font-mono text-xs font-semibold text-emerald-800">
                  Subtotal: {totalEkspedisi} pkt
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {couriersList.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-zinc-700 truncate font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={courierInputs[c.id] || ''}
                      onChange={(e) => handleCourierChange(c.id, e.target.value)}
                      placeholder="0"
                      className="w-24 text-right px-2.5 py-1 font-mono text-xs border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Input Staff */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-800" />
                  2. Output Staff Packing
                </h3>
                <span className="font-mono text-xs font-semibold text-emerald-800">
                  Subtotal: {totalStaff} pkt
                </span>
              </div>

              <div className="space-y-2">
                {staffList.map((s) => (
                  <div 
                    key={s.id} 
                    className={`flex items-center justify-between gap-3 text-xs p-2 rounded-lg border ${
                      s.isLeadBackup ? 'bg-amber-50/50 border-amber-200' : 'bg-zinc-50/50 border-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                        {s.name}
                        {s.isLeadBackup && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                            Leader / Backup
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {staffInputs[s.id] === 0 ? 'Isi 0 jika Libur / Off' : 'Jumlah paket dipacking'}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={staffInputs[s.id] || ''}
                      onChange={(e) => handleStaffChange(s.id, e.target.value)}
                      placeholder="0"
                      className="w-24 text-right px-2.5 py-1 font-mono text-xs border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700 bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-zinc-100 rounded-lg text-[11px] text-zinc-600">
                <strong>Catatan SOP:</strong> Jika staff tidak masuk/off, biarkan nilainya <strong>0</strong>.
              </div>
            </div>

          </div>

          {/* Validation Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-colors ${
            isBalanced 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : totalEkspedisi === 0 && totalStaff === 0
              ? 'bg-zinc-100 border-zinc-200 text-zinc-600'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="font-semibold block">
                  {isBalanced 
                    ? 'Validasi Sukses: Total Ekspedisi & Output Staff Sinkron (100% Klop)' 
                    : totalEkspedisi === 0 && totalStaff === 0
                    ? 'Silakan isi angka pengiriman dan output staff.'
                    : `Perhatian: Ada Selisih ${Math.abs(difference)} Paket antara Kurir vs Staff!`}
                </span>
                <span className="text-[11px] opacity-80">
                  Total Kurir: {totalEkspedisi} | Total Staff: {totalStaff}
                </span>
              </div>
            </div>

            <div className="font-mono font-bold text-sm">
              {difference === 0 ? '✓ 0 Selisih' : `${difference > 0 ? '+' : ''}${difference}`}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data Tanggal {selectedDay}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

