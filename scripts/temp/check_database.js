const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndFixDatabase() {
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

        // 1. Cek struktur tabel bookings
        console.log('\n📋 Checking bookings table structure...');
        const [columns] = await connection.execute('DESCRIBE bookings');
        console.log('Current columns in bookings table:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // 2. Cek apakah kolom guest booking sudah ada
        const hasCustomerName = columns.some(col => col.Field === 'customer_name');
        const hasCustomerEmail = columns.some(col => col.Field === 'customer_email');
        const hasCustomerPhone = columns.some(col => col.Field === 'customer_phone');

        console.log('\n🔍 Checking for guest booking columns:');
        console.log(`  - customer_name: ${hasCustomerName ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  - customer_email: ${hasCustomerEmail ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  - customer_phone: ${hasCustomerPhone ? '✅ EXISTS' : '❌ MISSING'}`);

        // 3. Tambah kolom yang hilang
        if (!hasCustomerName || !hasCustomerEmail || !hasCustomerPhone) {
            console.log('\n🔧 Adding missing columns...');
            
            if (!hasCustomerName) {
                await connection.execute('ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(255) NULL AFTER user_id');
                console.log('  ✅ Added customer_name column');
            }
            
            if (!hasCustomerEmail) {
                await connection.execute('ALTER TABLE bookings ADD COLUMN customer_email VARCHAR(255) NULL AFTER customer_name');
                console.log('  ✅ Added customer_email column');
            }
            
            if (!hasCustomerPhone) {
                await connection.execute('ALTER TABLE bookings ADD COLUMN customer_phone VARCHAR(20) NULL AFTER customer_email');
                console.log('  ✅ Added customer_phone column');
            }
        }

        // 4. Cek dan tambah index
        console.log('\n🔍 Checking indexes...');
        const [indexes] = await connection.execute('SHOW INDEX FROM bookings');
        const indexNames = indexes.map(idx => idx.Key_name);
        
        console.log('Current indexes:', indexNames);

        if (!indexNames.includes('idx_customer_email_phone')) {
            console.log('  🔧 Adding idx_customer_email_phone index...');
            await connection.execute('CREATE INDEX idx_customer_email_phone ON bookings(customer_email, customer_phone)');
            console.log('  ✅ Added idx_customer_email_phone index');
        }

        if (!indexNames.includes('idx_booking_id')) {
            console.log('  🔧 Adding idx_booking_id index...');
            await connection.execute('CREATE INDEX idx_booking_id ON bookings(id)');
            console.log('  ✅ Added idx_booking_id index');
        }

        // 5. Cek data PlayStation
        console.log('\n🎮 Checking PlayStation data...');
        const [playstations] = await connection.execute('SELECT * FROM playstations');
        console.log(`Found ${playstations.length} PlayStation(s) in database:`);
        playstations.forEach(ps => {
            console.log(`  - ID: ${ps.id}, Name: ${ps.name}, Type: ${ps.type}, Price: ${ps.price_per_hour}`);
        });

        if (playstations.length === 0) {
            console.log('⚠️  No PlayStation data found. Adding sample data...');
            await connection.execute(`
                INSERT INTO playstations (name, type, price_per_hour, status) VALUES 
                ('PS5 Standard', 'PS5', 50000, 'available'),
                ('PS4 Pro', 'PS4', 35000, 'available'),
                ('PS4 Slim', 'PS4', 30000, 'available')
            `);
            console.log('✅ Added sample PlayStation data');
        }

        // 6. Test query guest booking
        console.log('\n🧪 Testing guest booking query...');
        try {
            const testQuery = `
                INSERT INTO bookings (playstation_id, booking_date, start_time, end_time, duration_hours, amount, status, payment_status, customer_name, customer_email, customer_phone) 
                VALUES (1, '2024-01-15', '10:00:00', '12:00:00', 2, 100000, 'pending', 'pending', 'Test User', 'test@example.com', '08123456789')
            `;
            await connection.execute(testQuery);
            console.log('✅ Guest booking query test successful');
            
            // Hapus data test
            await connection.execute('DELETE FROM bookings WHERE customer_email = "test@example.com"');
            console.log('✅ Test data cleaned up');
        } catch (error) {
            console.error('❌ Guest booking query test failed:', error.message);
        }

        console.log('\n🎉 Database check and fix completed successfully!');

    } catch (error) {
        console.error('❌ Error during database check:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Jalankan script
checkAndFixDatabase(); 