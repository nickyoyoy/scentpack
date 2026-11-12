// TypeScript Type Definitions for ScentPack (SCENTPLUS ERP Fulfillment & Ekspedisi)
// Aligned with SCENTPLUS Next.js 16 + Drizzle ORM + Supabase architecture

export interface MonthPeriod {
  year: number;  // e.g. 2026
  month: number; // 1 to 12
}

export interface MonthInfo {
  number: number;
  name: string;
  short: string;
}

export const INDONESIAN_MONTHS: MonthInfo[] = [
  { number: 1, name: 'Januari', short: 'Jan' },
  { number: 2, name: 'Februari', short: 'Feb' },
  { number: 3, name: 'Maret', short: 'Mar' },
  { number: 4, name: 'April', short: 'Apr' },
  { number: 5, name: 'Mei', short: 'Mei' },
  { number: 6, name: 'Juni', short: 'Jun' },
  { number: 7, name: 'Juli', short: 'Jul' },
  { number: 8, name: 'Agustus', short: 'Agu' },
  { number: 9, name: 'September', short: 'Sep' },
  { number: 10, name: 'Oktober', short: 'Okt' },
  { number: 11, name: 'November', short: 'Nov' },
  { number: 12, name: 'Desember', short: 'Des' },
];

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getPeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getMonthInfo(month: number): MonthInfo {
  return INDONESIAN_MONTHS[month - 1] || INDONESIAN_MONTHS[9];
}

export type CourierCategory =
  | 'Reguler'
  | 'Marketplace'
  | 'Instant'
  | 'Sameday/Cold'
  | 'BUMN/Reguler'
  | 'Instant/SameDay'
  | 'Cargo/Heavy'
  | 'Priority'
  | 'Air/Reguler'
  | 'Cargo'
  | string;

export interface CourierMeta {
  id: string;
  name: string;
  category: CourierCategory;
  color: string;
}

export interface StaffMeta {
  id: string;
  name: string;
  role: string;
  isLeadBackup: boolean;
  avatar: string;
}

export type DailyRecord = Record<string, number[]>;

export type ActiveTab = 'overview' | 'ekspedisi' | 'staff' | 'matrix';

export interface PeakDayInfo {
  day: number;
  volume: number;
}

export interface TopRankInfo {
  name: string;
  volume: number;
  percentage: number;
}

export interface LeaderBackupStats {
  activeDays: number;
  totalVolume: number;
}

export interface KpiStats {
  totalPackages: number;
  dailyAvg: number;
  peakDay: PeakDayInfo;
  topCourier: TopRankInfo;
  topStaff: TopRankInfo;
  leaderBackupStats: LeaderBackupStats;
}

export interface StaffEfficiencyRow {
  id: string;
  name: string;
  role: string;
  isLeadBackup: boolean;
  avatar: string;
  activeDays: number;
  offDays: number;
  maxDayVolume: number;
  avgPerActiveDay: number;
  totalOutput: number;
  portion: number;
}

export interface ScanLogItem {
  barcode: string;
  courier: string;
  tableId?: string | number;
  staffName?: string;
  timestamp?: string;
}

export interface FairDivisionQuota {
  staffId: string;
  staffName: string;
  baseQuota: number;
  remainderAssigned: number;
  totalQuota: number;
}

export interface UploadedPayload {
  expeditionData?: DailyRecord;
  staffData?: DailyRecord;
  sourceName?: string;
  dateIndex?: number;
  totalVolume?: number;
}

