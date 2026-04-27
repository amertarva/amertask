# Database Migration untuk Task Scheduling

## Cara Menjalankan Migrasi

1. Buka Supabase Dashboard → SQL Editor
2. Copy isi file `001_task_scheduling.sql`
3. Paste dan jalankan di SQL Editor
4. Verifikasi tabel berhasil dibuat

## Apa yang Dibuat oleh Migration Ini?

Migration ini akan membuat 3 tabel baru dan 1 function:

### 1. Tabel `issue_triage`

Menyimpan metadata triage per issue (relasi 1:1 dengan `issues`)

**Kolom:**

- `id` - Primary key
- `issue_id` - Foreign key ke `issues` (UNIQUE)
- `reason` - Alasan triage
- `triage_reason` - Alasan detail triage
- `triaged_by_id` - Foreign key ke `users` (siapa yang melakukan triage)
- `triaged_at` - Timestamp kapan di-triage
- `created_at` - Timestamp dibuat

### 2. Tabel `issue_planning`

Menyimpan data planning dan scheduling per issue (relasi 1:1 dengan `issues`)

**Kolom:**

- `id` - Primary key
- `issue_id` - Foreign key ke `issues` (UNIQUE)
- `plan_info` - Informasi planning
- `start_date` - Tanggal mulai
- `due_date` - Tanggal target selesai
- `estimated_hours` - Estimasi jam pengerjaan
- `actual_hours` - Jam aktual yang digunakan
- `completed_at` - Timestamp selesai
- `created_at` - Timestamp dibuat
- `updated_at` - Timestamp terakhir diupdate

### 3. Tabel `issue_dependencies`

Menyimpan relasi dependency antar issues (many-to-many)

**Kolom:**

- `id` - Primary key
- `issue_id` - Foreign key ke `issues` (issue yang bergantung)
- `depends_on` - Foreign key ke `issues` (issue yang harus selesai dulu)
- `type` - Tipe dependency (finish_to_start, start_to_start, finish_to_finish)
- `lag_days` - Jeda hari setelah dependency selesai
- `created_at` - Timestamp dibuat

**Constraints:**

- UNIQUE (issue_id, depends_on) - Tidak boleh ada duplikat dependency
- CHECK (issue_id != depends_on) - Tidak boleh depend ke diri sendiri

### 4. Function `check_circular_dependency()`

Function untuk mengecek apakah menambahkan dependency akan membuat circular dependency

**Parameters:**

- `p_issue_id` - ID issue yang akan ditambahkan dependency
- `p_depends_on` - ID issue yang akan menjadi dependency

**Returns:** BOOLEAN

- `true` - Akan membuat circular dependency (tidak boleh ditambahkan)
- `false` - Aman untuk ditambahkan

## Verifikasi Setelah Migrasi

Jalankan query berikut untuk memastikan tabel berhasil dibuat:

```sql
-- Cek tabel issue_triage
SELECT COUNT(*) FROM issue_triage;

-- Cek tabel issue_planning
SELECT COUNT(*) FROM issue_planning;

-- Cek tabel issue_dependencies
SELECT COUNT(*) FROM issue_dependencies;

-- Test function check_circular_dependency
SELECT check_circular_dependency(
  'issue-uuid-1'::uuid,
  'issue-uuid-2'::uuid
);
```

## Struktur Relasi

```
issues (core table)
  ├── issue_triage (1:1) - metadata triage
  ├── issue_planning (1:1) - data planning & scheduling
  └── issue_dependencies (many:many) - relasi dependency
```

## Keamanan (RLS)

Semua tabel menggunakan Row Level Security (RLS):

- `issue_triage` - RLS enabled
- `issue_planning` - RLS enabled
- `issue_dependencies` - RLS enabled (via issues)

**Catatan:** Anda perlu menambahkan RLS policies sesuai kebutuhan aplikasi.

## Rollback (Jika Diperlukan)

Jika terjadi masalah dan ingin rollback, jalankan:

```sql
-- Hapus function
DROP FUNCTION IF EXISTS check_circular_dependency(UUID, UUID);

-- Hapus tabel (CASCADE akan menghapus semua foreign key constraints)
DROP TABLE IF EXISTS issue_dependencies CASCADE;
DROP TABLE IF EXISTS issue_planning CASCADE;
DROP TABLE IF EXISTS issue_triage CASCADE;
```

## Troubleshooting

### Error: relation "public.users" does not exist

**Solusi:** Pastikan tabel `users` sudah ada di database. Jika menggunakan nama tabel lain (misalnya `profiles`), edit migration SQL dan ganti `public.users` dengan nama tabel yang benar.

### Error: relation "public.issues" does not exist

**Solusi:** Pastikan tabel `issues` sudah ada di database sebelum menjalankan migration ini.

### Error: duplicate key value violates unique constraint

**Solusi:** Migration sudah pernah dijalankan sebelumnya. Gunakan `IF NOT EXISTS` sudah ditambahkan di migration, jadi seharusnya aman untuk dijalankan ulang.

## Next Steps

Setelah migration berhasil:

1. ✅ Tabel sudah siap digunakan
2. ✅ Backend API sudah siap (scheduling routes & services)
3. ⏳ Install frontend dependencies: `cd apps/web && bun add @xyflow/react frappe-gantt framer-motion date-fns`
4. ⏳ Test fitur di `/projects/[teamSlug]/graph`

## Catatan Penting

- **Tidak ada data migration otomatis** - Tabel dibuat kosong
- **RLS policies perlu dikonfigurasi** - Sesuaikan dengan kebutuhan aplikasi
- **Indexes sudah dibuat** - Untuk performa query yang optimal
- **Cascade delete** - Jika issue dihapus, semua relasi akan terhapus otomatis

---

## Migration 005: Fix Issues Source Constraint

### File: `005_fix_issues_source_constraint.sql`

Memperbaiki constraint `issues_source_check` untuk menambahkan `'planning'` sebagai nilai valid untuk kolom `source`.

**Perubahan:**

- Drop constraint lama `issues_source_check`
- Tambah constraint baru yang mengizinkan: `'slack'`, `'email'`, `'manual'`, `'planning'`

**Kenapa diperlukan:**
Function `promote_planning_to_execution()` mencoba insert issue dengan `source = 'planning'`, tapi constraint lama hanya mengizinkan `'slack'`, `'email'`, `'manual'`.

**Cara menjalankan:**

```sql
-- Copy-paste isi file 005_fix_issues_source_constraint.sql ke Supabase SQL Editor
```

**Verifikasi:**

```sql
-- Cek constraint baru
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'issues_source_check';
```
