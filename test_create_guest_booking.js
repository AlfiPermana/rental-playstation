const mysql = require('mysql2/promise');
require('dotenv').config();

// Simulasi method generatePaymentCode
function generatePaymentCode() {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const paymentCode = `PAY${timestamp}${random}`;
    console.log('generatePaymentCode called, result:', paymentCode);
    return paymentCode;
}

// Simulasi method createGuestBooking
async function createGuestBooking(
    playstationId,
    bookingDate,
    startTime,
    endTime,
    durationHours,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    connection
) {
    try {
        console.log('createGuestBooking called with params:', {
            playstationId, bookingDate, startTime, endTime, durationHours, amount, customerName, customerEmail, customerPhone
        });
        
        // Generate payment code
        console.log('About to call generatePaymentCode...');
        const paymentCode = generatePaymentCode();
        console.log('Generated payment code:', paymentCode);
        
        const [result] = await connection.execute(
            "INSERT INTO bookings (playstation_id, booking_date, start_time, end_time, duration_hours, amount, status, payment_status, customer_name, customer_email, customer_phone, payment_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                playstationId,
                bookingDate,
                startTime,
                endTime,
                durationHours,
                amount,
                "pending",
                "pending",
                customerName,
                customerEmail,
                customerPhone,
                paymentCode,
            ]
        );
        console.log('Booking created with payment code:', paymentCode);
        return result;
    } catch (error) {
        console.error('Error in createGuestBooking:', error);
        throw error;
    }
}

async function testCreateGuestBooking() {
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

        // Test createGuestBooking
        console.log('\n🧪 Testing createGuestBooking method...');
        const result = await createGuestBooking(
            1, // playstationId
            '2024-07-26', // bookingDate
            '23:00:00', // startTime
            '00:00:00', // endTime
            1, // durationHours
            5000, // amount
            'Test Create Guest Booking', // customerName
            'test@example.com', // customerEmail
            '08123456759', // customerPhone
            connection
        );

        console.log('Create guest booking result:', result);

        // Verifikasi insert
        const [verifyBooking] = await connection.execute('SELECT id, customer_name, payment_code FROM bookings WHERE id = ?', [result.insertId]);
        console.log('Verification:', verifyBooking[0]);

        // Cleanup test data
        await connection.execute('DELETE FROM bookings WHERE id = ?', [result.insertId]);
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
testCreateGuestBooking(); 