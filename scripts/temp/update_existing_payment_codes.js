const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateExistingPaymentCodes() {
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

        // Cek booking yang tidak memiliki payment code
        console.log('\n📋 Checking bookings without payment codes...');
        const [bookingsWithoutCode] = await connection.execute(`
            SELECT id, customer_name, created_at 
            FROM bookings 
            WHERE payment_code IS NULL 
            ORDER BY id DESC
        `);
        
        console.log(`Found ${bookingsWithoutCode.length} bookings without payment codes`);
        
        if (bookingsWithoutCode.length > 0) {
            console.log('\n🔄 Updating payment codes...');
            
            for (const booking of bookingsWithoutCode) {
                // Generate payment code
                const timestamp = Date.now().toString().slice(-4);
                const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
                const paymentCode = `PAY${timestamp}${random}`;
                
                // Update booking
                await connection.execute(
                    'UPDATE bookings SET payment_code = ? WHERE id = ?',
                    [paymentCode, booking.id]
                );
                
                console.log(`  ✅ Updated booking ID ${booking.id} (${booking.customer_name}) with payment code: ${paymentCode}`);
                
                // Wait a bit to ensure unique timestamps
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Verifikasi update
        console.log('\n📋 Verifying updates...');
        const [updatedBookings] = await connection.execute(`
            SELECT id, customer_name, payment_code 
            FROM bookings 
            WHERE payment_code IS NOT NULL 
            ORDER BY id DESC 
            LIMIT 10
        `);
        
        console.log('Recent bookings with payment codes:');
        updatedBookings.forEach(booking => {
            console.log(`  - ID: ${booking.id}, Name: ${booking.customer_name}, Payment Code: ${booking.payment_code}`);
        });

        console.log('\n🎉 Payment code update completed successfully!');

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
updateExistingPaymentCodes(); 