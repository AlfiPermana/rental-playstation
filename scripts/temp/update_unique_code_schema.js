const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateUniqueCodeSchema() {
    let connection;
    
    try {
        console.log('🔧 Updating database schema for unique code feature...');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'rental_playstation'
        });
        
        console.log('✅ Connected to database successfully');
        
        // 1. Backup existing payment_code data (optional)
        console.log('📋 Backing up existing payment_code data...');
        const [backupResult] = await connection.execute(`
            CREATE TABLE IF NOT EXISTS bookings_backup_unique_code AS 
            SELECT id, payment_code, amount FROM bookings WHERE payment_code IS NOT NULL
        `);
        console.log('✅ Backup created');
        
        // 2. Clear existing payment_code data first (since we're changing the format)
        console.log('🧹 Clearing existing payment_code data...');
        await connection.execute('UPDATE bookings SET payment_code = NULL');
        console.log('✅ Existing payment_code data cleared');
        
        // 3. Update payment_code column to VARCHAR(3)
        console.log('🔄 Updating payment_code column to VARCHAR(3)...');
        await connection.execute(`
            ALTER TABLE bookings MODIFY COLUMN payment_code VARCHAR(3) NULL 
            COMMENT 'Kode unik 3 digit (000-999) untuk pembayaran'
        `);
        console.log('✅ payment_code column updated');
        
        // 4. Drop old index if exists
        console.log('🗑️ Dropping old index...');
        try {
            await connection.execute('DROP INDEX idx_payment_code ON bookings');
            console.log('✅ Old index dropped');
        } catch (error) {
            console.log('ℹ️ No old index to drop');
        }
        
        // 5. Create new index
        console.log('📊 Creating new index...');
        await connection.execute('CREATE INDEX idx_payment_code ON bookings(payment_code)');
        console.log('✅ New index created');
        
        // 6. Verify schema
        console.log('🔍 Verifying schema changes...');
        const [columns] = await connection.execute('DESCRIBE bookings');
        const paymentCodeColumn = columns.find(col => col.Field === 'payment_code');
        
        if (paymentCodeColumn) {
            console.log('✅ Schema verification:');
            console.log(`   - Field: ${paymentCodeColumn.Field}`);
            console.log(`   - Type: ${paymentCodeColumn.Type}`);
            console.log(`   - Null: ${paymentCodeColumn.Null}`);
            console.log(`   - Comment: ${paymentCodeColumn.Comment}`);
        }
        
        console.log('🎉 Database schema updated successfully for unique code feature!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Restart your server');
        console.log('   2. Test creating a new booking');
        console.log('   3. Verify that unique codes are generated (3 digits: 000-999)');
        console.log('   4. Check that final amount = base amount + unique code');
        
    } catch (error) {
        console.error('❌ Error updating schema:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the script
updateUniqueCodeSchema().catch(console.error); 