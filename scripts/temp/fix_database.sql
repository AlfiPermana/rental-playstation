-- Script untuk memperbaiki masalah user_id constraint
-- Jalankan script ini untuk mengizinkan user_id NULL untuk guest booking

-- 1. Ubah user_id menjadi nullable
ALTER TABLE bookings MODIFY COLUMN user_id INT NULL;

-- 2. Verifikasi perubahan
DESCRIBE bookings;

-- 3. Test insert guest booking
INSERT INTO bookings (playstation_id, booking_date, start_time, end_time, duration_hours, amount, status, payment_status, customer_name, customer_email, customer_phone) 
VALUES (1, '2024-01-15', '10:00:00', '12:00:00', 2, 10000.00, 'pending', 'pending', 'Test User', 'test@example.com', '08123456789');

-- 4. Verifikasi data berhasil diinsert
SELECT * FROM bookings WHERE customer_email = 'test@example.com';

-- 5. Cleanup test data
DELETE FROM bookings WHERE customer_email = 'test@example.com'; 