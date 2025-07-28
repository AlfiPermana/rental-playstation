# Fitur Pembayaran dengan Kode Unik - Dokumentasi Implementasi

## 📋 Ringkasan

Fitur **"Pembayaran dengan Kode Unik"** telah berhasil diimplementasikan pada website rental PlayStation online. Fitur ini memungkinkan admin untuk dengan mudah mengidentifikasi dan memverifikasi pembayaran manual dengan menambahkan 3 digit angka acak (000-999) pada nominal pembayaran.

## 🎯 Konsep Utama

### Definisi
- **Kode Unik**: 3 digit angka acak (000-999) yang ditambahkan ke nominal pembayaran
- **Total Pembayaran**: Harga sewa asli + kode unik
- **Contoh**: Harga Rp 20.000 + kode unik 456 = Total Rp 20.456

### Manfaat
1. **Verifikasi Otomatis**: Admin dapat dengan mudah mengidentifikasi pembayaran di mutasi bank
2. **Minim Human Error**: Setiap transaksi memiliki nominal unik
3. **Efisiensi**: Mengurangi beban verifikasi manual
4. **Keamanan**: Mencegah kesalahan identifikasi pembayaran

## 🔧 Implementasi Teknis

### 1. Database Schema

```sql
-- Kolom payment_code diubah menjadi VARCHAR(3)
ALTER TABLE bookings MODIFY COLUMN payment_code VARCHAR(3) NULL 
COMMENT 'Kode unik 3 digit (000-999) untuk pembayaran';

-- Index untuk optimasi query
CREATE INDEX idx_payment_code ON bookings(payment_code);
```

### 2. Backend Implementation

#### Model Booking (`server/models/Booking.js`)

```javascript
// Generate kode unik 3 digit
static generatePaymentCode() {
    const uniqueCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return uniqueCode;
}

// Hitung total pembayaran dengan kode unik
static calculateFinalAmount(baseAmount, uniqueCode) {
    const finalAmount = baseAmount + parseInt(uniqueCode);
    return finalAmount;
}

// Method createGuestBooking yang dimodifikasi
static async createGuestBooking(/* params */) {
    const uniqueCode = this.generatePaymentCode();
    const finalAmount = this.calculateFinalAmount(amount, uniqueCode);
    
    // Insert dengan finalAmount dan uniqueCode
    const [result] = await db.execute(
        "INSERT INTO bookings (..., amount, payment_code) VALUES (..., ?, ?)",
        [finalAmount, uniqueCode]
    );
    return result;
}
```

#### Controller (`server/controllers/guestController.js`)

```javascript
// Response yang dimodifikasi untuk mengirim informasi kode unik
res.status(201).json({
    message: "Booking berhasil dibuat. Lanjutkan ke pembayaran.",
    bookingId: bookingId,
    baseAmount: bookingAmount, // Harga asli tanpa kode unik
    uniqueCode: uniqueCode, // Kode unik 3 digit
    finalAmount: finalAmount, // Total pembayaran (harga + kode unik)
    redirectUrl: `http://localhost:3000/payment?booking_id=${bookingId}&amount=${finalAmount}&unique_code=${uniqueCode}`
});
```

### 3. Frontend Implementation

#### Halaman Payment (`public/payment.html`)

```html
<!-- Tampilan informasi kode unik -->
<div class="summary-item">
    <strong>Kode Unik Pembayaran</strong><br>
    <span id="uniqueCodeDisplay" style="font-weight: bold; color: #dc3545; font-size: 20px; background: #f8f9fa; padding: 5px 10px; border-radius: 5px;">-</span>
</div>
<div class="summary-item">
    <strong>Harga Sewa</strong><br>
    <span id="baseAmountDisplay">-</span>
</div>
<div class="summary-item">
    <strong>Total Pembayaran</strong><br>
    <span id="finalAmountDisplay" style="font-weight: bold; color: #28a745; font-size: 18px;">-</span>
</div>

<!-- Instruksi pembayaran -->
<div class="payment-instructions">
    <h3>💡 Instruksi Pembayaran dengan Kode Unik:</h3>
    <ul>
        <li><strong>Transfer tepat sesuai total pembayaran di atas</strong> (termasuk 3 digit kode unik)</li>
        <li><strong>Contoh:</strong> Jika harga Rp 20.000 dan kode unik <span id="exampleUniqueCode">456</span>, transfer Rp <span id="exampleFinalAmount">20.456</span></li>
        <li>Kode unik ini memudahkan admin mengidentifikasi pembayaran Anda</li>
        <li>Pastikan jumlah transfer persis sama dengan total pembayaran</li>
    </ul>
