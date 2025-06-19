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

    static async getAvailableSlots(playstationId, date) {
        const [existingBookings] = await db.execute(
            'SELECT start_time, end_time FROM bookings WHERE playstation_id = ? AND booking_date = ? AND status IN ("pending", "confirmed")',
            [playstationId, date]
        );

        const openHour = 9;
        const closeHour = 23;
        const allPossibleSlots = [];
        for (let i = openHour; i < closeHour; i++) {
            const startTime = `${String(i).padStart(2, "0")}:00:00`;
            const endTime = `${String(i + 1).padStart(2, "0")}:00:00`;
            allPossibleSlots.push({
                start: startTime,
                end: endTime,
                available: true,
            });
        }

        existingBookings.forEach((bookedSlot) => {
            allPossibleSlots.forEach((possibleSlot) => {
                if (
                    bookedSlot.start_time < possibleSlot.end &&
                    bookedSlot.end_time > possibleSlot.start
                ) {
                    possibleSlot.available = false;
                }
            });
        });
        console.log(allPossibleSlots);
        return allPossibleSlots.filter((slot) => slot.available);
    }

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

    // <<< PENTING: TAMBAHKAN DUA METODE INI >>>
    static async confirmPaymentByAdmin(bookingId) {
        const [result] = await db.execute(
            // Konfirmasi hanya jika status pembayaran 'pending' atau 'uploaded'
            'UPDATE bookings SET status = ?, payment_status = ? WHERE id = ? AND (payment_status = ? OR payment_status = ?)',
            ['confirmed', 'paid', bookingId, 'pending', 'uploaded']
        );
        return result;
    }

    static async rejectPaymentByAdmin(bookingId) {
        const [result] = await db.execute(
            // Tolak hanya jika status pembayaran 'pending' atau 'uploaded'
            'UPDATE bookings SET status = ?, payment_status = ? WHERE id = ? AND (payment_status = ? OR payment_status = ?)',
            ['cancelled', 'failed', bookingId, 'pending', 'uploaded']
        );
        return result;
    }
    // <<< AKHIR METODE YANG DITAMBAHKAN >>>
}

module.exports = Booking;