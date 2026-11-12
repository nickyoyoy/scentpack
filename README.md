# ScentPack - Modul Fulfillment & Ekspedisi (SCENTPLUS)

Aplikasi analitik dan rekonsiliasi pengiriman harian (18 Kurir Ekspedisi + Kurir Lainnya) dan beban kerja tim packing (5 Staff Fulfillment) untuk **SCENTPLUS**.

---

## 🛠️ Tech Stack & Dependencies
* **Core:** React + TypeScript (`.tsx` & `.ts`) dengan `strict: true`
* **Styling:** Tailwind CSS (Clean Enterprise, Anti-AI Slop palette)
* **Visualisasi Data:** [Recharts](https://recharts.org/) (Area, Bar, Combo, & Multi-Line Team Comparison)
* **Icons:** [lucide-react](https://lucide.dev/)
* **Excel / CSV Parser:** `xlsx` (SheetJS)

---

## 📁 Struktur Folder & Modul
```
dashboard ERP/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Brand ScentPack, Period Selector (Multi-Bulan/Tahun), Quick Actions
│   │   ├── Navigation.tsx          # Tab selector dinamis (Ringkasan, Ekspedisi, Staff, Matrix, SOP)
│   │   ├── KpiMetrics.tsx          # 6 kartu ringkasan KPI utama
│   │   ├── OverviewView.tsx        # Grafik Recharts Tren Harian (Area/Bar/Combo) & Distribusi Kurir vs Staff
│   │   ├── EkspedisiView.tsx       # Kartu performa & sparkline 18 Kurir (JNE, SPX, JNT, dll)
│   │   ├── StaffView.tsx           # Analisis Kinerja 5 Tim & Grafik Recharts (Area/Bar/Komparasi 5 Tim)
│   │   ├── MatrixView.tsx          # Tabel matriks spreadsheet harian (Ekspedisi & Staff)
│   │   ├── DataEntryModal.tsx      # Modal input & update manual per tanggal
│   │   ├── UploadExcelModal.tsx    # Parser Log Scan Resi (otomatis baca kolom 'Anggota' & bagi rata)
│   │   ├── ResetConfirmModal.tsx   # Modal konfirmasi kosongkan data (per bulan vs all)
│   │   └── SopModal.tsx            # Standar Operasional Prosedur gudang & checklist harian
│   ├── data/
│   │   └── initialData.ts          # Metadata 18 kurir, 5 staff, dan data awal simulasi
│   ├── types/
│   │   └── fulfillment.ts          # Definisi TypeScript komprehensif
│   └── App.tsx                     # State orchestrator, multi-period storage, dan sinkronisasi
├── index.html
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 📌 Panduan Integrasi ke ERP SCENTPLUS (Next.js 16 App Router)

Karena ERP SCENTPLUS menggunakan arsitektur **Turborepo monorepo (`apps/web`)** dengan **Next.js 16 + React 19 + tRPC + Drizzle ORM (Supabase)**:

### 1. Penempatan Folder
Pindahkan folder berikut ke dalam repo ERP SCENTPLUS:
* `src/components/*` $\rightarrow$ `apps/web/src/components/fulfillment/`
* `src/types/fulfillment.ts` $\rightarrow$ `apps/web/src/types/fulfillment.ts`
* `src/data/initialData.ts` $\rightarrow$ `apps/web/src/data/fulfillment.ts`

### 2. Client Component Directive
Karena Next.js 16 App Router menggunakan Server Components secara default, pastikan tambahkan directive:
```ts
'use client';
```
di baris pertama file komponen interaktif (`Header.tsx`, `OverviewView.tsx`, `StaffView.tsx`, `MatrixView.tsx`, `UploadExcelModal.tsx`, dan `App.tsx` / `page.tsx`).

### 3. Mengganti `localStorage` ke Database (tRPC)
Pada `App.tsx` (atau `page.tsx` rute modul), ganti getter/setter `localStorage` dengan query & mutation tRPC:
```ts
// Contoh Fetch Data Bulanan:
const { data, isLoading } = trpc.fulfillment.getMonthlyReport.useQuery({
  year: selectedPeriod.year,
  month: selectedPeriod.month,
});

// Contoh Mutation Simpan/Update:
const saveDaily = trpc.fulfillment.saveDailyInput.useMutation();
```

---

## 📜 Logika Bisnis & SOP (Zero Discrepancy)
1. **Aturan Pembagian Sisa Bulat (Shared Table):**
   $$q = \lfloor N / K \rfloor, \quad r = N \pmod K$$
   $r$ staff pertama menerima $q + 1$ paket, sisanya menerima $q$ paket. Menjamin output staf 100% klop dengan total paket ekspedisi.
2. **Kolom `Anggota` Meja:**
   Parser otomatis mendeteksi siapa yang bertugas di meja packing pada setiap tanggal log scan resi (misal: jika tanggal 4 hanya ada WINDI & HAMBALI, kuota hanya dibagi ke 2 orang tersebut; staf lain otomatis status 0 / Off).
3. **Multi-Periode Dinamis:**
   Kalender otomatis menyesuaikan jumlah hari dalam bulan (`new Date(year, month, 0).getDate()`), misal 30 hari di November, 28 hari di Februari, atau 31 hari di Oktober.
4. **Sumber Data Total Paket (Q-SP1 - Opsi A: Scan + Manual):**
   Total paket dihitung murni dari hasil scan fisik barcode meja packing + input manual. Angka order ERP tidak ditambahkan ke total guna mencegah duplikasi (karena fisik paket yang di-scan sudah mencakup pesanan dari semua marketplace dan web ERP).
5. **Kurir Tak Dikenal (Q-SP2 - Opsi A: Bucket 'Lainnya'):**
   Resi dengan kurir baru atau typo nama ekspedisi otomatis dialokasikan ke bucket kurir `lainnya` ("Lainnya"). Menjamin total paket fisik selalu 100% klop tanpa ada paket yang hilang dari rekapan.

