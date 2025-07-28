const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPaymentCodeColumn() {
    let connection;
    
    try {
        // Buat koneksi database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected to database successfully');

        // 1. Cek struktur tabel bookings saat ini
        console.log('\n📋 Checking current bookings table structure...');
        const [columns] = await connection.execute('DESCRIBE bookings');
        console.log('Current columns in bookings table:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // 2. Cek apakah kolom payment_code sudah ada
        const hasPaymentCode = columns.some(col => col.Field === 'payment_code');
        console.log(`\n🔍 Payment code column exists: ${hasPaymentCode ? '✅ YES' : '❌ NO'}`);

        if (!hasPaymentCode) {
            console.log('\n🔧 Adding payment_code column...');
            await connection.execute('ALTER TABLE bookings ADD COLUMN payment_code VARCHAR(10) NULL AFTER customer_phone');
            console.log('✅ Added payment_code column');
        } else {
            console.log('✅ Payment code column already exists');
        }

        // 3. Cek dan tambah index
        console.log('\n🔍 Checking payment_code index...');
        const [indexes] = await connection.execute('SHOW INDEX FROM bookings');
        const indexNames = indexes.map(idx => idx.Key_name);
        
        if (!indexNames.includes('idx_payment_code')) {
            console.log('  🔧 Adding idx_payment_code index...');
            await connection.execute('CREATE INDEX idx_payment_code ON bookings(payment_code)');
            console.log('  ✅ Added idx_payment_code index');
        } else {
            console.log('  ✅ idx_payment_code index already exists');
        }

        // 4. Update booking yang sudah ada dengan payment_code
        console.log('\n🔄 Updating existing bookings with payment codes...');
        const [existingBookings] = await connection.execute('SELECT id FROM bookings WHERE payment_code IS NULL');
        
        if (existingBookings.length > 0) {
            console.log(`Found ${existingBookings.length} bookings without payment codes`);
            
            for (const booking of existingBookings) {
                const paymentCode = `PAY${String(booking.id).padStart(6, '0')}`;
                await connection.execute('UPDATE bookings SET payment_code = ? WHERE id = ?', [paymentCode, booking.id]);
                console.log(`  ✅ Updated booking ID ${booking.id} with payment code: ${paymentCode}`);
            }
        } else {
            console.log('✅ All existing bookings already have payment codes');
        }

        // 5. Verifikasi perubahan
        console.log('\n📋 Verifying changes...');
        const [newColumns] = await connection.execute('DESCRIBE bookings');
        const paymentCodeColumn = newColumns.find(col => col.Field === 'payment_code');
        console.log('Payment code column:', paymentCodeColumn);

        // 6. Test generate payment code
        console.log('\n🧪 Testing payment code generation...');
        const testPaymentCode = generatePaymentCode();
        console.log(`Generated test payment code: ${testPaymentCode}`);

        console.log('\n🎉 Payment code column addition completed successfully!');

    } catch (error) {
        console.error('❌ Error during payment code column addition:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Fungsi untuk generate payment code
function generatePaymentCode() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PAY${timestamp}${random}`;
}

// Jalankan script
addPaymentCodeColumn(); 