</div>
```

#### JavaScript Payment (`public/js/payment.js`)

```javascript
// Menampilkan informasi kode unik
const fetchBookingDetails = async () => {
    const booking = await response.json();
    
    // Hitung base amount dan final amount
    const uniqueCode = booking.payment_code || '000';
    const finalAmount = booking.amount;
    const baseAmount = finalAmount - parseInt(uniqueCode);
    
    // Update display elements
    uniqueCodeDisplay.textContent = uniqueCode;
    baseAmountDisplay.textContent = `Rp ${formattedBaseAmount}`;
    finalAmountDisplay.textContent = `Rp ${formattedFinalAmount}`;
    
    // Update contoh di instruksi
    exampleUniqueCode.textContent = uniqueCode;
    exampleFinalAmount.textContent = formattedFinalAmount;
};
```

### 4. Admin Panel

#### Tabel Booking (`public/admin/manage-bookings.html`)

```html
<thead>
    <tr>
        <th>ID</th>
        <th>Kode Unik</th>
        <th>User</th>
        <th>PlayStation</th>
        <th>Tanggal & Waktu</th>
        <th>Durasi</th>
        <th>Harga Sewa</th>
        <th>Total Bayar</th>
        <th>Status Booking</th>
        <th>Status Pembayaran</th>
        <th>Bukti Pembayaran</th>
        <th>Aksi</th>
    </tr>
</thead>
```

#### JavaScript Admin (`public/js/admin/manage-bookings.js`)

```javascript
// Menampilkan informasi kode unik di tabel admin
const uniqueCode = booking.payment_code || '000';
const finalAmount = booking.amount;
const baseAmount = finalAmount - parseInt(uniqueCode);

row.innerHTML = `
    <td>${booking.id}</td>
    <td><span style="font-weight: bold; color: #dc3545; background: #f8f9fa; padding: 3px 6px; border-radius: 3px;">${uniqueCode}</span></td>
    <td>${booking.username || booking.customer_name || '-'}</td>
    <td>${booking.playstation_name} (${booking.playstation_type})</td>
    <td>${bookingDate} ${startTime} - ${endTime}</td>
    <td>${booking.duration_hours} jam</td>
    <td>Rp ${Number(baseAmount).toLocaleString('id-ID')}</td>
    <td>Rp ${Number(finalAmount).toLocaleString('id-ID')}</td>
    <td><span class="status-tag ${booking.status}">${booking.status.toUpperCase()}</span></td>
    <td><span class="status-tag ${booking.payment_status}">${booking.payment_status.toUpperCase()}</span></td>
    <td>${proofHtml}</td>
    <td class="action-btns">...</td>
`;
```

## 🧪 Testing

### Test Script (`scripts/temp/test_unique_code_feature.js`)

```javascript
// Test 1: Generate unique codes
for (let i = 0; i < 5; i++) {
    const uniqueCode = Booking.generatePaymentCode();
    console.log(`Generated unique code ${i + 1}: ${uniqueCode}`);
    
    // Verify it's 3 digits
    if (uniqueCode.length !== 3 || !/^\d{3}$/.test(uniqueCode)) {
        throw new Error(`Invalid unique code format: ${uniqueCode}`);
    }
}

// Test 2: Calculate final amounts
const testCases = [
    { baseAmount: 20000, uniqueCode: '456' },
    { baseAmount: 5000, uniqueCode: '123' },
    { baseAmount: 10000, uniqueCode: '789' }
];

testCases.forEach((testCase) => {
    const finalAmount = Booking.calculateFinalAmount(testCase.baseAmount, testCase.uniqueCode);
    const expectedAmount = testCase.baseAmount + parseInt(testCase.uniqueCode);
    
    if (finalAmount !== expectedAmount) {
        throw new Error(`Calculation mismatch: ${finalAmount} != ${expectedAmount}`);
    }
});
```

### Hasil Testing

```
🧪 Testing Unique Code Feature Implementation...
✅ Connected to database successfully

