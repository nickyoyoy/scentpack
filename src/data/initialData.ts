import { CourierMeta, StaffMeta, DailyRecord } from '../types/fulfillment';

// Data Initial Kurir & Staff
export const COURIERS_LIST: CourierMeta[] = [
  { id: 'jne', name: 'JNE', category: 'Reguler', color: '#16a34a' },
  { id: 'spx', name: 'SPX', category: 'Marketplace', color: '#ea580c' },
  { id: 'jnt', name: 'JNT', category: 'Reguler', color: '#dc2626' },
  { id: 'anteraja', name: 'ANTER AJA', category: 'Reguler', color: '#9333ea' },
  { id: 'sicepat', name: 'SICEPAT', category: 'Reguler', color: '#e11d48' },
  { id: 'lex_id', name: 'LEX ID', category: 'Marketplace', color: '#0284c7' },
  { id: 'paxel', name: 'PAXEL', category: 'Sameday/Cold', color: '#ca8a04' },
  { id: 'pos_aja', name: 'POS AJA', category: 'BUMN/Reguler', color: '#f97316' },
  { id: 'spx_instan', name: 'SPX INSTAN', category: 'Instant', color: '#c2410c' },
  { id: 'id_express', name: 'ID EXPRESS', category: 'Reguler', color: '#059669' },
  { id: 'gojek', name: 'GOJEK', category: 'Instant/SameDay', color: '#10b981' },
  { id: 'gosend', name: 'GOSEND', category: 'Instant', color: '#047857' },
  { id: 'jnt_cargo', name: 'JNT CARGO', category: 'Cargo/Heavy', color: '#b91c1c' },
  { id: 'jnt_vip', name: 'JNT VIP', category: 'Priority', color: '#991b1b' },
  { id: 'ninja_express', name: 'NINJA EXPRESS', category: 'Reguler', color: '#be123c' },
  { id: 'grab_instan', name: 'GRAB INSTAN', category: 'Instant', color: '#15803d' },
  { id: 'lion_express', name: 'LION EXPRESS', category: 'Air/Reguler', color: '#e11d48' },
  { id: 'sap', name: 'SAP', category: 'Cargo', color: '#475569' },
  { id: 'lainnya', name: 'Lainnya', category: 'Lain-lain', color: '#71717a' },
];

export const STAFF_LIST: StaffMeta[] = [
  { id: 'dina', name: 'Dina', role: 'Staff Fulfillment', isLeadBackup: false, avatar: 'DN' },
  { id: 'hambali', name: 'Hambali', role: 'Team Leader / Backup', isLeadBackup: true, avatar: 'HB' },
  { id: 'jihan', name: 'Jihan', role: 'Staff Fulfillment', isLeadBackup: false, avatar: 'JH' },
  { id: 'wawan', name: 'Wawan', role: 'Staff Fulfillment', isLeadBackup: false, avatar: 'WW' },
  { id: 'windi', name: 'Windi', role: 'Staff Fulfillment', isLeadBackup: false, avatar: 'WD' },
];

// Helper: buat data kosong bersih (all 0) sesuai jumlah hari dalam bulan
export const createEmptyDailyRecord = (list: { id: string }[], daysCount: number = 31): DailyRecord => {
  const result: DailyRecord = {};
  list.forEach((item) => {
    result[item.id] = new Array(daysCount).fill(0);
  });
  return result;
};

// Data Default Kosong Bersih (All 0)
export const EMPTY_EXPEDITION_DAILY: DailyRecord = createEmptyDailyRecord(COURIERS_LIST, 31);
export const EMPTY_STAFF_DAILY: DailyRecord = createEmptyDailyRecord(STAFF_LIST, 31);

