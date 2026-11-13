import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DailyRecord } from '../types/fulfillment';

export interface CloudPeriodRow {
  period_key: string;
  year: number;
  month: number;
  expedition_data: DailyRecord;
  staff_data: DailyRecord;
  updated_at?: string;
}

/**
 * Parse year and month safely from 'YYYY-MM' key
 */
function parsePeriodKey(periodKey: string): { year: number; month: number } {
  const [yStr, mStr] = periodKey.split('-');
  return {
    year: parseInt(yStr, 10) || 2026,
    month: parseInt(mStr, 10) || 10,
  };
}

/**
 * Fetch all stored monthly periods from Supabase
 */
export async function fetchAllPeriodsFromCloud(): Promise<{
  rows: CloudPeriodRow[];
  error: string | null;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { rows: [], error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('fulfillment_periods')
    .select('*')
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  if (error) {
    return { rows: [], error: error.message };
  }

  return {
    rows: (data as CloudPeriodRow[]) || [],
    error: null,
  };
}

/**
 * Save or update a monthly period atomically to Supabase
 */
export async function upsertPeriodToCloud(
  periodKey: string,
  expeditionData: DailyRecord,
  staffData: DailyRecord
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }

  const { year, month } = parsePeriodKey(periodKey);
  const { error } = await supabase
    .from('fulfillment_periods')
    .upsert(
      {
        period_key: periodKey,
        year,
        month,
        expedition_data: expeditionData,
        staff_data: staffData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'period_key' }
    );

  return { error: error ? error.message : null };
}

/**
 * Batch seed / upsert multiple periods to Supabase
 */
export async function upsertManyPeriodsToCloud(
  entries: Array<{
    periodKey: string;
    expeditionData: DailyRecord;
    staffData: DailyRecord;
  }>
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase || entries.length === 0) {
    return { error: null };
  }

  const payload = entries.map((e) => {
    const { year, month } = parsePeriodKey(e.periodKey);
    return {
      period_key: e.periodKey,
      year,
      month,
      expedition_data: e.expeditionData,
      staff_data: e.staffData,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from('fulfillment_periods')
    .upsert(payload, { onConflict: 'period_key' });

  return { error: error ? error.message : null };
}

/**
 * Delete a specific period from Supabase
 */
export async function deletePeriodFromCloud(
  periodKey: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }

  const { error } = await supabase
    .from('fulfillment_periods')
    .delete()
    .eq('period_key', periodKey);

  return { error: error ? error.message : null };
}

/**
 * Clear all rows in fulfillment_periods table
 */
export async function clearAllPeriodsFromCloud(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null };
  }

  const { error } = await supabase
    .from('fulfillment_periods')
    .delete()
    .neq('period_key', '');

  return { error: error ? error.message : null };
}

/**
 * Subscribe to real-time changes from other devices/browsers
 */
export function subscribeToPeriodsCloud(onRemoteChange: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('scentpack-fulfillment-sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fulfillment_periods',
      },
      () => {
        onRemoteChange();
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
