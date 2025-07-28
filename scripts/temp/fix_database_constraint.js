const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabaseConstraint() {
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

        // 1. Cek constraint user_id saat ini
        console.log('\n📋 Checking current user_id constraint...');
        const [columns] = await connection.execute('DESCRIBE bookings');
        const user_id_column = columns.find(col => col.Field === 'user_id');
        console.log('user_id column:', user_id_column);

        // 2. Ubah user_id menjadi nullable
        if (user_id_column.Null === 'NO') {
            console.log('\n🔧 Making user_id nullable...');
            await connection.execute('ALTER TABLE bookings MODIFY COLUMN user_id INT NULL');
            console.log('✅ user_id is now nullable');
        } else {
            console.log('✅ user_id is already nullable');
        }

        // 3. Verifikasi perubahan
        console.log('\n📋 Verifying changes...');
        const [newColumns] = await connection.execute('DESCRIBE bookings');
        const new_user_id_column = newColumns.find(col => col.Field === 'user_id');
        console.log('Updated user_id column:', new_user_id_column);

        // 4. Test insert guest booking
        console.log('\n🧪 Testing guest booking insert...');
        const testQuery = `
            INSERT INTO bookings (playstation_id, booking_date, start_time, end_time, duration_hours, amount, status, payment_status, customer_name, customer_email, customer_phone) 
            VALUES (1, '2024-01-15', '10:00:00', '12:00:00', 2, 10000.00, 'pending', 'pending', 'Test User', 'test@example.com', '08123456789')
        `;
        
        const [result] = await connection.execute(testQuery);
        console.log('✅ Guest booking insert successful, ID:', result.insertId);

        // 5. Verifikasi data berhasil diinsert
        const [testData] = await connection.execute('SELECT * FROM bookings WHERE customer_email = "test@example.com"');
        console.log('✅ Test data inserted:', testData[0]);

        // 6. Cleanup test data
        await connection.execute('DELETE FROM bookings WHERE customer_email = "test@example.com"');
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 Database constraint fix completed successfully!');

    } catch (error) {
        console.error('❌ Error during database fix:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Jalankan script
fixDatabaseConstraint(); 