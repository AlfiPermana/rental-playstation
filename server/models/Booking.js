const db = require("../config/db");

class Booking {
    static async getAll() {
        const [rows] = await db.execute(`
            SELECT b.*, u.username, p.name AS playstation_name, p.type AS playstation_type,
            b.proof_of_payment_url -- Pastikan kolom ini sudah ada di tabel bookings
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN playstations p ON b.playstation_id = p.id
            ORDER BY b.created_at DESC
        `);
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.execute(
            `
            SELECT b.*, u.username, p.name AS playstation_name, p.type AS playstation_type
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN playstations p ON b.playstation_id = p.id
            WHERE b.id = ?
            `,
            [id]
        );
        return rows[0];
    }

    static async updateStatus(id, status) {
        const [result] = await db.execute(
            "UPDATE bookings SET status = ? WHERE id = ?",
            [status, id]
        );
        return result;
    }

    static async updatePaymentProofUrl(bookingId, proofUrl) {
        const [result] = await db.execute(
            "UPDATE bookings SET proof_of_payment_url = ? WHERE id = ?",
            [proofUrl, bookingId]
        );
        return result;
    }

    static async create(
        userId,
        playstationId,
        bookingDate,
        startTime,
        endTime,
        durationHours,
        amount
    ) {
        const [result] = await db.execute(
            "INSERT INTO bookings (user_id, playstation_id, booking_date, start_time, end_time, duration_hours, amount, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                userId,
                playstationId,
                bookingDate,
                startTime,
                endTime,
                durationHours,
                amount,
                "pending",
                "pending",
            ]
        );
        return result;
    }

    static async getBookingsByUserId(userId) {
        const [rows] = await db.execute(
            `
            SELECT b.*, p.name AS playstation_name, p.type AS playstation_type
            FROM bookings b
            JOIN playstations p ON b.playstation_id = p.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time DESC
            `,
            [userId]
        );
        return rows;
    }

    // <<< PERBAIKAN DI SINI: static async getAvailableSlots >>>
    static async getAvailableSlots(playstationId, date) {
        // Konversi tanggal yang dipilih ke format YYYY-MM-DD untuk perbandingan SQL
        const selectedDate = new Date(date).toISOString().split('T')[0];
        const now = new Date(); // Waktu saat ini
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();

        // Ambil semua booking yang sudah ada untuk playstation dan tanggal tersebut
        const [existingBookings] = await db.execute(
            'SELECT start_time, duration_hours FROM bookings WHERE playstation_id = ? AND DATE(booking_date) = ? AND (status = "pending" OR status = "confirmed")',
            [playstationId, selectedDate]
        );

        const openHour = 9; // Jam buka rental (misal: 09:00)
        const closeHour = 23; // Jam tutup rental (misal: 23:00, yang berarti slot terakhir adalah 22:00-23:00)

        const allPossibleSlots = [];
        for (let hour = openHour; hour < closeHour; hour++) {
            const slotStart = `${String(hour).padStart(2, '0')}:00:00`;
            const slotEnd = `${String(hour + 1).padStart(2, '0')}:00:00`;

            // --- LOGIKA FILTER WAKTU YANG SUDAH LEWAT (REAL-TIME) ---
            // Jika tanggal yang dipilih adalah HARI INI, dan jam slot sudah lewat dari jam sekarang,
            // maka slot ini tidak perlu ditampilkan.
            if (selectedDate === now.toISOString().split('T')[0]) {
                if (hour < currentHour || (hour === currentHour && currentMinutes >= 0)) { // Jika jam slot sudah lewat atau sama dengan jam sekarang (menit berapapun)
                    continue; // Lewati slot ini, jangan masukkan ke allPossibleSlots
                }
            }
            // --- AKHIR LOGIKA FILTER WAKTU LEWAT ---

            let isBooked = false;
            for (const booked of existingBookings) {
                // Konversi waktu booking yang sudah ada ke objek Date untuk perbandingan
                // Kita perlu tanggal juga untuk membuat objek Date yang valid
                const bookedStartDateTime = new Date(`${selectedDate}T${booked.start_time}`);
                const bookedEndDateTime = new Date(bookedStartDateTime.getTime() + booked.duration_hours * 60 * 60 * 1000);

                const possibleSlotStartDateTime = new Date(`${selectedDate}T${slotStart}`);
                const possibleSlotEndDateTime = new Date(`${selectedDate}T${slotEnd}`);

                // Cek apakah slot yang sedang diiterasi tumpang tindih dengan booking yang sudah ada
                // Tumpang tindih jika (slotStart < bookedEnd) AND (slotEnd > bookedStart)
                if (
                    (possibleSlotStartDateTime < bookedEndDateTime && possibleSlotEndDateTime > bookedStartDateTime)
                ) {
                    isBooked = true;
                    break;
                }
            }

            if (!isBooked) {
                allPossibleSlots.push({
                    time: slotStart.substring(0, 5), // Kirim format HH:MM ke frontend
                    // Anda bisa menambahkan status atau info lain jika diperlukan
                });
            }
        }
        // console.log("Available Slots (Backend):", allPossibleSlots); // Debugging
        return allPossibleSlots; // Mengembalikan semua slot yang tidak terbooking dan belum lewat
    }
    // <<< AKHIR PERBAIKAN >>>

    static async getBookingDetailsForPayment(bookingId) {
        const [rows] = await db.execute(
            `
            SELECT b.id, b.amount, b.booking_date, b.start_time, b.duration_hours, b.status, b.payment_status,
                   p.name AS playstation_name, p.type AS playstation_type, u.username, u.email, b.user_id, b.end_time, b.proof_of_payment_url
            FROM bookings b
            JOIN playstations p ON b.playstation_id = p.id
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
            `,
            [bookingId]
        );
        return rows[0];
    }

    static async updatePaymentStatus(
        bookingId,
        paymentStatus,
        paymentGatewayRef = null,
        paymentMethod = null
    ) {
        const [result] = await db.execute(
            "UPDATE bookings SET payment_status = ?, payment_gateway_ref = ?, payment_method = ? WHERE id = ?",
            [paymentStatus, paymentGatewayRef, paymentMethod, bookingId]
        );
        return result;
    }

    static async confirmPaymentByAdmin(bookingId) {
        const [result] = await db.execute(
            'UPDATE bookings SET status = ?, payment_status = ? WHERE id = ? AND (payment_status = ? OR payment_status = ?)',
            ['confirmed', 'paid', bookingId, 'pending', 'uploaded']
        );
        return result;
    }

    static async rejectPaymentByAdmin(bookingId) {
        const [result] = await db.execute(
            'UPDATE bookings SET status = ?, payment_status = ? WHERE id = ? AND (payment_status = ? OR payment_status = ?)',
            ['cancelled', 'failed', bookingId, 'pending', 'uploaded']
        );
        return result;
    }
}

module.exports = Booking;