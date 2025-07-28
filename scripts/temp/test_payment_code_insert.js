const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPaymentCodeInsert() {
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

        // Generate payment code
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const paymentCode = `PAY${timestamp}${random}`;
        console.log('Generated payment code:', paymentCode);

        // Test insert
        console.log('\n🧪 Testing insert with payment code...');
        const insertQuery = `
            INSERT INTO bookings (playstation_id, booking_date, start_time, end_time, duration_hours, amount, status, payment_status, customer_name, customer_email, customer_phone, payment_code) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertParams = [
            1, // playstation_id
            '2024-07-26', // booking_date
            '22:00:00', // start_time
            '23:00:00', // end_time
            1, // duration_hours
            5000, // amount
            'pending', // status
            'pending', // payment_status
            'Test Direct Insert', // customer_name
            'test@example.com', // customer_email
            '08123456764', // customer_phone
            paymentCode // payment_code
        ];

        console.log('Insert params:', insertParams);
        
        const [insertResult] = await connection.execute(insertQuery, insertParams);
        console.log('Insert result:', insertResult);

        // Verifikasi insert
        const [verifyBooking] = await connection.execute('SELECT id, customer_name, payment_code FROM bookings WHERE id = ?', [insertResult.insertId]);
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
testPaymentCodeInsert(); 