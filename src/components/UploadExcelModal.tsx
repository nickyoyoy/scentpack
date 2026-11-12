import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileText,
  Users,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { COURIERS_LIST, STAFF_LIST } from '../data/initialData';
import { MonthPeriod, getDaysInMonth, getMonthInfo } from '../types/fulfillment';

export interface ScanLogDaySummary {
  day: number;
  total: number;
  staffList: string[];
  allocations: Record<string, number>;
  quotient: number;
  remainder: number;
}

export interface ScanLogResult {
  type: 'RAW_SCAN_LOG';
  sheetName: string;
  fileName: string;
  fileSize: string;
  detectedDays: number[];
  detectedMonth?: number;
  detectedYear?: number;
  totalScanned: number;
  expeditionMatrix: Record<string, number[]>;
  staffMatrix: Record<string, number[]>;
  dayBreakdowns: Record<number, ScanLogDaySummary>;
  rawRows: number;
}

export interface MatrixRekapResult {
  type: 'MATRIX_REKAP';
  fileName: string;
  fileSize: string;
  detectedMonth?: number;
  detectedYear?: number;
  staffMatrix: Record<string, number[]> | null;
  expeditionMatrix: Record<string, number[]> | null;
  autoStaffMatrix: Record<string, number[]> | null;
  hasStaff: boolean;
  hasExpedition: boolean;
  detectedDayIndices: number[];
  staffCount: number;
  courierCount: number;
  calculatedTotal: number;
  wasAutoDistributed?: boolean;
}

export type UploadResult = ScanLogResult | MatrixRekapResult;

export interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUploaded: (data: UploadResult) => void;
  currentPeriod: MonthPeriod;
  daysInMonth: number;
}

