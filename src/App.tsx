import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  COURIERS_LIST, 
  getStaffListForPeriod,
  getCoreStaffIdsForPeriod,
  isNov2026OrLater,
  INITIAL_MULTI_EXPEDITION,
  INITIAL_MULTI_STAFF,
  SAMPLE_OCTOBER_EXPEDITION_DAILY,
  SAMPLE_OCTOBER_STAFF_DAILY,
  createEmptyDailyRecord,
  calculateDailyTotals 
} from './data/initialData';
import { 
  DailyRecord, 
  ActiveTab, 
  MonthPeriod, 
  getDaysInMonth, 
  getPeriodKey, 
  getMonthInfo 
} from './types/fulfillment';
import { isSupabaseConfigured } from './lib/supabase';
import {
  fetchAllPeriodsFromCloud,
  upsertPeriodToCloud,
  upsertManyPeriodsToCloud,
  deletePeriodFromCloud,
  clearAllPeriodsFromCloud,
  subscribeToPeriodsCloud,
} from './services/fulfillmentStorage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { KpiMetrics } from './components/KpiMetrics';
import { OverviewView } from './components/OverviewView';
import { EkspedisiView } from './components/EkspedisiView';
import { StaffView } from './components/StaffView';
import { MatrixView } from './components/MatrixView';
import { SopModal, SopContent } from './components/SopModal';
import { DataEntryModal, DataEntryPayload } from './components/DataEntryModal';
import { UploadExcelModal, UploadResult } from './components/UploadExcelModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab | 'sop'>('overview');

  // Selected Period (Bulan & Tahun Dinamis, default: Oktober 2026)
  const [selectedPeriod, setSelectedPeriod] = useState<MonthPeriod>(() => {
    try {
      const saved = localStorage.getItem('logistiq_selected_period');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { year: 2026, month: 10 };
  });

  // Multi-Period Storage: Record<"YYYY-MM", DailyRecord>
  const [multiExpedition, setMultiExpedition] = useState<Record<string, DailyRecord>>(() => {
    try {
      const saved = localStorage.getItem('logistiq_multi_expedition');
      if (saved) return JSON.parse(saved);

      // Migration: If user previously had single-month storage
      const oldSingle = localStorage.getItem('logistiq_expedition_state');
      if (oldSingle) {
        return {
          ...INITIAL_MULTI_EXPEDITION,
          '2026-10': JSON.parse(oldSingle),
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_MULTI_EXPEDITION;
  });

  const [multiStaff, setMultiStaff] = useState<Record<string, DailyRecord>>(() => {
    try {
      const saved = localStorage.getItem('logistiq_multi_staff');
      if (saved) return JSON.parse(saved);

      // Migration: If user previously had single-month storage
      const oldSingle = localStorage.getItem('logistiq_staff_state');
      if (oldSingle) {
        return {
          ...INITIAL_MULTI_STAFF,
          '2026-10': JSON.parse(oldSingle),
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_MULTI_STAFF;
  });

  // Registered period keys list (persists across sessions)
  const [registeredPeriods, setRegisteredPeriods] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('logistiq_registered_periods');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return ['2026-10', '2026-11', '2026-12'];
  });

  // Modals state
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isSopModalOpen, setIsSopModalOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>(
    isSupabaseConfigured ? 'syncing' : 'local'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper: sync a single period row to Supabase Cloud
  const syncPeriodToCloud = useCallback(async (key: string, expData: DailyRecord, stfData: DailyRecord) => {
    if (!isSupabaseConfigured) return;
    setCloudStatus('syncing');
    const { error } = await upsertPeriodToCloud(key, expData, stfData);
    setCloudStatus(error ? 'error' : 'synced');
    if (error) console.error('[ScentPack Cloud Sync Error]:', error);
  }, []);

  // Load all periods from Supabase & subscribe to real-time updates
  const loadFromCloud = useCallback(async (allowInitialSeed = false) => {
    if (!isSupabaseConfigured) return;
    const { rows, error } = await fetchAllPeriodsFromCloud();
    if (error) {
      console.error('[ScentPack Load Error]:', error);
      setCloudStatus('error');
      return;
    }

    if (rows.length === 0 && allowInitialSeed) {
      // First-time cloud setup: seed October 2026 actual data + Nov/Dec placeholders
      const seedEntries = [
        {
          periodKey: '2026-10',
          expeditionData: SAMPLE_OCTOBER_EXPEDITION_DAILY,
          staffData: SAMPLE_OCTOBER_STAFF_DAILY,
        },
        {
          periodKey: '2026-11',
          expeditionData: createEmptyDailyRecord(COURIERS_LIST, getDaysInMonth(2026, 11)),
          staffData: createEmptyDailyRecord(getStaffListForPeriod({ year: 2026, month: 11 }), getDaysInMonth(2026, 11)),
        },
        {
          periodKey: '2026-12',
          expeditionData: createEmptyDailyRecord(COURIERS_LIST, getDaysInMonth(2026, 12)),
          staffData: createEmptyDailyRecord(getStaffListForPeriod({ year: 2026, month: 12 }), getDaysInMonth(2026, 12)),
        },
      ];
      await upsertManyPeriodsToCloud(seedEntries);
      setCloudStatus('synced');
      return;
    }

    if (rows.length > 0) {
      const nextExp: Record<string, DailyRecord> = {};
      const nextStaff: Record<string, DailyRecord> = {};
      const nextKeys: string[] = [];

      rows.forEach((row) => {
        nextExp[row.period_key] = row.expedition_data || {};
        nextStaff[row.period_key] = row.staff_data || {};
        nextKeys.push(row.period_key);
      });

      setMultiExpedition(nextExp);
      setMultiStaff(nextStaff);
      setRegisteredPeriods((prev) => {
        const merged = new Set(['2026-10', ...nextKeys, ...prev]);
        return Array.from(merged);
      });
    }

    setCloudStatus('synced');
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    loadFromCloud(true);
    const unsubscribe = subscribeToPeriodsCloud(() => {
      loadFromCloud(false);
    });
    return () => {
      unsubscribe();
    };
  }, [loadFromCloud]);

  // Derived current month info
  const periodKey = useMemo(() => {
    return getPeriodKey(selectedPeriod.year, selectedPeriod.month);
  }, [selectedPeriod]);

  const daysInMonth = useMemo(() => {
    return getDaysInMonth(selectedPeriod.year, selectedPeriod.month);
  }, [selectedPeriod]);

  const currentMonthInfo = useMemo(() => {
    return getMonthInfo(selectedPeriod.month);
  }, [selectedPeriod.month]);

  // Persist states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('logistiq_selected_period', JSON.stringify(selectedPeriod));
    } catch {
      // ignore
    }
  }, [selectedPeriod]);

  useEffect(() => {
    try {
      localStorage.setItem('logistiq_multi_expedition', JSON.stringify(multiExpedition));
    } catch {
      // ignore
    }
  }, [multiExpedition]);

  useEffect(() => {
    try {
      localStorage.setItem('logistiq_multi_staff', JSON.stringify(multiStaff));
    } catch {
      // ignore
    }
  }, [multiStaff]);

  useEffect(() => {
    try {
      localStorage.setItem('logistiq_registered_periods', JSON.stringify(registeredPeriods));
    } catch {
      // ignore
    }
  }, [registeredPeriods]);

  // Current active month's expedition daily record (ensures array length is daysInMonth)
  const expeditionDaily = useMemo<DailyRecord>(() => {
    const raw = multiExpedition[periodKey];
    const res: DailyRecord = {};
    COURIERS_LIST.forEach((c) => {
      const srcArr = (raw && raw[c.id]) || [];
      const newArr = new Array(daysInMonth).fill(0);
      for (let i = 0; i < daysInMonth; i++) {
        newArr[i] = srcArr[i] || 0;
      }
      res[c.id] = newArr;
    });
    return res;
  }, [multiExpedition, periodKey, daysInMonth]);

  // Active staff list dynamically resolved by period (<= Oct 2026: 5 staff, >= Nov 2026: 7 staff)
  const activeStaffList = useMemo(() => getStaffListForPeriod(selectedPeriod), [selectedPeriod]);

  // Current active month's staff daily record
  const staffDaily = useMemo<DailyRecord>(() => {
    const raw = multiStaff[periodKey];
    const res: DailyRecord = {};
    activeStaffList.forEach((s) => {
      const srcArr = (raw && raw[s.id]) || [];
      const newArr = new Array(daysInMonth).fill(0);
      for (let i = 0; i < daysInMonth; i++) {
        newArr[i] = srcArr[i] || 0;
      }
      res[s.id] = newArr;
    });
    return res;
  }, [multiStaff, periodKey, daysInMonth, activeStaffList]);

  // List of all available periods saved or standard default
  const availablePeriods = useMemo<MonthPeriod[]>(() => {
    const setKeys = new Set<string>([
      '2026-10',
      '2026-11',
      '2026-12',
      ...registeredPeriods,
      ...Object.keys(multiExpedition),
      ...Object.keys(multiStaff),
      periodKey,
    ]);

    const list: MonthPeriod[] = [];
    setKeys.forEach((k) => {
      const [yStr, mStr] = k.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(y) && !isNaN(m)) {
        list.push({ year: y, month: m });
      }
    });

    return list.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }, [registeredPeriods, multiExpedition, multiStaff, periodKey]);

  // 1. Calculate daily totals for current month
  const dailyTotals = useMemo(() => {
    return calculateDailyTotals(expeditionDaily, daysInMonth);
  }, [expeditionDaily, daysInMonth]);

  // 2. Calculate total volume
  const totalVolume = useMemo(() => {
    return dailyTotals.reduce((a, b) => a + b, 0);
  }, [dailyTotals]);

  // Auto-sync: If a date in the active month has courier packages but staff is 0, distribute to core staff per SOP
  useEffect(() => {
    let needsUpdate = false;
    const currentStaffMap = multiStaff[periodKey] || {};
    const newStaffDaily: DailyRecord = { ...currentStaffMap };
    const coreStaffIds = getCoreStaffIdsForPeriod(selectedPeriod);
    const countCore = coreStaffIds.length;

    for (let d = 0; d < daysInMonth; d++) {
      const dayExpTotal = dailyTotals[d] || 0;
      const dayStaffTotal = Object.values(currentStaffMap).reduce((acc, arr) => acc + Number((arr && arr[d]) || 0), 0);

      if (dayExpTotal > 0 && dayStaffTotal === 0 && countCore > 0) {
        needsUpdate = true;
        const q = Math.floor(dayExpTotal / countCore);
        const r = dayExpTotal % countCore;

        coreStaffIds.forEach((sId, sIdx) => {
          if (!newStaffDaily[sId]) newStaffDaily[sId] = new Array(daysInMonth).fill(0);
          newStaffDaily[sId] = [...newStaffDaily[sId]];
          newStaffDaily[sId][d] = q + (sIdx < r ? 1 : 0);
        });
      }
    }

    if (needsUpdate) {
      setMultiStaff(prev => ({
        ...prev,
        [periodKey]: newStaffDaily,
      }));
      void syncPeriodToCloud(periodKey, expeditionDaily, newStaffDaily);
    }
  }, [dailyTotals, expeditionDaily, multiStaff, periodKey, daysInMonth, selectedPeriod, syncPeriodToCloud]);

  // 3. Daily Average
  const dailyAvg = useMemo(() => {
    return totalVolume > 0 ? Math.round(totalVolume / daysInMonth) : 0;
  }, [totalVolume, daysInMonth]);

  // 4. Detailed Couriers Data
  const couriersData = useMemo(() => {
    return COURIERS_LIST.map((c) => {
      const daily = expeditionDaily[c.id] || new Array(daysInMonth).fill(0);
      const total = daily.reduce((a, b) => a + b, 0);
      return {
        ...c,
        daily,
        total,
      };
    });
  }, [expeditionDaily, daysInMonth]);

  // 5. Detailed Staff Data
  const staffData = useMemo(() => {
    return activeStaffList.map((s) => {
      const daily = staffDaily[s.id] || new Array(daysInMonth).fill(0);
      const total = daily.reduce((a, b) => a + b, 0);
      const daysActive = daily.filter(v => v > 0).length;
      const daysOff = daily.filter(v => v === 0).length;
      const activeDailyAvg = daysActive > 0 ? Math.round(total / daysActive) : 0;
      return {
        ...s,
        daily,
        total,
        daysActive,
        daysOff,
        activeDailyAvg,
      };
    });
  }, [staffDaily, daysInMonth, activeStaffList]);

  // 6. Top Courier
  const topCourier = useMemo(() => {
    const sorted = [...couriersData].sort((a, b) => b.total - a.total);
    const top = sorted[0] || { name: '-', total: 0 };
    const share = totalVolume > 0 ? ((top.total / totalVolume) * 100).toFixed(1) : '0.0';
    return { name: top.name, total: top.total, share };
  }, [couriersData, totalVolume]);

  // 7. Top Staff
  const topStaff = useMemo(() => {
    const coreStaff = staffData.filter(s => !s.isLeadBackup);
    const sorted = [...coreStaff].sort((a, b) => b.total - a.total);
    const top = sorted[0] || { name: '-', total: 0 };
    const share = totalVolume > 0 ? ((top.total / totalVolume) * 100).toFixed(1) : '0.0';
    return { name: top.name, total: top.total, share };
  }, [staffData, totalVolume]);

  // 8. Peak Day
  const peakDay = useMemo(() => {
    let max = 0;
    let maxDayIdx = 0;
    dailyTotals.forEach((val, idx) => {
      if (val > max) {
        max = val;
        maxDayIdx = idx;
      }
    });
    return {
      date: max > 0 ? `${maxDayIdx + 1} ${currentMonthInfo.short}` : '-',
      volume: max,
    };
  }, [dailyTotals, currentMonthInfo]);

  // 9. Leader Stats (Hambali)
  const leaderStats = useMemo(() => {
    const lead = staffData.find(s => s.id === 'hambali' || s.isLeadBackup) || { daysActive: 0, total: 0 };
    return { daysActive: lead.daysActive, total: lead.total };
  }, [staffData]);

  // Switch / Add Period Handler
  const handlePeriodChange = (newPeriod: MonthPeriod) => {
    const key = getPeriodKey(newPeriod.year, newPeriod.month);
    setSelectedPeriod(newPeriod);
    setRegisteredPeriods(prev => {
      if (!prev.includes(key)) {
        return [...prev, key];
      }
      return prev;
    });

    const days = getDaysInMonth(newPeriod.year, newPeriod.month);
    const periodStaffList = getStaffListForPeriod(newPeriod);
    const isNewPeriod = !multiExpedition[key] || !multiStaff[key];
    const nextExp = multiExpedition[key] || createEmptyDailyRecord(COURIERS_LIST, days);
    const nextStaff = multiStaff[key] || createEmptyDailyRecord(periodStaffList, days);

    if (!multiExpedition[key]) {
      setMultiExpedition(prev => ({ ...prev, [key]: nextExp }));
    }
    if (!multiStaff[key]) {
      setMultiStaff(prev => ({ ...prev, [key]: nextStaff }));
    }
    if (isNewPeriod) {
      void syncPeriodToCloud(key, nextExp, nextStaff);
    }

    const m = getMonthInfo(newPeriod.month);
    showToast(`Beralih ke periode ${m.name} ${newPeriod.year} (${days} Hari).`);
  };

  // Remove Period from Saved List
  const handleRemovePeriod = (p: MonthPeriod) => {
    const key = getPeriodKey(p.year, p.month);
    if (key === '2026-10') {
      showToast('Periode dasar Oktober 2026 tidak dapat dihapus.');
      return;
    }

    setRegisteredPeriods(prev => prev.filter(k => k !== key));
    setMultiExpedition(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setMultiStaff(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    if (selectedPeriod.year === p.year && selectedPeriod.month === p.month) {
      setSelectedPeriod({ year: 2026, month: 10 });
    }

    void (async () => {
      if (!isSupabaseConfigured) return;
      setCloudStatus('syncing');
      const { error } = await deletePeriodFromCloud(key);
      setCloudStatus(error ? 'error' : 'synced');
    })();

    showToast(`Periode ${getMonthInfo(p.month).name} ${p.year} berhasil dihapus dari daftar.`);
  };

  // Save Daily Input Handler
  const handleSaveDailyInput = (entry: DataEntryPayload) => {
    const dayIdx = entry.day - 1;

    const currentExp = multiExpedition[periodKey] || createEmptyDailyRecord(COURIERS_LIST, daysInMonth);
    const nextExp: DailyRecord = { ...currentExp };
    Object.entries(entry.couriers).forEach(([cId, val]) => {
      if (!nextExp[cId]) nextExp[cId] = new Array(daysInMonth).fill(0);
      nextExp[cId] = [...nextExp[cId]];
      nextExp[cId][dayIdx] = Number(val);
    });
    setMultiExpedition(prev => ({ ...prev, [periodKey]: nextExp }));

    const currentStaff = multiStaff[periodKey] || createEmptyDailyRecord(activeStaffList, daysInMonth);
    const nextStaff: DailyRecord = { ...currentStaff };
    Object.entries(entry.staff).forEach(([sId, val]) => {
      if (!nextStaff[sId]) nextStaff[sId] = new Array(daysInMonth).fill(0);
      nextStaff[sId] = [...nextStaff[sId]];
      nextStaff[sId][dayIdx] = Number(val);
    });
    setMultiStaff(prev => ({ ...prev, [periodKey]: nextStaff }));

    void syncPeriodToCloud(periodKey, nextExp, nextStaff);

    showToast(`Data Tanggal ${entry.day} ${currentMonthInfo.name} ${selectedPeriod.year} berhasil disimpan & disinkronkan!`);
  };

  // Upload Excel / CSV Handler (Auto-routes to the detected month & year!)
  const handleDataUploaded = (parsedResult: UploadResult) => {
    const targetYear = parsedResult.detectedYear || selectedPeriod.year;
    const targetMonth = parsedResult.detectedMonth || selectedPeriod.month;
    const targetPeriodKey = getPeriodKey(targetYear, targetMonth);
    const targetDaysInMonth = getDaysInMonth(targetYear, targetMonth);
    const targetMonthInfo = getMonthInfo(targetMonth);
    const targetStaffList = getStaffListForPeriod({ year: targetYear, month: targetMonth });

    setRegisteredPeriods(prev => {
      if (!prev.includes(targetPeriodKey)) {
        return [...prev, targetPeriodKey];
      }
      return prev;
    });

    if (parsedResult.type === 'RAW_SCAN_LOG') {
      const days = parsedResult.detectedDays;

      const currentExp = multiExpedition[targetPeriodKey] || createEmptyDailyRecord(COURIERS_LIST, targetDaysInMonth);
      const nextExp: DailyRecord = { ...currentExp };
      COURIERS_LIST.forEach((c) => {
        if (!nextExp[c.id]) nextExp[c.id] = new Array(targetDaysInMonth).fill(0);
        nextExp[c.id] = [...nextExp[c.id]];
        days.forEach(day => {
          const dayIdx = day - 1;
          if (dayIdx < targetDaysInMonth) {
            nextExp[c.id][dayIdx] = parsedResult.expeditionMatrix[c.id]?.[dayIdx] || 0;
          }
        });
      });
      setMultiExpedition(prev => ({ ...prev, [targetPeriodKey]: nextExp }));

      const currentStaff = multiStaff[targetPeriodKey] || createEmptyDailyRecord(targetStaffList, targetDaysInMonth);
      const nextStaff: DailyRecord = { ...currentStaff };
      targetStaffList.forEach((s) => {
        if (!nextStaff[s.id]) nextStaff[s.id] = new Array(targetDaysInMonth).fill(0);
        nextStaff[s.id] = [...nextStaff[s.id]];
        days.forEach(day => {
          const dayIdx = day - 1;
          if (dayIdx < targetDaysInMonth) {
            nextStaff[s.id][dayIdx] = parsedResult.staffMatrix[s.id]?.[dayIdx] || 0;
          }
        });
      });
      setMultiStaff(prev => ({ ...prev, [targetPeriodKey]: nextStaff }));

      void syncPeriodToCloud(targetPeriodKey, nextExp, nextStaff);

      // Switch to that period if different from current
      if (targetYear !== selectedPeriod.year || targetMonth !== selectedPeriod.month) {
        setSelectedPeriod({ year: targetYear, month: targetMonth });
      }

      showToast(`Sukses memuat ${parsedResult.totalScanned.toLocaleString('id-ID')} resi ke periode ${targetMonthInfo.name} ${targetYear} (${days.length} hari terdeteksi)!`);

    } else if (parsedResult.type === 'MATRIX_REKAP') {
      const targetDays = parsedResult.detectedDayIndices && parsedResult.detectedDayIndices.length > 0
        ? parsedResult.detectedDayIndices
        : Array.from({ length: targetDaysInMonth }, (_, i) => i);

      let nextExp = multiExpedition[targetPeriodKey] || createEmptyDailyRecord(COURIERS_LIST, targetDaysInMonth);
      if (parsedResult.expeditionMatrix && Object.keys(parsedResult.expeditionMatrix).length > 0) {
        const updatedExp: DailyRecord = { ...nextExp };
        Object.entries(parsedResult.expeditionMatrix).forEach(([cId, newDailyArr]) => {
          if (!updatedExp[cId]) updatedExp[cId] = new Array(targetDaysInMonth).fill(0);
          updatedExp[cId] = [...updatedExp[cId]];
          targetDays.forEach(dayIdx => {
            if (dayIdx < targetDaysInMonth) {
              updatedExp[cId][dayIdx] = newDailyArr[dayIdx] || 0;
            }
          });
        });
        nextExp = updatedExp;
        setMultiExpedition(prev => ({ ...prev, [targetPeriodKey]: nextExp }));
      }

      let nextStaff = multiStaff[targetPeriodKey] || createEmptyDailyRecord(targetStaffList, targetDaysInMonth);
      if (parsedResult.staffMatrix && Object.keys(parsedResult.staffMatrix).length > 0) {
        const updatedStaff: DailyRecord = { ...nextStaff };
        Object.entries(parsedResult.staffMatrix).forEach(([sId, newDailyArr]) => {
          if (!updatedStaff[sId]) updatedStaff[sId] = new Array(targetDaysInMonth).fill(0);
          updatedStaff[sId] = [...updatedStaff[sId]];
          targetDays.forEach(dayIdx => {
            if (dayIdx < targetDaysInMonth) {
              updatedStaff[sId][dayIdx] = newDailyArr[dayIdx] || 0;
            }
          });
        });
        nextStaff = updatedStaff;
        setMultiStaff(prev => ({ ...prev, [targetPeriodKey]: nextStaff }));
      }

      void syncPeriodToCloud(targetPeriodKey, nextExp, nextStaff);

      if (targetYear !== selectedPeriod.year || targetMonth !== selectedPeriod.month) {
        setSelectedPeriod({ year: targetYear, month: targetMonth });
      }

      showToast(`Berhasil menerapkan ${parsedResult.calculatedTotal.toLocaleString('id-ID')} paket ke periode ${targetMonthInfo.name} ${targetYear}!`);
    }
  };

  // Export CSV Handler
  const handleExportData = () => {
    const csvRows: (string | number)[][] = [];
    csvRows.push([
      "No", 
      "Nama Ekspedisi", 
      ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1} ${currentMonthInfo.short}`), 
      "TOTAL"
    ]);

    couriersData.forEach((c, idx) => {
      csvRows.push([idx + 1, c.name, ...c.daily, c.total]);
    });

    csvRows.push(["TOTAL", "", ...dailyTotals, totalVolume]);

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ScentPack_Fulfillment_${currentMonthInfo.name}_${selectedPeriod.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`File Rekap CSV (${currentMonthInfo.name} ${selectedPeriod.year}) berhasil diunduh.`);
  };

  // Clear Data Handler (Options: Only active month vs All periods)
  const handleConfirmClear = (clearOnlyCurrentMonth: boolean) => {
    const emptyExp = createEmptyDailyRecord(COURIERS_LIST, daysInMonth);
    const emptyStaff = createEmptyDailyRecord(activeStaffList, daysInMonth);

    if (clearOnlyCurrentMonth) {
      setMultiExpedition(prev => ({ ...prev, [periodKey]: emptyExp }));
      setMultiStaff(prev => ({ ...prev, [periodKey]: emptyStaff }));
      void syncPeriodToCloud(periodKey, emptyExp, emptyStaff);
      showToast(`Data ${currentMonthInfo.name} ${selectedPeriod.year} berhasil dikosongkan (0). Data bulan lain tetap aman tersimpan.`);
    } else {
      setMultiExpedition({ [periodKey]: emptyExp });
      setMultiStaff({ [periodKey]: emptyStaff });
      void (async () => {
        if (!isSupabaseConfigured) return;
        setCloudStatus('syncing');
        const { error: clearErr } = await clearAllPeriodsFromCloud();
        if (clearErr) {
          setCloudStatus('error');
          return;
        }
        const { error: upErr } = await upsertPeriodToCloud(periodKey, emptyExp, emptyStaff);
        setCloudStatus(upErr ? 'error' : 'synced');
      })();
      showToast("Seluruh data dari seluruh periode berhasil dikosongkan.");
    }
  };

  // Restore Initial Demo Data Handler
  const handleRestoreInitialData = () => {
    setSelectedPeriod({ year: 2026, month: 10 });
    setMultiExpedition(INITIAL_MULTI_EXPEDITION);
    setMultiStaff(INITIAL_MULTI_STAFF);
    const restoreKeys = Object.keys(INITIAL_MULTI_EXPEDITION);
    setRegisteredPeriods(restoreKeys);

    void (async () => {
      if (!isSupabaseConfigured) return;
      setCloudStatus('syncing');
      const entries = restoreKeys.map((k) => ({
        periodKey: k,
        expeditionData: INITIAL_MULTI_EXPEDITION[k] || {},
        staffData: INITIAL_MULTI_STAFF[k] || {},
      }));
      const { error } = await upsertManyPeriodsToCloud(entries);
      setCloudStatus(error ? 'error' : 'synced');
    })();

    showToast("Data contoh (Oktober 2026) berhasil dipulihkan.");
  };

  // Auto-distribute Staff Handler
  const handleAutoDistributeStaffFromExpedition = () => {
    const newStaffDaily: DailyRecord = createEmptyDailyRecord(activeStaffList, daysInMonth);
    const coreStaffIds = getCoreStaffIdsForPeriod(selectedPeriod);
    const countCore = coreStaffIds.length;

    dailyTotals.forEach((dayTotal, dayIdx) => {
      if (dayTotal > 0 && countCore > 0) {
        const q = Math.floor(dayTotal / countCore);
        const r = dayTotal % countCore;
        coreStaffIds.forEach((sId, sIdx) => {
          newStaffDaily[sId][dayIdx] = q + (sIdx < r ? 1 : 0);
        });
      }
    });

    setMultiStaff(prev => ({
      ...prev,
      [periodKey]: newStaffDaily,
    }));
    void syncPeriodToCloud(periodKey, expeditionDaily, newStaffDaily);

    showToast(`Berhasil mendistribusikan ${totalVolume.toLocaleString('id-ID')} paket ke ${countCore} Staff Inti sesuai SOP (${currentMonthInfo.name} ${selectedPeriod.year})!`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Header with Dynamic Period Picker */}
      <Header
        onOpenInput={() => setIsInputModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenSop={() => setIsSopModalOpen(true)}
        onOpenClearModal={() => setIsClearModalOpen(true)}
        onExportData={handleExportData}
        totalVolume={totalVolume}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        onRemovePeriod={handleRemovePeriod}
        availablePeriods={availablePeriods}
        daysInMonth={daysInMonth}
        cloudStatus={cloudStatus}
      />

      {/* 2. Navigation */}
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        daysInMonth={daysInMonth}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* KPI Summary Cards */}
        <KpiMetrics
          totalVolume={totalVolume}
          dailyAvg={dailyAvg}
          topCourier={topCourier}
          topStaff={topStaff}
          peakDay={peakDay}
          leaderStats={leaderStats}
          daysInMonth={daysInMonth}
          isNovOrLater={isNov2026OrLater(selectedPeriod)}
        />

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <OverviewView
            dailyTotals={dailyTotals}
            couriersData={couriersData}
            staffData={staffData}
            totalVolume={totalVolume}
            onSelectTab={setActiveTab}
            period={selectedPeriod}
            daysInMonth={daysInMonth}
          />
        )}

        {/* Tab 2: Ekspedisi (18 Kurir) */}
        {activeTab === 'ekspedisi' && (
          <EkspedisiView
            couriersData={couriersData}
            totalVolume={totalVolume}
            period={selectedPeriod}
            daysInMonth={daysInMonth}
          />
        )}

        {/* Tab 3: Staff Packing */}
        {activeTab === 'staff' && (
          <StaffView
            staffData={staffData}
            totalVolume={totalVolume}
            onAutoDistributeStaff={handleAutoDistributeStaffFromExpedition}
            period={selectedPeriod}
            daysInMonth={daysInMonth}
          />
        )}

        {/* Tab 4: Spreadsheet Matrix (Dynamic Days Table) */}
        {activeTab === 'matrix' && (
          <MatrixView
            couriersData={couriersData}
            staffData={staffData}
            dailyTotals={dailyTotals}
            period={selectedPeriod}
            daysInMonth={daysInMonth}
          />
        )}

        {/* Tab 5: SOP & Warehouse Guidelines */}
        {activeTab === 'sop' && (
          <div className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-2xs">
            <div className="border-b border-zinc-200 pb-4 mb-6">
              <h2 className="text-lg font-bold text-zinc-900">
                Standar Operasional Prosedur (SOP) Gudang & Logistik
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Protokol resmi fulfillment order, mitigasi lonjakan pesanan, penanganan status '0' (off), dan jadwal penjemputan armada ekspedisi.
              </p>
            </div>
            <SopContent />
          </div>
        )}

      </main>

      {/* 4. Subtle Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 mt-12 text-center text-xs text-zinc-400">
        <p>ScentPack • SCENTPLUS Fulfillment & Ekspedisi Analytics • Multi-Bulan & Multi-Tahun</p>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white text-xs font-medium rounded-xl shadow-lg border border-zinc-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <DataEntryModal
        key={periodKey}
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        onSave={handleSaveDailyInput}
        couriersList={COURIERS_LIST}
        staffList={activeStaffList}
        currentPeriod={selectedPeriod}
        daysInMonth={daysInMonth}
        initialDay={1}
      />

      <UploadExcelModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataUploaded={handleDataUploaded}
        currentPeriod={selectedPeriod}
        daysInMonth={daysInMonth}
      />

      <SopModal
        isOpen={isSopModalOpen}
        onClose={() => setIsSopModalOpen(false)}
      />

      <ResetConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirmClear={handleConfirmClear}
        onConfirmRestore={handleRestoreInitialData}
        currentPeriodName={`${currentMonthInfo.name} ${selectedPeriod.year}`}
      />

    </div>
  );
};

export default App;
