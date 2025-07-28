-- Script untuk mengubah kolom payment_code agar menyimpan kode unik 3 digit
-- Jalankan script ini untuk mengimplementasikan fitur pembayaran dengan kode unik

-- 1. Backup data yang ada (opsional)
-- CREATE TABLE bookings_backup AS SELECT * FROM bookings;

-- 2. Ubah kolom payment_code untuk menyimpan kode unik 3 digit
ALTER TABLE bookings MODIFY COLUMN payment_code VARCHAR(3) NULL COMMENT 'Kode unik 3 digit (000-999) untuk pembayaran';

-- 3. Hapus index lama jika ada
DROP INDEX IF EXISTS idx_payment_code ON bookings;

-- 4. Buat index baru untuk payment_code
CREATE INDEX idx_payment_code ON bookings(payment_code);

-- 5. Verifikasi perubahan
DESCRIBE bookings;

-- 6. Catatan: Kolom amount sekarang akan menyimpan total pembayaran (harga + kode unik)
-- Contoh: Jika harga Rp 20.000 dan kode unik 456, maka amount = 20456 