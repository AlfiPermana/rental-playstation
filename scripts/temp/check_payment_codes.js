const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPaymentCodes() {
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

        // Cek booking terbaru
        console.log('\n📋 Checking recent bookings...');
        const [bookings] = await connection.execute(`
            SELECT id, customer_name, payment_code, created_at 
            FROM bookings 
            WHERE id >= 90 
            ORDER BY id DESC 
            LIMIT 10
        `);
        
        console.log('Recent bookings:');
        bookings.forEach(booking => {
            console.log(`  - ID: ${booking.id}, Name: ${booking.customer_name}, Payment Code: ${booking.payment_code || 'NULL'}, Created: ${booking.created_at}`);
        });

        // Cek struktur tabel
        console.log('\n📋 Checking table structure...');
        const [columns] = await connection.execute('DESCRIBE bookings');
        const paymentCodeColumn = columns.find(col => col.Field === 'payment_code');
        console.log('Payment code column:', paymentCodeColumn);

        // Test generate payment code
        console.log('\n🧪 Testing payment code generation...');
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const testPaymentCode = `PAY${timestamp}${random}`;
        console.log(`Generated test payment code: ${testPaymentCode}`);

        // Test insert dengan payment code
        console.log('\n🧪 Testing insert with payment code...');
        const testQuery = `
            INSERT INTO bookings (playstation_id, booking_date, start_time, end_time, duration_hours, amount, status, payment_status, customer_name, customer_email, customer_phone, payment_code) 
            VALUES (1, '2024-07-26', '19:00:00', '20:00:00', 1, 5000, 'pending', 'pending', 'Test Insert', 'test@example.com', '08123456768', ?)
        `;
        
        const [insertResult] = await connection.execute(testQuery, [testPaymentCode]);
        console.log('Insert result:', insertResult);

        // Verifikasi insert
        const [verifyBooking] = await connection.execute('SELECT id, payment_code FROM bookings WHERE id = ?', [insertResult.insertId]);
        console.log('Verification:', verifyBooking[0]);

        // Cleanup test data
        await connection.execute('DELETE FROM bookings WHERE id = ?', [insertResult.insertId]);
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Jalankan script
checkPaymentCodes(); 