-- Script untuk menambahkan kolom payment_code ke tabel bookings
-- Jalankan script ini untuk menambahkan fitur kode unik pembayaran

-- 1. Tambah kolom payment_code
ALTER TABLE bookings ADD COLUMN payment_code VARCHAR(10) NULL AFTER customer_phone;

-- 2. Buat index untuk payment_code
CREATE INDEX idx_payment_code ON bookings(payment_code);

-- 3. Verifikasi perubahan
DESCRIBE bookings;

-- 4. Update booking yang sudah ada dengan payment_code (opsional)
-- UPDATE bookings SET payment_code = CONCAT('PAY', LPAD(id, 6, '0')) WHERE payment_code IS NULL; 