// Data Asli Oktober (cadangan jika diperlukan)
export const SAMPLE_OCTOBER_EXPEDITION_DAILY: DailyRecord = {
  jnt: [129, 133, 180, 203, 361, 250, 337, 260, 217, 180, 203, 322, 159, 219, 146, 173, 141, 122, 147, 105, 67, 79, 127, 127, 118, 206, 186, 166, 144, 161, 164],
  jnt_vip: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  jnt_cargo: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  spx: [317, 272, 220, 426, 469, 312, 307, 294, 222, 437, 347, 323, 142, 155, 159, 157, 134, 98, 109, 137, 142, 111, 159, 159, 196, 155, 134, 166, 171, 184, 194],
  spx_instan: [1, 2, 4, 3, 0, 1, 1, 0, 1, 4, 3, 0, 0, 1, 3, 1, 0, 0, 3, 2, 1, 1, 0, 0, 0, 2, 2, 2, 3, 2, 5],
  jne: [282, 256, 311, 388, 565, 475, 597, 400, 377, 396, 412, 432, 340, 399, 276, 284, 224, 206, 235, 217, 139, 158, 225, 225, 201, 310, 330, 276, 264, 261, 327],
  pos_aja: [0, 0, 2, 0, 2, 2, 5, 6, 5, 8, 12, 5, 2, 4, 5, 0, 0, 1, 1, 0, 0, 1, 4, 4, 3, 4, 2, 0, 1, 1, 5],
  ninja_express: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  lex_id: [5, 0, 4, 0, 2, 4, 2, 5, 5, 28, 0, 15, 4, 2, 3, 5, 4, 0, 7, 9, 4, 2, 4, 4, 0, 18, 1, 5, 3, 3, 3],
  paxel: [2, 0, 3, 0, 2, 4, 2, 4, 4, 5, 0, 3, 2, 1, 4, 5, 1, 0, 4, 5, 6, 2, 0, 0, 0, 8, 1, 3, 4, 5, 6],
  sicepat: [2, 0, 0, 8, 1, 0, 0, 3, 4, 4, 4, 1, 5, 18, 12, 18, 8, 15, 15, 11, 15, 12, 14, 14, 12, 13, 11, 13, 6, 22, 12],
  id_express: [0, 0, 0, 0, 0, 0, 1, 0, 0, 9, 2, 1, 1, 2, 2, 1, 1, 0, 2, 1, 3, 2, 6, 6, 0, 0, 1, 2, 0, 0, 4],
  grab_instan: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  gojek: [0, 1, 1, 1, 3, 1, 0, 2, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
  lion_express: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  sap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  lainnya: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  gosend: [0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  anteraja: [0, 0, 0, 0, 0, 0, 0, 0, 28, 72, 0, 177, 39, 84, 44, 24, 29, 24, 21, 30, 23, 18, 37, 37, 33, 41, 32, 41, 30, 42, 41],
};

export const SAMPLE_OCTOBER_STAFF_DAILY: DailyRecord = {
  dina: [185, 166, 241, 0, 470, 262, 313, 243, 215, 572, 0, 0, 173, 208, 131, 134, 0, 233, 137, 130, 101, 78, 116, 116, 188, 190, 175, 169, 157, 171, 254],
  hambali: [0, 0, 0, 512, 0, 0, 0, 0, 0, 572, 0, 319, 0, 0, 131, 133, 180, 0, 0, 0, 0, 77, 115, 115, 188, 0, 0, 0, 0, 0, 0],
  jihan: [185, 166, 242, 0, 471, 262, 313, 244, 215, 0, 328, 320, 174, 209, 131, 134, 181, 0, 136, 129, 100, 77, 115, 115, 187, 189, 175, 169, 157, 170, 0],
  wawan: [185, 167, 242, 0, 470, 262, 313, 243, 215, 0, 328, 320, 174, 209, 131, 134, 0, 233, 136, 129, 100, 77, 115, 115, 0, 189, 175, 168, 156, 170, 254],
  windi: [184, 166, 0, 512, 0, 263, 314, 244, 215, 0, 328, 320, 174, 209, 131, 133, 181, 0, 136, 129, 100, 77, 115, 115, 0, 190, 176, 169, 157, 171, 255],
};

// Data Asli Multi-Periode (Tersimpan aman per YYYY-MM)
export const INITIAL_MULTI_EXPEDITION: Record<string, DailyRecord> = {
  '2026-10': SAMPLE_OCTOBER_EXPEDITION_DAILY,
};

export const INITIAL_MULTI_STAFF: Record<string, DailyRecord> = {
  '2026-10': SAMPLE_OCTOBER_STAFF_DAILY,
};

// Hitung total harian otomatis sesuai jumlah hari dalam bulan
export const calculateDailyTotals = (dataRecord?: DailyRecord | null, daysCount: number = 31): number[] => {
  const totals = new Array(daysCount).fill(0);
  if (!dataRecord) return totals;
  Object.values(dataRecord).forEach((dailyArr) => {
    if (Array.isArray(dailyArr)) {
      dailyArr.forEach((val, idx) => {
        if (idx < daysCount) {
          totals[idx] += Number(val) || 0;
        }
      });
    }
  });
  return totals;
};

