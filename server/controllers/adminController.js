const Playstation = require("../models/Playstation");
const Booking = require("../models/Booking"); // Pastikan ini diimpor
const User = require("../models/User"); // Reuse User model for user management
const db = require("../config/db");
const { format } = require("date-fns");

// --- PlayStation Management ---
exports.getAllPlaystations = async (req, res) => {
  try {
    const playstations = await Playstation.getAll();
    res.status(200).json(playstations);
  } catch (error) {
    console.error("Error getting playstations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addPlaystation = async (req, res) => {
  // <<< PERBAIKAN: Ambil price_per_hour dari req.body >>>
  const { name, type, description, price_per_hour } = req.body;
  // <<< AKHIR PERBAIKAN >>>

  if (!name || !type || !price_per_hour) {
    // <<< PERBAIKAN: Validasi harga juga >>>
    return res
      .status(400)
      .json({ message: "Name, type, and price per hour are required" });
  }
  // Opsional: validasi tipe data harga di sini juga (sudah ada di frontend manage-ps.js)
  if (isNaN(parseFloat(price_per_hour)) || parseFloat(price_per_hour) <= 0) {
    return res
      .status(400)
      .json({ message: "Harga per jam harus berupa angka positif." });
  }

  try {
    // <<< PERBAIKAN: Teruskan price_per_hour ke Playstation.create >>>
    const result = await Playstation.create(
      name,
      type,
      description,
      parseFloat(price_per_hour)
    );
    // <<< AKHIR PERBAIKAN >>>
    res
      .status(201)
      .json({ message: "PlayStation added successfully", id: result.insertId });
  } catch (error) {
    console.error("Error adding playstation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePlaystation = async (req, res) => {
  const { id } = req.params;
  // <<< PERBAIKAN: Ambil price_per_hour dari req.body >>>
  const { name, type, status, description, price_per_hour } = req.body;
  // <<< AKHIR PERBAIKAN >>>

  if (!name || !type || !status || !price_per_hour) {
    // <<< PERBAIKAN: Validasi harga juga >>>
    return res
      .status(400)
      .json({ message: "Name, type, status, and price per hour are required" });
  }
  // Opsional: validasi tipe data harga
  if (isNaN(parseFloat(price_per_hour)) || parseFloat(price_per_hour) <= 0) {
    return res
      .status(400)
      .json({ message: "Harga per jam harus berupa angka positif." });
  }

  try {
    // <<< PERBAIKAN: Teruskan price_per_hour ke Playstation.update >>>
    const result = await Playstation.update(
      id,
      name,
      type,
      status,
      description,
      parseFloat(price_per_hour)
    );
    // <<< AKHIR PERBAIKAN >>>
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "PlayStation not found" });
    }
    res.status(200).json({ message: "PlayStation updated successfully" });
  } catch (error) {
    console.error("Error updating playstation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deletePlaystation = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Playstation.delete(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "PlayStation not found" });
    }
    res.status(200).json({ message: "PlayStation deleted successfully" });
  } catch (error) {
    console.error("Error deleting playstation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Booking Management ---
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.getAll();
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error getting bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (
    !status ||
    ![
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "paid",
      "failed",
      "uploaded",
      "refunded",
    ].includes(status)
  ) {
    return res.status(400).json({ message: "Invalid status provided" });
  }
  try {
    const result = await Booking.updateStatus(id, status);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ message: "Booking status updated successfully" });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.confirmPayment = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const result = await Booking.confirmPaymentByAdmin(bookingId);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          message:
            "Booking tidak ditemukan atau status pembayaran bukan pending/uploaded.",
        });
    }
    res.status(200).json({ message: "Pembayaran berhasil dikonfirmasi!" });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res
      .status(500)
      .json({ message: "Server error saat konfirmasi pembayaran." });
  }
};

exports.rejectPayment = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const result = await Booking.rejectPaymentByAdmin(bookingId);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          message:
            "Booking tidak ditemukan atau status pembayaran bukan pending/uploaded.",
        });
    }
    res
      .status(200)
      .json({ message: "Pembayaran berhasil ditolak dan booking dibatalkan." });
  } catch (error) {
    console.error("Error rejecting payment:", error);
    res.status(500).json({ message: "Server error saat menolak pembayaran." });
  }
};