📝 Test 1: Generating unique codes...
   Generated unique code 1: 048
   Generated unique code 2: 409
   Generated unique code 3: 529
   Generated unique code 4: 046
   Generated unique code 5: 497
✅ Unique code generation test passed

💰 Test 2: Calculating final amounts...
   Test case 1: Base amount: Rp 20.000, Unique code: 456, Final amount: Rp 20.456
   Test case 2: Base amount: Rp 5.000, Unique code: 123, Final amount: Rp 5.123
   Test case 3: Base amount: Rp 10.000, Unique code: 789, Final amount: Rp 10.789
✅ Final amount calculation test passed

💾 Test 3: Database insert with unique code...
   Inserted booking ID: 110
   Unique code: 508
   Base amount: Rp 15.000
   Final amount: Rp 15.508
   Verification: payment_code = 508, amount = 15508.00
✅ Database insert test passed

🎉 All tests passed! Unique code feature is working correctly.
```

## 📊 Contoh Penggunaan

### 1. Proses Booking

```bash
# Request booking
curl -X POST http://localhost:3000/api/guest/book \
  -H "Content-Type: application/json" \
  -d '{
    "playstationId":"1",
    "bookingDate":"2025-07-26",
    "startTime":"22:00",
    "durationHours":"1",
    "customerName":"Test Kode Unik",
    "customerEmail":"testkodeunik@example.com",
    "customerPhone":"081234567890"
  }'

# Response
{
  "message": "Booking berhasil dibuat. Lanjutkan ke pembayaran.",
  "bookingId": 111,
  "baseAmount": 5000,
  "uniqueCode": "133",
  "finalAmount": "5133.00",
  "redirectUrl": "http://localhost:3000/payment?booking_id=111&amount=5133.00&unique_code=133"
}
```

### 2. Data di Database

```json
{
  "id": 111,
  "customer_name": "Test Kode Unik",
  "payment_code": "133",
  "amount": "5133.00",
  "playstation_name": "PS 3 UNIT 1",
  "playstation_type": "PS3"
}
```

### 3. Tampilan di Frontend

**Halaman Payment:**
- Kode Unik Pembayaran: **133**
- Harga Sewa: Rp 5.000
- Total Pembayaran: **Rp 5.133**

**Instruksi:**
> Transfer tepat sesuai total pembayaran di atas (termasuk 3 digit kode unik)
> 
> **Contoh:** Jika harga Rp 20.000 dan kode unik 456, transfer Rp 20.456

## 🔄 Workflow Lengkap

1. **User membuat booking** → Sistem generate kode unik 3 digit
2. **Sistem menghitung total** → Harga asli + kode unik
3. **Data disimpan** → `amount` = total, `payment_code` = kode unik
4. **User melihat halaman payment** → Tampil harga asli, kode unik, dan total
5. **User transfer** → Sesuai total pembayaran (termasuk kode unik)
6. **Admin verifikasi** → Cari mutasi bank dengan nominal yang sama persis
7. **Admin konfirmasi** → Booking status berubah menjadi "confirmed"

## ✅ Status Implementasi

- ✅ **Database Schema**: Kolom `payment_code` VARCHAR(3)
- ✅ **Backend Logic**: Generate kode unik dan hitung total
- ✅ **API Response**: Mengirim informasi kode unik
- ✅ **Frontend Display**: Tampil kode unik dan instruksi jelas
- ✅ **Admin Panel**: Tampil informasi kode unik di tabel
- ✅ **Testing**: Semua test case passed
- ✅ **Documentation**: Dokumentasi lengkap

## 🚀 Cara Menggunakan

1. **Restart server** setelah update
2. **Buat booking baru** melalui halaman `/booking`
3. **Lihat halaman payment** yang menampilkan kode unik
4. **Transfer sesuai total pembayaran** (termasuk kode unik)
5. **Admin verifikasi** di panel admin dengan mencari nominal yang sama

## 📝 Catatan Penting

- Kode unik selalu 3 digit (000-999)
- Total pembayaran = harga asli + kode unik
- Admin harus mencari mutasi bank dengan nominal yang persis sama
- Fitur ini memudahkan verifikasi pembayaran manual
- Upload bukti transfer tetap tersedia sebagai cadangan

---

**Fitur "Pembayaran dengan Kode Unik" telah berhasil diimplementasikan dan siap digunakan!** 🎉 