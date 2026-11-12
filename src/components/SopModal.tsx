import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  ShieldCheck, 
  CheckSquare, 
  Square, 
  FileCheck2, 
  X,
  Truck,
  Users
} from 'lucide-react';

export interface SopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SopModal: React.FC<SopModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
              <ClipboardCheck className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                SOP Operasional Gudang, Packing & Ekspedisi
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Panduan standar kerja tim fulfillment, aturan backup leader, dan serah terima kurir.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-700">
          <SopContent />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Terakhir direvisi: <strong>Oktober (Team Leader: Hambali)</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Saya Paham & Siap Terapkan
          </button>
        </div>

      </div>
    </div>
  );
};

export const SopContent: React.FC = () => {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    pagi_briefing: true,
    cek_absen: true,
    kuota_staff: true,
    cut_off_instant: false,
    cut_off_reguler: false,
    reconcile_malam: false,
  });

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SOP Backup Leader & Status Off */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
        <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-amber-800" />
          SOP 01: Penanganan Status "0" (Off) & Protokol Cadangan (Leader: Hambali)
        </h3>
        <div className="space-y-2 text-amber-900 leading-relaxed text-xs">
          <p>
            <strong>1. Ketentuan Status "0":</strong> Nilai 0 di lembar laporan otomatis dicatat sebagai <em>Off (Libur Shift Resmi / Cuti)</em>, bukan alfa atau pengurangan performa.
          </p>
          <p>
            <strong>2. Peran Team Leader (Hambali):</strong> Hambali bertindak sebagai <em>Leader pengawas sekaligus Buffer Cadangan</em>. Pada kondisi normal (4 staff inti hadir), tugasnya fokus pada quality check, rekonsiliasi data, dan koordinasi dengan koordinator ekspedisi.
          </p>
          <p>
            <strong>3. Pemicu Turun Lapangan (Trigger Backup):</strong> Apabila terjadi salah satu kondisi berikut:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dua atau lebih staff inti sedang libur/off di hari yang sama.</li>
            <li>Lonjakan pesanan harian melampaui <strong>1.000 paket</strong> (seperti peak 5 & 10 Oktober).</li>
            <li>Salah satu staff mengalami kendala darurat sakit di tengah jam kerja.</li>
          </ul>
          <p>
            Maka Hambali <strong>wajib turun tangan langsung mengisi meja packing</strong> dan mengambil porsi hingga 300–500 paket agar SLA pesanan tidak terlambat.
          </p>
        </div>
      </div>

      {/* 2. Pembagian Kuota Packing */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-800" />
          SOP 02: Pembagian Kuota Packing & Target Kecepatan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
            <span className="font-semibold text-zinc-900 block mb-1">Target Per Jam</span>
            <p className="text-zinc-600 text-[11px]">
              Setiap staff ditargetkan mengemas <strong>30 - 45 paket per jam</strong> (tergantung variasi produk bubble wrap / kardus).
            </p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
            <span className="font-semibold text-zinc-900 block mb-1">Prinsip Kesetaraan</span>
            <p className="text-zinc-600 text-[11px]">
              Total order harian dibagi rata secara proporsional kepada seluruh staff yang bertugas di hari tersebut tanpa diskriminasi.
            </p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
            <span className="font-semibold text-zinc-900 block mb-1">Quality Inspection</span>
            <p className="text-zinc-600 text-[11px]">
              Wajib menempel stiker Fragile untuk barang pecah belah & barcode resi harus dapat di-scan 100% tanpa lecek.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Cut-Off Time Ekspedisi */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-800" />
          SOP 03: Jadwal Cut-Off Time & Serah Terima Ekspedisi
        </h3>
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs border border-zinc-200">
            <thead className="bg-zinc-100 text-zinc-700">
              <tr>
                <th className="p-2 border-b">Layanan Kurir</th>
                <th className="p-2 border-b">Ekspedisi Terkait</th>
                <th className="p-2 border-b">Batas Akhir Packing (Cut-Off)</th>
                <th className="p-2 border-b">Jadwal Pick-up Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="p-2 font-semibold text-zinc-900">Kurir Reguler</td>
                <td className="p-2">JNE, SPX, JNT, AnterAja, SiCepat</td>
                <td className="p-2 font-mono text-emerald-700">Pukul 16:00 WIB</td>
                <td className="p-2 text-zinc-600">Pukul 16:30 - 17:30 WIB (Truk Logistik)</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold text-zinc-900">Kurir Instant / Sameday</td>
                <td className="p-2">Gojek, Gosend, SPX Instan, Paxel</td>
                <td className="p-2 font-mono text-amber-700">Maks. 30 Menit sejak order</td>
                <td className="p-2 text-zinc-600">Sesuai penjemputan driver on-demand</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold text-zinc-900">Kargo & Berat</td>
                <td className="p-2">JNT Cargo, Pos Aja, SAP</td>
                <td className="p-2 font-mono text-zinc-700">Pukul 14:00 WIB</td>
                <td className="p-2 text-zinc-600">Pukul 15:00 WIB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Rekonsiliasi & Validasi Malam */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-800" />
          SOP 04: Rekonsiliasi Malam & Validasi "Zero Discrepancy"
        </h3>
        <p className="text-zinc-600 leading-relaxed text-xs">
          Setiap malam sebelum gudang tutup (pukul 19:30 WIB):
        </p>
        <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1.5 text-xs text-zinc-700">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Driver wajib menandatangani lembar manifest serah terima fisik kurir.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Team Leader menghitung total paket yang diselesaikan tiap staff dan menjumlahkan seluruh kurir.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <strong className="text-zinc-900">Total Pengiriman Kurir HARUS SAMA 100% dengan Total Output Staff.</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Jika terdapat selisih paket tertinggal atau salah scan resi, wajib diselesaikan sebelum data diinput ke dashboard.</span>
          </div>
        </div>
      </div>

      {/* 5. Interactive Daily Operational Checklist */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2 mb-2">
          <ClipboardCheck className="w-4 h-4 text-emerald-800" />
          Checklist Operasional Harian Gudang (Klik untuk Checklist)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
          {[
            { key: 'pagi_briefing', label: '08:30 WIB: Morning briefing & pengecekan ketersediaan bubble wrap / lakban' },
            { key: 'cek_absen', label: '08:45 WIB: Cek absensi staff. Jika ada yang off (0), tentukan apakah Leader turun cadangan' },
            { key: 'kuota_staff', label: '09:00 WIB: Distribusi invoice batch pesanan pagi ke meja masing-masing staff' },
            { key: 'cut_off_instant', label: '14:00 WIB: Audit paket instant & kargo telah diserahterimakan ke kurir' },
            { key: 'cut_off_reguler', label: '16:30 WIB: Handover paket reguler (JNE, SPX, JNT) ke truk logistik' },
            { key: 'reconcile_malam', label: '19:30 WIB: Rekonsiliasi resi manifest vs fisik, input data harian ke Dashboard ScentPack' },
          ].map((item) => (
            <div 
              key={item.key}
              onClick={() => toggleCheck(item.key)}
              className="flex items-start gap-2 p-2 bg-white rounded-lg border border-emerald-200/70 cursor-pointer hover:bg-emerald-50/50 transition-colors"
            >
              {checklist[item.key] ? (
                <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
              )}
              <span className={checklist[item.key] ? 'text-zinc-900 font-medium' : 'text-zinc-500'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

