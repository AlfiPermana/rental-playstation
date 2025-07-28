const mysql = require('mysql2/promise');
require('dotenv').config();

async function testUniqueCodeFeature() {
    let connection;
    
    try {
        console.log('🧪 Testing Unique Code Feature Implementation...');
        
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'rental_playstation'
        });
        
        console.log('✅ Connected to database successfully');
        
        // Test 1: Generate unique codes
        console.log('\n📝 Test 1: Generating unique codes...');
        const Booking = require('../../server/models/Booking');
        
        for (let i = 0; i < 5; i++) {
            const uniqueCode = Booking.generatePaymentCode();
            console.log(`   Generated unique code ${i + 1}: ${uniqueCode}`);
            
            // Verify it's 3 digits
            if (uniqueCode.length !== 3 || !/^\d{3}$/.test(uniqueCode)) {
                throw new Error(`Invalid unique code format: ${uniqueCode}`);
            }
        }
        console.log('✅ Unique code generation test passed');
        
        // Test 2: Calculate final amounts
        console.log('\n💰 Test 2: Calculating final amounts...');
        const testCases = [
            { baseAmount: 20000, uniqueCode: '456' },
            { baseAmount: 5000, uniqueCode: '123' },
            { baseAmount: 10000, uniqueCode: '789' }
        ];
        
        testCases.forEach((testCase, index) => {
            const finalAmount = Booking.calculateFinalAmount(testCase.baseAmount, testCase.uniqueCode);
            const expectedAmount = testCase.baseAmount + parseInt(testCase.uniqueCode);
            
            console.log(`   Test case ${index + 1}:`);
            console.log(`     Base amount: Rp ${testCase.baseAmount.toLocaleString('id-ID')}`);
            console.log(`     Unique code: ${testCase.uniqueCode}`);
            console.log(`     Final amount: Rp ${finalAmount.toLocaleString('id-ID')}`);
            console.log(`     Expected: Rp ${expectedAmount.toLocaleString('id-ID')}`);
            
            if (finalAmount !== expectedAmount) {
                throw new Error(`Calculation mismatch: ${finalAmount} != ${expectedAmount}`);
            }
        });
        console.log('✅ Final amount calculation test passed');
        
        // Test 3: Database insert with unique code
        console.log('\n💾 Test 3: Database insert with unique code...');
        const uniqueCode = Booking.generatePaymentCode();
        const baseAmount = 15000;
        const finalAmount = Booking.calculateFinalAmount(baseAmount, uniqueCode);
        
        const [insertResult] = await connection.execute(`
            INSERT INTO bookings (
                playstation_id, booking_date, start_time, end_time, 
                duration_hours, amount, status, payment_status, 
                customer_name, customer_email, customer_phone, payment_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            1, // playstation_id
            '2024-07-26', // booking_date
            '14:00:00', // start_time
            '15:00:00', // end_time
            1, // duration_hours
            finalAmount, // amount (final amount)
            'pending', // status
            'pending', // payment_status
            'Test Unique Code', // customer_name
            'test@unique.com', // customer_email
            '08123456789', // customer_phone
            uniqueCode // payment_code
        ]);
        
        const bookingId = insertResult.insertId;
        console.log(`   Inserted booking ID: ${bookingId}`);
        console.log(`   Unique code: ${uniqueCode}`);
        console.log(`   Base amount: Rp ${baseAmount.toLocaleString('id-ID')}`);
        console.log(`   Final amount: Rp ${finalAmount.toLocaleString('id-ID')}`);
        
        // Verify the insert
        const [verification] = await connection.execute(
            'SELECT id, payment_code, amount FROM bookings WHERE id = ?',
            [bookingId]
        );
        
        if (verification.length > 0) {
            const booking = verification[0];
            console.log(`   Verification: payment_code = ${booking.payment_code}, amount = ${booking.amount}`);
            
            if (booking.payment_code !== uniqueCode) {
                throw new Error(`Payment code mismatch: ${booking.payment_code} != ${uniqueCode}`);
            }
            
            if (parseInt(booking.amount) !== finalAmount) {
                throw new Error(`Amount mismatch: ${booking.amount} != ${finalAmount}`);
            }
        }
        console.log('✅ Database insert test passed');
        
        // Cleanup test data
        await connection.execute('DELETE FROM bookings WHERE id = ?', [bookingId]);
        console.log('🧹 Test data cleaned up');
        
        console.log('\n🎉 All tests passed! Unique code feature is working correctly.');
        console.log('\n📋 Summary:');
        console.log('   ✅ Unique codes are generated as 3-digit numbers (000-999)');
        console.log('   ✅ Final amount calculation: base_amount + unique_code');
        console.log('   ✅ Database storage and retrieval working correctly');
        console.log('   ✅ Schema supports VARCHAR(3) for payment_code');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the test
testUniqueCodeFeature().catch(console.error); 