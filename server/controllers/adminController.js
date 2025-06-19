const Playstation = require('../models/Playstation');
const Booking = require('../models/Booking'); // Pastikan ini diimpor
const User = require('../models/User'); // Reuse User model for user management
const db = require('../config/db');

// --- PlayStation Management ---
exports.getAllPlaystations = async (req, res) => {
    try {
        const playstations = await Playstation.getAll();
        res.status(200).json(playstations);
    } catch (error) {
        console.error('Error getting playstations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addPlaystation = async (req, res) => {
    const { name, type, description } = req.body;
    if (!name || !type) {
        return res.status(400).json({ message: 'Name and type are required' });
    }
    try {
        const result = await Playstation.create(name, type, description);
        res.status(201).json({ message: 'PlayStation added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding playstation:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePlaystation = async (req, res) => {
    const { id } = req.params;
    const { name, type, status, description } = req.body;
    if (!name || !type || !status) {
        return res.status(400).json({ message: 'Name, type, and status are required' });
    }
    try {
        const result = await Playstation.update(id, name, type, status, description);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'PlayStation not found' });
        }
        res.status(200).json({ message: 'PlayStation updated successfully' });
    } catch (error) {
        console.error('Error updating playstation:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deletePlaystation = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Playstation.delete(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'PlayStation not found' });
        }
        res.status(200).json({ message: 'PlayStation deleted successfully' });
    } catch (error) {
        console.error('Error deleting playstation:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Booking Management ---
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.getAll(); // Asumsi Booking.getAll() sudah mengambil proof_of_payment_url
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error getting bookings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    // Tambahkan status 'paid', 'failed', 'uploaded', 'refunded' jika ada di ENUM database
    if (!status || !['pending', 'confirmed', 'completed', 'cancelled', 'paid', 'failed', 'uploaded', 'refunded'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided' });
    }
    try {
        const result = await Booking.updateStatus(id, status);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// <<< PENTING: TAMBAHKAN FUNGSI-FUNGSI INI >>>
exports.confirmPayment = async (req, res) => {
    const { bookingId } = req.params;
    try {
        // Panggil metode model untuk mengkonfirmasi pembayaran
        // Metode ini akan mengubah status booking menjadi 'confirmed' dan payment_status menjadi 'paid'
        const result = await Booking.confirmPaymentByAdmin(bookingId);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking tidak ditemukan atau status pembayaran bukan pending/uploaded.' });
        }
        res.status(200).json({ message: 'Pembayaran berhasil dikonfirmasi!' });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ message: 'Server error saat konfirmasi pembayaran.' });
    }
};

exports.rejectPayment = async (req, res) => {
    const { bookingId } = req.params;
    try {
        // Panggil metode model untuk menolak pembayaran
        // Metode ini akan mengubah status booking menjadi 'cancelled' dan payment_status menjadi 'failed'
        const result = await Booking.rejectPaymentByAdmin(bookingId);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking tidak ditemukan atau status pembayaran bukan pending/uploaded.' });
        }
        res.status(200).json({ message: 'Pembayaran berhasil ditolak dan booking dibatalkan.' });
    } catch (error) {
        console.error('Error rejecting payment:', error);
        res.status(500).json({ message: 'Server error saat menolak pembayaran.' });
    }
};
// <<< AKHIR FUNGSI YANG DITAMBAHKAN >>>


// --- User Management ---
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, email, role, created_at FROM users');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Reports (Contoh Sederhana) ---
exports.getDashboardStats = async (req, res) => {
    try {
        const [totalPs] = await db.execute('SELECT COUNT(*) AS count FROM playstations');
        const [availablePs] = await db.execute("SELECT COUNT(*) AS count FROM playstations WHERE status = 'available'");
        const [totalBookingsCount] = await db.execute('SELECT COUNT(*) AS count FROM bookings'); // ID jelas
        const [pendingBookingsCount] = await db.execute("SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'"); // ID jelas
        const [totalUsersCount] = await db.execute('SELECT COUNT(*) AS count FROM users'); // ID jelas

        // Total Pendapatan
        const [totalRevenueResult] = await db.execute('SELECT SUM(amount) AS total_sum FROM bookings WHERE payment_status = "paid"');
        const totalRevenue = totalRevenueResult[0].total_sum || 0;

        // Data bulanan tidak lagi diambil jika grafik dihapus

        res.status(200).json({
            totalPlaystations: totalPs[0].count,
            availablePlaystations: availablePs[0].count,
            totalBookingsCount: totalBookingsCount[0].count, // Kirim dengan ID baru
            pendingBookingsCount: pendingBookingsCount[0].count, // Kirim dengan ID baru
            totalUsersCount: totalUsersCount[0].count, // Kirim dengan ID baru
            totalRevenue: totalRevenue,
            // monthlyBookings: monthlyBookingsData // Tidak perlu dikirim jika tidak ada grafik
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};