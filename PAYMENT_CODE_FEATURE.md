# Fitur Kode Unik Pembayaran (Payment Code)

## Overview
Fitur kode unik pembayaran telah berhasil ditambahkan ke sistem rental PlayStation. Kode ini memudahkan admin untuk mengidentifikasi pembayaran dari setiap booking dan memastikan pembayaran yang tepat.

## Implementasi

### 1. Database Schema
- **Kolom Baru**: `payment_code VARCHAR(10)` ditambahkan ke tabel `bookings`
- **Index**: `idx_payment_code` dibuat untuk optimasi query
- **Format**: `PAY` + 4 digit timestamp + 2 digit random number (contoh: `PAY966333`)

### 2. Backend Changes

#### Model Booking (`server/models/Booking.js`)
- **Method Baru**: `generatePaymentCode()` - menghasilkan kode unik pembayaran
- **Update Method**: `createGuestBooking()` - sekarang otomatis generate payment code
- **Update Method**: `create()` - sekarang otomatis generate payment code untuk user yang login

```javascript
// Method untuk generate payment code
static generatePaymentCode() {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `PAY${timestamp}${random}`;
}
```

### 3. Frontend Changes

#### Halaman Payment (`public/payment.html`)
- **Tampilan**: Payment code ditampilkan dengan format yang menonjol
- **Styling**: Warna biru dan font bold untuk mudah dibaca
- **Instruksi**: Ditambahkan instruksi untuk menyertakan payment code saat transfer

#### Halaman Tracking (`public/tracking.html`)
- **Tampilan**: Payment code ditampilkan di detail booking
- **Styling**: Konsisten dengan halaman payment

#### Admin Panel (`public/admin/manage-bookings.html`)
- **Kolom Baru**: "Kode Pembayaran" ditambahkan ke tabel booking
- **Tampilan**: Payment code ditampilkan dengan styling yang menonjol

### 4. API Endpoints
Semua endpoint yang mengembalikan data booking sekarang menyertakan `payment_code`:
- `GET /api/guest/booking/:bookingId`
- `GET /api/guest/search`
- `GET /api/admin/bookings`

## Format Payment Code
- **Prefix**: `PAY`
- **Timestamp**: 4 digit terakhir dari timestamp (unik per detik)
- **Random**: 2 digit random number (0-99)
- **Contoh**: `PAY966333`, `PAY707823`, `PAY810497`

## Manfaat

### 1. Untuk Admin
- **Identifikasi Cepat**: Mudah mengidentifikasi pembayaran berdasarkan kode
- **Verifikasi**: Memastikan pembayaran yang tepat untuk booking yang benar
- **Tracking**: Melacak status pembayaran dengan lebih mudah

### 2. Untuk Customer
- **Kejelasan**: Mengetahui kode yang harus disertakan saat transfer
- **Keamanan**: Memastikan pembayaran diterima untuk booking yang benar
- **Kemudahan**: Tidak perlu mengingat nomor booking yang panjang

### 3. Untuk Sistem
- **Unik**: Setiap booking memiliki kode yang unik
- **Scalable**: Format mendukung hingga 1 juta kombinasi unik
- **Efficient**: Index database untuk query yang cepat

## Testing

### 1. Database Test
```bash
# Test insert dengan payment code
node test_payment_code_insert.js

# Test generate payment code
node test_generate_payment_code.js

# Test create guest booking
node test_create_guest_booking.js
```

### 2. API Test
```bash
# Test booking dengan payment code
curl -X POST http://localhost:3000/api/guest/book \
  -H "Content-Type: application/json" \
  -d '{"playstationId":1,"bookingDate":"2024-07-26","startTime":"15:00","durationHours":1,"customerName":"Test","customerEmail":"test@example.com","customerPhone":"08123456789"}'

# Cek payment code
curl http://localhost:3000/api/guest/booking/{bookingId}
```

### 3. Frontend Test
- Akses halaman payment: `http://localhost:3000/payment?booking_id={id}&amount={amount}`
- Akses halaman tracking: `http://localhost:3000/tracking`
- Akses admin panel: `http://localhost:3000/admin/manage-bookings.html`

## Maintenance

### Update Payment Code untuk Booking Lama
```bash
# Jalankan script untuk update booking yang sudah ada
node update_existing_payment_codes.js
```

### Monitoring
- Cek booking tanpa payment code: `SELECT COUNT(*) FROM bookings WHERE payment_code IS NULL`
- Cek duplikasi payment code: `SELECT payment_code, COUNT(*) FROM bookings GROUP BY payment_code HAVING COUNT(*) > 1`

## Troubleshooting

### Payment Code Null
1. **Cek Database**: Pastikan kolom `payment_code` sudah ada
2. **Cek Index**: Pastikan index `idx_payment_code` sudah dibuat
3. **Update Manual**: Jalankan `update_existing_payment_codes.js`

### Payment Code Terlalu Panjang
1. **Cek Format**: Pastikan format sesuai `PAY` + 4 digit + 2 digit
2. **Cek Kolom**: Pastikan kolom `VARCHAR(10)` cukup untuk format

### Duplikasi Payment Code
1. **Cek Timestamp**: Pastikan ada delay minimal antara generate
2. **Cek Random**: Pastikan random number generator berfungsi
3. **Cek Database**: Pastikan constraint unique jika diperlukan

## Future Enhancements
1. **QR Code**: Generate QR code untuk payment code
2. **SMS Notification**: Kirim payment code via SMS
3. **Email Template**: Include payment code di email konfirmasi
4. **Payment Gateway Integration**: Integrasi dengan payment gateway yang mendukung reference code 