// --- User Management ---
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, username, email, role, created_at FROM users"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Reports (Contoh Sederhana) ---
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalPs] = await db.execute(
      "SELECT COUNT(*) AS count FROM playstations"
    );
    const [availablePs] = await db.execute(
      "SELECT COUNT(*) AS count FROM playstations WHERE status = 'available'"
    );
    const [totalBookingsCount] = await db.execute(
      "SELECT COUNT(*) AS count FROM bookings"
    );
    const [pendingBookingsCount] = await db.execute(
      "SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending'"
    );
    const [totalUsersCount] = await db.execute(
      "SELECT COUNT(*) AS count FROM users"
    );

    const [totalRevenueResult] = await db.execute(
      'SELECT SUM(amount) AS total_sum FROM bookings WHERE payment_status = "paid"'
    );
    const totalRevenue = totalRevenueResult[0].total_sum || 0;

    res.status(200).json({
      totalPlaystations: totalPs[0].count,
      availablePlaystations: availablePs[0].count,
      totalBookingsCount: totalBookingsCount[0].count,
      pendingBookingsCount: pendingBookingsCount[0].count,
      totalUsersCount: totalUsersCount[0].count,
      totalRevenue: totalRevenue,
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Business Summary (Rekap Harian, Mingguan, Bulanan, Total) ---
exports.getBusinessSummary = async (req, res) => {
  try {
    // Hari ini
    const [todayBookings] = await db.execute(
      `SELECT COUNT(*) as booking_count FROM bookings WHERE DATE(created_at) = CURDATE()`
    );
    const [todayRevenue] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue FROM bookings WHERE DATE(created_at) = CURDATE() AND payment_status = 'paid'`
    );

    // Minggu ini
    const [weekBookings] = await db.execute(
      `SELECT COUNT(*) as booking_count FROM bookings WHERE YEARWEEK(created_at) = YEARWEEK(NOW())`
    );
    const [weekRevenue] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue FROM bookings WHERE YEARWEEK(created_at) = YEARWEEK(NOW()) AND payment_status = 'paid'`
    );

    // Bulan ini
    const [monthBookings] = await db.execute(
      `SELECT COUNT(*) as booking_count FROM bookings WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())`
    );
    const [monthRevenue] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue FROM bookings WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW()) AND payment_status = 'paid'`
    );

    // Total keseluruhan
    const [totalBookings] = await db.execute(
      `SELECT COUNT(*) as booking_count FROM bookings`
    );
    const [totalRevenue] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue FROM bookings WHERE payment_status = 'paid'`
    );

    res.json({
      today: {
        bookings: todayBookings[0].booking_count,
        revenue: todayRevenue[0].total_revenue,
      },
      thisWeek: {
        bookings: weekBookings[0].booking_count,
        revenue: weekRevenue[0].total_revenue,
      },
      thisMonth: {
        bookings: monthBookings[0].booking_count,
        revenue: monthRevenue[0].total_revenue,
      },
      total: {
        bookings: totalBookings[0].booking_count,
        revenue: totalRevenue[0].total_revenue,
      },
    });
  } catch (error) {
    console.error("Error fetching business summary:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil data rekap bisnis" });
  }
};

/**
 * Mengambil laporan pendapatan detail berdasarkan rentang tanggal.
 */
exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Parameter startDate dan endDate diperlukan." });
    }

    const [rows] = await db.execute(
      `
            SELECT 
                b.created_at,
                COALESCE(b.customer_name, u.username) as customer_name,
                p.name as playstation_name,
                p.type as playstation_type,
                b.duration_hours,
                CASE
                    WHEN b.duration_hours > 0 THEN (b.amount - IFNULL(b.payment_code, 0)) / b.duration_hours
                    ELSE 0
                END as price_per_hour,

                (b.amount - IFNULL(b.payment_code, 0)) as total_revenue,
                b.payment_method
            FROM bookings b
            JOIN playstations p ON b.playstation_id = p.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.payment_status = 'paid' AND DATE(b.created_at) BETWEEN ? AND ?
            ORDER BY b.created_at ASC
        `,
      [startDate, endDate]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil laporan pendapatan" });
  }
};

/**
 * Mengambil rekap laporan pendapatan bulanan.
 */
exports.getMonthlySummaryReport = async (req, res) => {
  try {
    const [rows] = await db.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%M %Y') as month,
                COUNT(*) as transaction_count,
                SUM(duration_hours) as total_hours,
                SUM(amount - IFNULL(payment_code, 0)) as total_revenue
            FROM bookings
            WHERE payment_status = 'paid'
            GROUP BY YEAR(created_at), MONTH(created_at)
            ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC
        `);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching monthly summary report:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil rekap bulanan" });
  }
};
