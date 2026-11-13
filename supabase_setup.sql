-- ============================================================================
-- SCENTPACK (SCENTPLUS Fulfillment & Ekspedisi) - Supabase Database Setup
-- Jalankan script ini di Menu "SQL Editor" pada Dashboard Supabase Anda.
-- ============================================================================

-- 1. Buat tabel utama untuk menyimpan rekap bulanan secara aman & atomic
CREATE TABLE IF NOT EXISTS public.fulfillment_periods (
  period_key TEXT PRIMARY KEY, -- Format: 'YYYY-MM' (contoh: '2026-10', '2026-11')
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  expedition_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  staff_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Buat index agar pencarian periode dan pengurutan cepat
CREATE INDEX IF NOT EXISTS idx_fulfillment_periods_ym 
  ON public.fulfillment_periods (year, month);

-- 3. Aktifkan Row Level Security (RLS) dan izinkan akses read/write dari dashboard
ALTER TABLE public.fulfillment_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access for ScentPack dashboard" ON public.fulfillment_periods;
CREATE POLICY "Allow all access for ScentPack dashboard"
  ON public.fulfillment_periods
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Aktifkan Supabase Realtime agar perubahan antar-laptop/HP sinkron otomatis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'fulfillment_periods'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fulfillment_periods;
  END IF;
END $$;
