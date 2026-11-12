import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  X 
} from 'lucide-react';

export interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: (clearOnlyCurrentMonth: boolean) => void;
  onConfirmRestore: () => void;
  currentPeriodName?: string;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirmClear, 
  onConfirmRestore,
  currentPeriodName = 'Bulan Ini'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">
                Konfirmasi Kosongkan / Hapus Data
              </h2>
              <p className="text-[11px] text-zinc-500">
                Pembersihan data operasional dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-zinc-600">
          <p className="leading-relaxed">
            Pilih cakupan data yang ingin Anda kosongkan:
          </p>
          
          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
            <div className="font-semibold text-amber-950 flex items-center gap-1.5">
              <span>Rekomendasi Aman:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Sebaiknya hanya kosongkan data <strong>{currentPeriodName}</strong> jika ingin mengulang pencatatan bulan ini, agar data bulan lainnya tetap tersimpan rapi sebagai arsip historis.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] flex items-center justify-between">
            <span>Ingin kembalikan ke data contoh awal?</span>
            <button
              type="button"
              onClick={() => {
                onConfirmRestore();
                onClose();
              }}
              className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-700 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset ke Data Asli
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmClear(true);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title={`Hanya kosongkan data ${currentPeriodName}`}
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-700" />
            <span>Hanya {currentPeriodName}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmClear(false);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Kosongkan semua data dari semua bulan"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Semua Periode</span>
          </button>
        </div>

      </div>
    </div>
  );
};

