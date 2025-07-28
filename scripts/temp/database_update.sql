-- Script untuk mengupdate database schema agar mendukung guest booking
-- Jalankan script ini di database MySQL Anda

-- 1. Tambah kolom baru ke tabel bookings untuk guest booking
ALTER TABLE bookings 
ADD COLUMN customer_name VARCHAR(255) NULL AFTER user_id,
ADD COLUMN customer_email VARCHAR(255) NULL AFTER customer_name,
ADD COLUMN customer_phone VARCHAR(20) NULL AFTER customer_email;

-- 2. Buat index untuk optimasi pencarian
CREATE INDEX idx_customer_email_phone ON bookings(customer_email, customer_phone);
CREATE INDEX idx_booking_id ON bookings(id);

-- 3. Update foreign key constraint untuk user_id agar bisa NULL
-- (Jika ada foreign key constraint, hapus dulu lalu buat ulang)
-- ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_user_id;
-- ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Tambah kolom untuk tracking (opsional)
ALTER TABLE bookings 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER payment_method,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- 5. Update view atau query yang ada (jika diperlukan)
-- Contoh: Update query untuk admin dashboard
-- CREATE OR REPLACE VIEW booking_summary AS
-- SELECT 
--     b.id,
--     COALESCE(u.username, b.customer_name) AS customer_name,
--     COALESCE(u.email, b.customer_email) AS customer_email,
--     b.customer_phone,
--     p.name AS playstation_name,
--     b.booking_date,
--     b.start_time,
--     b.end_time,
--     b.duration_hours,
--     b.amount,
--     b.status,
--     b.payment_status,
--     b.created_at
-- FROM bookings b
-- LEFT JOIN users u ON b.user_id = u.id
-- JOIN playstations p ON b.playstation_id = p.id;

-- 6. Insert sample data untuk testing (opsional)
-- INSERT INTO playstations (name, type, price_per_hour, status) VALUES 
-- ('PS5 Standard', 'PS5', 50000, 'available'),
-- ('PS4 Pro', 'PS4', 35000, 'available'),
-- ('PS4 Slim', 'PS4', 30000, 'available');

-- 7. Verifikasi perubahan
-- DESCRIBE bookings;
-- SHOW INDEX FROM bookings; 