export const UploadExcelModal: React.FC<UploadExcelModalProps> = ({ 
  isOpen, 
  onClose, 
  onDataUploaded,
  currentPeriod,
  daysInMonth
}) => {
  if (!isOpen) return null;

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<UploadResult | null>(null);
  const [autoDistributeStaff, setAutoDistributeStaff] = useState<boolean>(true);

  // Normalize courier name helper
  const mapCourierId = (cellValue: unknown): string | null => {
    if (!cellValue) return null;
    const clean = String(cellValue).toLowerCase().trim();
    if (clean.includes('j&t cargo') || clean.includes('jnt cargo')) return 'jnt_cargo';
    if (clean.includes('j&t vip') || clean.includes('jnt vip')) return 'jnt_vip';
    if (clean.includes('j&t') || clean.includes('jnt')) return 'jnt';
    if (clean.includes('spx instan') || clean.includes('shopee instan')) return 'spx_instan';
    if (clean.includes('spx') || clean.includes('shopee')) return 'spx';
    if (clean.includes('jne')) return 'jne';
    if (clean.includes('anter aja') || clean.includes('anteraja')) return 'anteraja';
    if (clean.includes('sicepat')) return 'sicepat';
    if (clean.includes('pos')) return 'pos_aja';
    if (clean.includes('lex')) return 'lex_id';
    if (clean.includes('paxel')) return 'paxel';
    if (clean.includes('id express') || clean.includes('idexpress')) return 'id_express';
    if (clean.includes('gosend')) return 'gosend';
    if (clean.includes('gojek')) return 'gojek';
    if (clean.includes('ninja')) return 'ninja_express';
    if (clean.includes('grab')) return 'grab_instan';
    if (clean.includes('lion')) return 'lion_express';
    if (clean.includes('sap')) return 'sap';
    if (clean.includes('lainnya') || clean.includes('other') || clean.includes('lain')) return 'lainnya';
    return null;
  };

  // Normalize staff id helper
  const mapStaffId = (cellValue: unknown): string | null => {
    if (!cellValue) return null;
    const clean = String(cellValue).toLowerCase().trim();
    if (clean.includes('dina')) return 'dina';
    if (clean.includes('hambali')) return 'hambali';
    if (clean.includes('jihan')) return 'jihan';
    if (clean.includes('wawan')) return 'wawan';
    if (clean.includes('windi')) return 'windi';
    return null;
  };

  // Parse members list from cell (e.g. "WINDI, HAMBALI" -> ['windi', 'hambali'])
  const parseStaffFromCell = (cellValue: unknown): string[] => {
    if (!cellValue) return [];
    const str = String(cellValue);
    const parts = str.split(/[,;&+/]|\bdan\b|\band\b/i).map(s => s.trim()).filter(Boolean);
    const staffIds: string[] = [];
    parts.forEach(p => {
      const sId = mapStaffId(p);
      if (sId && !staffIds.includes(sId)) {
        staffIds.push(sId);
      }
    });
    return staffIds;
  };

  // Robust date extraction from timestamp cell (e.g. "04/10/2026, 16:57:04" -> day 4, month 10, year 2026)
  const parseDateFromTimestamp = (val: unknown): { day: number; month?: number; year?: number } | null => {
    if (!val) return null;
    if (typeof val === 'number') {
      if (val > 40000 && val < 60000) {
        const date = new Date((val - 25569) * 86400 * 1000);
        return {
          day: date.getUTCDate(),
          month: date.getUTCMonth() + 1,
          year: date.getUTCFullYear(),
        };
      }
      if (val >= 1 && val <= 31) return { day: val };
    }
    const str = String(val).trim();

    // 1. DD/MM/YYYY or DD-MM-YYYY (Indonesian standard: "10/10/2026, 16:41:00", "04/11/2026, 16:57:04")
    const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const month = parseInt(dmy[2], 10);
      let year = parseInt(dmy[3], 10);
      if (year < 100) year += 2000;
      if (day >= 1 && day <= 31) {
        return { 
          day, 
          month: (month >= 1 && month <= 12) ? month : undefined, 
          year: (year >= 2020 && year <= 2040) ? year : undefined 
        };
      }
    }

    // 2. YYYY-MM-DD or YYYY/MM/DD
    const ymd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = parseInt(ymd[2], 10);
      const day = parseInt(ymd[3], 10);
      if (day >= 1 && day <= 31) {
        return { 
          day, 
          month: (month >= 1 && month <= 12) ? month : undefined, 
          year: (year >= 2020 && year <= 2040) ? year : undefined 
        };
      }
    }

    // 3. Fallback DD/MM
    const subDmy = str.match(/(\d{1,2})[/-](\d{1,2})/);
    if (subDmy) {
      const day = parseInt(subDmy[1], 10);
      const month = parseInt(subDmy[2], 10);
      if (day >= 1 && day <= 31) {
        return { 
          day, 
          month: (month >= 1 && month <= 12) ? month : undefined 
        };
      }
    }

    return null;
  };

  const parseDayFromTimestamp = (val: unknown): number | null => {
    return parseDateFromTimestamp(val)?.day ?? null;
  };

  // Robust date extraction from column headers (for matrix sheets)
  const extractDayFromHeader = (h: unknown): number | null => {
    if (typeof h === 'number') {
      if (h >= 1 && h <= 31) return h;
      if (h > 40000 && h < 55000) {
        const date = new Date((h - 25569) * 86400 * 1000);
        return date.getUTCDate();
      }
      return null;
    }

    const str = String(h || '').trim().toLowerCase();
    if (!str || str.includes('total') || str.includes('jumlah') || str.includes('resi') || str.includes('meja') || str.includes('kode')) return null;

    const monthMatch = str.match(/(\d{1,2})\s*(?:jan|feb|mar|apr|mei|may|jun|jul|agu|aug|sep|okt|oct|nov|des|dec)/i);
    if (monthMatch) {
      const d = parseInt(monthMatch[1], 10);
      if (d >= 1 && d <= 31) return d;
    }

    const tglMatch = str.match(/(?:tgl|tanggal|day)\s*(\d{1,2})/i);
    if (tglMatch) {
      const d = parseInt(tglMatch[1], 10);
      if (d >= 1 && d <= 31) return d;
    }

    const datePattern = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || str.match(/(\d{1,2})[-/](\d{1,2})/);
    if (datePattern) {
      const d = parseInt(datePattern[3] || datePattern[1], 10);
      if (d >= 1 && d <= 31) return d;
    }

    const bareNumMatch = str.match(/^0?([1-9]|[12][0-9]|3[01])$/);
    if (bareNumMatch) {
      return parseInt(bareNumMatch[1], 10);
    }

    return null;
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Process Excel File (Supports Multi-day Raw Scan Logs & Spreadsheet Matrix)
  const processFile = (selectedFile: File) => {
    setErrorMsg(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Month & Year frequency trackers
        const detectedMonths: Record<number, number> = {};
        const detectedYears: Record<number, number> = {};

        // 1. Structures for RAW SCAN LOG
        let hasScanLog = false;
        let totalScanRowsCount = 0;
        let scanLogSheetName = '';
        const dayStaffGroups: Record<number, Record<string, { members: string[]; count: number }>> = {};
        const dayCourierCounts: Record<number, Record<string, number>> = {};
        const detectedDaysSet = new Set<number>();

        // 2. Structures for MATRIX SHEET
        let hasMatrixExpedition = false;
        let hasMatrixStaff = false;
        const matrixStaffResult: Record<string, number[]> = {};
        const matrixExpeditionResult: Record<string, number[]> = {};
        let bestDayColMap: Record<number, number> = {};

        // Iterate over sheets
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rawJson = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: false });
          if (!rawJson || rawJson.length < 2) continue;

          // Check if sheet contains RAW BARCODE SCAN LOG
          let scanHeaderIdx = -1;
          for (let r = 0; r < Math.min(5, rawJson.length); r++) {
            const rowStr = JSON.stringify(rawJson[r] || []).toLowerCase();
            if ((rowStr.includes('waktu') || rowStr.includes('scan') || rowStr.includes('tanggal')) && 
                (rowStr.includes('resi') || rowStr.includes('barcode') || rowStr.includes('expedisi') || rowStr.includes('ekspedisi') || rowStr.includes('anggota'))) {
              scanHeaderIdx = r;
              break;
            }
          }

          if (scanHeaderIdx !== -1) {
            hasScanLog = true;
            if (!scanLogSheetName) scanLogSheetName = sheetName;

            const headers = (rawJson[scanHeaderIdx] || []).map(h => String(h || '').trim().toLowerCase());
            const idxTime = headers.findIndex(h => h.includes('waktu') || h.includes('scan') || h.includes('tanggal') || h.includes('time') || h.includes('date'));
            const idxResi = headers.findIndex(h => h.includes('resi') || h.includes('barcode') || h.includes('tracking') || h.includes('awb'));
            // MATCH "Anggota", "Staff", "Petugas", "Operator", "Tim", etc.
            const idxStaff = headers.findIndex(h => h.includes('anggota') || h.includes('staff') || h.includes('nama') || h.includes('petugas') || h.includes('operator') || h.includes('packer') || h.includes('tim'));
            const idxExp = headers.findIndex(h => h.includes('expedisi') || h.includes('ekspedisi') || h.includes('kurir') || h.includes('courier') || h.includes('jasa'));

            const rows = rawJson.slice(scanHeaderIdx + 1).filter(r => r && r.length > 0 && (idxResi !== -1 ? r[idxResi] : true));

            rows.forEach((row) => {
              const timeVal = idxTime !== -1 ? row[idxTime] : null;
              const parsedDate = parseDateFromTimestamp(timeVal);
              if (!parsedDate || parsedDate.day < 1 || parsedDate.day > 31) return;

              const day = parsedDate.day;
              if (parsedDate.month) {
                detectedMonths[parsedDate.month] = (detectedMonths[parsedDate.month] || 0) + 1;
              }
              if (parsedDate.year) {
                detectedYears[parsedDate.year] = (detectedYears[parsedDate.year] || 0) + 1;
              }

              detectedDaysSet.add(day);
              const dayIdx = day - 1;
              totalScanRowsCount += 1;

              // 1. Courier Count (Fallback ke 'lainnya' jika kurir tidak dikenali)
              const expVal = idxExp !== -1 ? row[idxExp] : 'lainnya';
              const expId = mapCourierId(expVal) || 'lainnya';
              if (!dayCourierCounts[dayIdx]) dayCourierCounts[dayIdx] = {};
              dayCourierCounts[dayIdx][expId] = (dayCourierCounts[dayIdx][expId] || 0) + 1;

              // 2. Staff Members in "Anggota" Column
              const staffCell = idxStaff !== -1 ? row[idxStaff] : null;
              const staffMembers = parseStaffFromCell(staffCell);

              // Default if staff cell was empty: 4 core staff
              const resolvedMembers = staffMembers.length > 0 
                ? staffMembers 
                : ['dina', 'jihan', 'wawan', 'windi'];

              const staffKey = resolvedMembers.slice().sort().join(',');
              if (!dayStaffGroups[dayIdx]) dayStaffGroups[dayIdx] = {};
              if (!dayStaffGroups[dayIdx][staffKey]) {
                dayStaffGroups[dayIdx][staffKey] = {
                  members: resolvedMembers,
                  count: 0
                };
              }
              dayStaffGroups[dayIdx][staffKey].count += 1;
            });

            continue; // Continue to next sheet
          }

          // Check if sheet is MATRIX REKAP
          let bestHeaderRowIdx = -1;
          let tempDayColMap: Record<number, number> = {};

          for (let r = 0; r < Math.min(10, rawJson.length); r++) {
            const rowArr = rawJson[r] || [];
            const localMap: Record<number, number> = {};
            rowArr.forEach((cellVal, cIdx) => {
              const day = extractDayFromHeader(cellVal);
              if (day !== null) {
                localMap[day - 1] = cIdx;
              }
            });

            if (Object.keys(localMap).length > Object.keys(tempDayColMap).length) {
              tempDayColMap = localMap;
              bestHeaderRowIdx = r;
            }
          }

          if (Object.keys(tempDayColMap).length > 0 && bestHeaderRowIdx !== -1) {
            bestDayColMap = tempDayColMap;
            const dataRows = rawJson.slice(bestHeaderRowIdx + 1);

            dataRows.forEach(row => {
              if (!row || row.length === 0) return;

              const rowStr = JSON.stringify(row).toLowerCase();
              if (rowStr.includes('total')) return;

              let foundCourierId: string | null = null;
              let foundStaffId: string | null = null;

              for (let c = 0; c < row.length; c++) {
                const cellVal = row[c];
                if (!foundCourierId) foundCourierId = mapCourierId(cellVal);
                if (!foundStaffId) foundStaffId = mapStaffId(cellVal);
              }

              if (foundCourierId) {
                hasMatrixExpedition = true;
                if (!matrixExpeditionResult[foundCourierId]) {
                  matrixExpeditionResult[foundCourierId] = new Array(31).fill(0);
                }
                Object.entries(tempDayColMap).forEach(([dayIdx, colIdx]) => {
                  const rawVal = row[colIdx];
                  const cleanNum = parseInt(String(rawVal || '').replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(cleanNum)) {
                    matrixExpeditionResult[foundCourierId!][parseInt(dayIdx, 10)] = cleanNum;
                  }
                });
              }

              if (foundStaffId) {
                hasMatrixStaff = true;
                if (!matrixStaffResult[foundStaffId]) {
                  matrixStaffResult[foundStaffId] = new Array(31).fill(0);
                }
                Object.entries(tempDayColMap).forEach(([dayIdx, colIdx]) => {
                  const rawVal = row[colIdx];
                  const cleanNum = parseInt(String(rawVal || '').replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(cleanNum)) {
                    matrixStaffResult[foundStaffId!][parseInt(dayIdx, 10)] = cleanNum;
                  }
                });
              }
            });
          }
        }

        // ==========================================
        // FINAL SELECTION: SCAN LOG vs MATRIX REKAP
        // ==========================================

        // Determine detected month and year
        let detectedMonth: number | undefined;
        let maxMonthCount = 0;
        Object.entries(detectedMonths).forEach(([m, count]) => {
          if (count > maxMonthCount) {
            maxMonthCount = count;
            detectedMonth = parseInt(m, 10);
          }
        });

        let detectedYear: number | undefined;
        let maxYearCount = 0;
        Object.entries(detectedYears).forEach(([y, count]) => {
          if (count > maxYearCount) {
            maxYearCount = count;
            detectedYear = parseInt(y, 10);
          }
        });

        const activeYear = detectedYear || currentPeriod.year;
        const activeMonth = detectedMonth || currentPeriod.month;
        const daysCount = getDaysInMonth(activeYear, activeMonth);

        if (hasScanLog && detectedDaysSet.size > 0) {
          // Process scan log results with fair remainder integer division!
          const expeditionMatrix: Record<string, number[]> = {};
          COURIERS_LIST.forEach(c => {
            expeditionMatrix[c.id] = new Array(daysCount).fill(0);
          });

          const staffMatrix: Record<string, number[]> = {};
          STAFF_LIST.forEach(s => {
            staffMatrix[s.id] = new Array(daysCount).fill(0);
          });

          const dayBreakdowns: Record<number, ScanLogDaySummary> = {};

          // Populate expeditionMatrix
          Object.entries(dayCourierCounts).forEach(([dIdxStr, counts]) => {
            const dIdx = parseInt(dIdxStr, 10);
            if (dIdx < daysCount) {
              Object.entries(counts).forEach(([cId, count]) => {
                if (!expeditionMatrix[cId]) expeditionMatrix[cId] = new Array(daysCount).fill(0);
                expeditionMatrix[cId][dIdx] += count;
              });
            }
          });

          // Populate staffMatrix with integer division and fair remainder
          Object.entries(dayStaffGroups).forEach(([dIdxStr, groups]) => {
            const dIdx = parseInt(dIdxStr, 10);
            if (dIdx >= daysCount) return;
            const day = dIdx + 1;

            let dayTotalScans = 0;
            const allDayStaff = new Set<string>();
            const dayAllocations: Record<string, number> = {};
            let lastQuotient = 0;
            let lastRemainder = 0;

            Object.values(groups).forEach(({ members, count }) => {
              dayTotalScans += count;
              members.forEach(m => allDayStaff.add(m));

              const K = members.length;
              if (K > 0) {
                const q = Math.floor(count / K);
                const r = count % K;
                lastQuotient = q;
                lastRemainder = r;

                members.forEach((sId, idx) => {
                  const share = q + (idx < r ? 1 : 0);
                  if (!staffMatrix[sId]) staffMatrix[sId] = new Array(daysCount).fill(0);
                  staffMatrix[sId][dIdx] += share;
                  dayAllocations[sId] = (dayAllocations[sId] || 0) + share;
                });
              }
            });

            dayBreakdowns[day] = {
              day,
              total: dayTotalScans,
              staffList: Array.from(allDayStaff),
              allocations: dayAllocations,
              quotient: lastQuotient,
              remainder: lastRemainder
            };
          });

          const detectedDays = Array.from(detectedDaysSet).filter(d => d <= daysCount).sort((a, b) => a - b);

          setPreviewData({
            type: 'RAW_SCAN_LOG',
            sheetName: scanLogSheetName,
            fileName: selectedFile.name,
            fileSize: (selectedFile.size / 1024).toFixed(1) + ' KB',
            detectedDays,
            detectedMonth: activeMonth,
            detectedYear: activeYear,
            totalScanned: totalScanRowsCount,
            expeditionMatrix,
            staffMatrix,
            dayBreakdowns,
            rawRows: totalScanRowsCount
          });

        } else if (hasMatrixStaff || hasMatrixExpedition) {
          let autoStaff: Record<string, number[]> | null = null;
          let calculatedTotal = 0;

          if (hasMatrixExpedition) {
            const expTotals = new Array(daysCount).fill(0);
            Object.values(matrixExpeditionResult).forEach(daily => {
              daily.forEach((v, idx) => {
                if (idx < daysCount) {
                  expTotals[idx] += v || 0;
                }
              });
            });
            calculatedTotal = expTotals.reduce((a, b) => a + b, 0);

            if (!hasMatrixStaff) {
              autoStaff = {
                dina: new Array(daysCount).fill(0),
                jihan: new Array(daysCount).fill(0),
                wawan: new Array(daysCount).fill(0),
                windi: new Array(daysCount).fill(0),
                hambali: new Array(daysCount).fill(0),
              };

              const coreStaffIds = ['dina', 'jihan', 'wawan', 'windi'];
              expTotals.forEach((dayTotal, dayIdx) => {
                if (dayTotal > 0 && dayIdx < daysCount) {
                  const q = Math.floor(dayTotal / 4);
                  const r = dayTotal % 4;
                  coreStaffIds.forEach((sId, sIdx) => {
                    autoStaff![sId][dayIdx] = q + (sIdx < r ? 1 : 0);
                  });
                }
              });
            }
          }

          setPreviewData({
            type: 'MATRIX_REKAP',
            fileName: selectedFile.name,
            fileSize: (selectedFile.size / 1024).toFixed(1) + ' KB',
            detectedMonth: activeMonth,
            detectedYear: activeYear,
            staffMatrix: hasMatrixStaff ? matrixStaffResult : null,
            expeditionMatrix: hasMatrixExpedition ? matrixExpeditionResult : null,
            autoStaffMatrix: autoStaff,
            hasStaff: hasMatrixStaff,
            hasExpedition: hasMatrixExpedition,
            detectedDayIndices: Object.keys(bestDayColMap).map(Number),
            staffCount: hasMatrixStaff ? Object.keys(matrixStaffResult).length : 0,
            courierCount: hasMatrixExpedition ? Object.keys(matrixExpeditionResult).length : 0,
            calculatedTotal
          });
        } else {
          throw new Error('Sistem tidak menemukan kolom tanggal atau nama kurir/staff pada file ini. Pastikan format tabel memiliki kolom Waktu, Resi, Anggota, dan Expedisi.');
        }

        setParsing(false);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg('Gagal memproses file: ' + (error?.message || 'Format tidak dikenali.'));
        setParsing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Terjadi kesalahan saat membaca file.');
      setParsing(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Download Sample Template with BOTH Table 1 (Ekspedisi) and Table 2 (Staff)
  const downloadCompleteTemplate = () => {
    const wb = XLSX.utils.book_new();

    const wsExpData = [
      ["No", "Nama Ekspedisi", "1 Oktober", "2 Oktober", "TOTAL"],
      [1, "JNE", 282, 256, 538],
      [2, "SPX", 317, 272, 589],
      [3, "JNT", 129, 133, 262],
      ["TOTAL", "", 728, 661, 1389]
    ];
    const wsExp = XLSX.utils.aoa_to_sheet(wsExpData);
    XLSX.utils.book_append_sheet(wb, wsExp, "Tabel_Ekspedisi");

    const wsStaffData = [
      ["No", "Nama Staff", "1 Oktober", "2 Oktober", "TOTAL"],
      [1, "Dina", 182, 166, 348],
      [2, "Hambali", 0, 0, 0],
      [3, "Jihan", 182, 165, 347],
      [4, "Wawan", 182, 165, 347],
      [5, "Windi", 182, 165, 347],
      ["TOTAL", "", 728, 661, 1389]
    ];
    const wsStaff = XLSX.utils.aoa_to_sheet(wsStaffData);
    XLSX.utils.book_append_sheet(wb, wsStaff, "Tabel_Staff");

    XLSX.writeFile(wb, "Template_Lengkap_Ekspedisi_dan_Staff.xlsx");
  };

  const downloadScanLogTemplate = () => {
    const wsData = [
      ["Waktu", "Resi", "Meja", "Anggota", "Expedisi", "Kode", "Marketplace", "Status"],
      ["04/10/2026, 16:57:04", "TG3585933312", 1, "WINDI, HAMBALI", "JNE", "TG", "TIKTOK", "Tersimpan"],
      ["04/10/2026, 16:57:10", "JY1825713877", 1, "WINDI, HAMBALI", "JNT", "JY", "TIKTOK", "Tersimpan"],
      ["10/10/2026, 16:41:00", "11004497651235", 1, "DINA, HAMBALI", "ANTERAJA", "11", "-", "Tersimpan"],
      ["10/10/2026, 16:41:14", "2610107TMHU0", 1, "DINA, HAMBALI", "SPX INSTAN", "26", "-", "Tersimpan"],
      ["05/10/2026, 16:45:00", "1CSS12345678", 1, "JIHAN, HAMBALI, WINDI, WAWAN", "JNE", "1CSS", "TIKTOK", "Tersimpan"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Log_Scan_Resi");
    XLSX.writeFile(wb, "Template_Raw_Scan_Resi_Meja.xlsx");
  };

  const handleApply = () => {
    if (previewData) {
      const dataToApply = { ...previewData };
      if (dataToApply.type === 'MATRIX_REKAP') {
        if (!dataToApply.staffMatrix && autoDistributeStaff && dataToApply.autoStaffMatrix) {
          dataToApply.staffMatrix = dataToApply.autoStaffMatrix;
          dataToApply.hasStaff = true;
          dataToApply.wasAutoDistributed = true;
        }
      }
      onDataUploaded(dataToApply);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
              Upload Data Spreadsheet (XLSX / CSV)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Mendukung file Log Scan Resi (Multi-hari, baca kolom Anggota meja) dan Rekap Matriks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragActive 
                ? 'border-emerald-600 bg-emerald-50/50' 
                : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInput}
              className="hidden"
            />
            
            <div className="flex flex-col items-center">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-full mb-2 ring-1 ring-emerald-200">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-zinc-800">
                Tarik file Excel ke sini, atau{' '}
                <label 
                  htmlFor="file-upload" 
                  className="text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  pilih file
                </label>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Mendukung file Scan Resi Gudang (kolom Waktu, Resi, Anggota, Expedisi) & Matriks Bulanan
              </p>
            </div>
          </div>

          {/* Template Download Prompts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              onClick={downloadScanLogTemplate}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-zinc-700">
                <FileText className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>Template Log Scan Resi (Format Meja & Anggota)</span>
              </span>
              <Download className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              onClick={downloadCompleteTemplate}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-zinc-700">
                <Layers className="w-4 h-4 text-zinc-600 shrink-0" />
                <span>Template Matriks (Ekspedisi + Staff)</span>
              </span>
              <Download className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview: Multi-Day Raw Scan Log (READS "Anggota" Column per date!) */}
          {previewData && previewData.type === 'RAW_SCAN_LOG' && (() => {
            const mInfo = previewData.detectedMonth ? getMonthInfo(previewData.detectedMonth) : getMonthInfo(currentPeriod.month);
            const yVal = previewData.detectedYear || currentPeriod.year;
            const totalDays = getDaysInMonth(yVal, mInfo.number);
            return (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    Format Terdeteksi: Log Scan Resi ({mInfo.name} {yVal})
                  </span>
                  <span className="font-mono text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                    {previewData.totalScanned.toLocaleString('id-ID')} Total Resi
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-emerald-900 bg-white p-2.5 rounded-lg border border-emerald-200">
                  <div>Periode: <strong className="text-zinc-900">{mInfo.name} {yVal}</strong> ({totalDays} hr)</div>
                  <div>Rentang: <strong className="text-zinc-900">{previewData.detectedDays.length} hari</strong> ({previewData.detectedDays[0]} - {previewData.detectedDays[previewData.detectedDays.length - 1]} {mInfo.short})</div>
                  <div>Metode: <strong className="text-emerald-800 font-bold">Shared Table (Bagi Bulat)</strong></div>
                </div>

                {/* Rincian per Tanggal yang Terdeteksi */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-800 block">
                    Rincian Anggota Meja & Pembagian Kuota per Tanggal ({mInfo.name} {yVal}):
                  </span>
                
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {previewData.detectedDays.map((d) => {
                    const breakdown = previewData.dayBreakdowns[d];
                    if (!breakdown) return null;
                    const isTwoStaff = breakdown.staffList.length === 2;

                    return (
                      <div 
                        key={d} 
                        className={`p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs ${
                          isTwoStaff 
                            ? 'bg-amber-50/70 border-amber-300' 
                            : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-900 w-12 shrink-0">
                            {d} Okt:
                          </span>
                          <span className="font-mono font-semibold text-emerald-800">
                            {breakdown.total.toLocaleString('id-ID')} pkt
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            isTwoStaff 
                              ? 'bg-amber-200 text-amber-900' 
                              : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {breakdown.staffList.length} Anggota: {breakdown.staffList.map(s => s.toUpperCase()).join(', ')}
                          </span>
                        </div>

                        {/* Hasil Alokasi */}
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
                          {Object.entries(breakdown.allocations).map(([sId, count]) => (
                            <span key={sId} className="bg-zinc-100 px-1.5 py-0.5 rounded capitalize">
                              <strong>{sId}</strong>: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
            );
          })()}

          {/* Preview: Matrix Format */}
          {previewData && previewData.type === 'MATRIX_REKAP' && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Format Matriks Berhasil Dibaca!
                </span>
                <span className="font-mono text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                  {previewData.calculatedTotal.toLocaleString('id-ID')} Total Paket
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-emerald-800 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-emerald-200">
                <div>Ekspedisi Terdeteksi: <strong className="text-zinc-900">{previewData.courierCount} kurir</strong></div>
                <div>Staff di File: <strong className="text-zinc-900">{previewData.hasStaff ? `${previewData.staffCount} staff` : 'Tidak Ada di File'}</strong></div>
              </div>

              {!previewData.hasStaff && previewData.autoStaffMatrix && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="auto-distribute"
                      checked={autoDistributeStaff}
                      onChange={(e) => setAutoDistributeStaff(e.target.checked)}
                      className="mt-0.5 rounded border-amber-400 text-emerald-800 focus:ring-emerald-700 cursor-pointer"
                    />
                    <label htmlFor="auto-distribute" className="text-amber-950 font-semibold cursor-pointer">
                      Otomatis bagi rata kuota harian ke 4 Staff Inti sesuai SOP?
                    </label>
                  </div>
                  <p className="text-[11px] text-amber-800 pl-5 leading-relaxed">
                    Karena file ini hanya berisi tabel Ekspedisi ({previewData.calculatedTotal.toLocaleString('id-ID')} paket), sistem akan membagi adil total harian kepada <strong>Dina, Jihan, Wawan, dan Windi</strong> (Hambali 0 / Standby Leader). Tab Produktivitas Staff akan langsung aktif dan 100% klop!
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            disabled={!previewData || parsing}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Terapkan Data ke Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
