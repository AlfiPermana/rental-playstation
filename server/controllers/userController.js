const User = require("../models/User");
const Playstation = require("../models/Playstation");
const Booking = require("../models/Booking");
const dotenv = require("dotenv");
const path = require("path"); // <<< PENTING: TAMBAHKAN BARIS INI
const fs = require("fs/promises"); // <<< PENTING: TAMBAHKAN BARIS INI

dotenv.config();

// Fungsi helper untuk menghitung total biaya booking
const calculateTotalBookingAmount = (pricePerHour, durationHours) => {
  if (typeof pricePerHour !== "number" || pricePerHour <= 0) {
    console.warn(`Invalid pricePerHour: ${pricePerHour}. Defaulting to 0.`);
    return 0;
  }
  return pricePerHour * durationHours;
};

// --- Fungsi Controller User ---

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId); // Ambil detail user lebih lengkap

    const allUserBookings = await Booking.getBookingsByUserId(userId);
    const availablePlaystations = await Playstation.getAvailablePlaystations();

    const upcomingBookings = allUserBookings
      .filter(
        (b) =>
          ["pending", "confirmed"].includes(b.status) &&
          new Date(b.booking_date).getTime() >= new Date().setHours(0, 0, 0, 0)
      )
      .sort(
        (a, b) =>
          new Date(a.booking_date).getTime() -
          new Date(b.booking_date).getTime()
      );

    const recentActivities = allUserBookings.slice(0, 5);

    res.status(200).json({
      user: { username: user.username, email: user.email },
      upcomingBookings: upcomingBookings,
      recentActivities: recentActivities,
      availablePlaystations: availablePlaystations,
    });
  } catch (error) {
    console.error("Error getting user dashboard data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPlaystationsForBooking = async (req, res) => {
  try {
    const playstations = await Playstation.getAvailablePlaystations();
    res.status(200).json(playstations);
  } catch (error) {
    console.error("Error fetching playstations for booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAvailableSlots = async (req, res) => {
  const { playstationId, date } = req.query; // Pastikan ini diambil dari req.query
  if (!playstationId || !date) {
    return res
      .status(400)
      .json({ message: "PlayStation ID dan tanggal diperlukan." });
  }
  try {
    const slots = await Booking.getAvailableSlots(playstationId, date);
    res.status(200).json(slots);
  } catch (error) {
    console.error("Error getting available slots:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Mendapatkan Detail Booking untuk Halaman Pembayaran ---
exports.getBookingDetailsForPayment = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    const booking = await Booking.getBookingDetailsForPayment(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking tidak ditemukan." });
    }
    console.log(userId, booking);
    if (booking.user_id != userId) {
      return res
        .status(403)
        .json({ message: "Anda tidak diizinkan melihat detail booking ini." });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error getting booking details for payment:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.createBooking = async (req, res) => {
  // Ambil paymentMethod dari body
  const { playstationId, bookingDate, startTime, durationHours, paymentMethod } = req.body;
  const userId = req.user.id;

  // Validasi input, termasuk paymentMethod
  if (!playstationId || !bookingDate || !startTime || !durationHours || !paymentMethod) {
    return res
      .status(400)
      .json({ message: "Semua detail booking, termasuk metode pembayaran, harus diisi." });
  }

  const psId = Number(playstationId);
  const parsedDurationHours = parseInt(durationHours);

  if (isNaN(parsedDurationHours) || parsedDurationHours <= 0) {
    return res
      .status(400)
      .json({ message: "Durasi harus berupa angka yang valid dan lebih dari 0." });
  }

  // Hitung waktu selesai
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const startDateTime = new Date(
    `${bookingDate}T${String(startHour).padStart(2, "0")}:${String(
      startMinute
    ).padStart(2, "0")}:00`
  );
  startDateTime.setHours(startDateTime.getHours() + parsedDurationHours);
  const endTime = `${String(startDateTime.getHours()).padStart(2, "0")}:${String(
    startDateTime.getMinutes()
  ).padStart(2, "0")}:00`;

  let bookingAmount;
  let playstationData;
  let bookingResult;

  try {
    // Ambil data PS dan hitung harga dasar
    playstationData = await Playstation.getById(psId);
    if (!playstationData) {
      return res.status(404).json({ message: "PlayStation tidak ditemukan di database." });
    }

    const priceFromDb = parseFloat(playstationData.price_per_hour);
    if (isNaN(priceFromDb) || priceFromDb <= 0) {
      return res.status(500).json({ message: "Informasi harga PlayStation tidak valid." });
    }

    bookingAmount = calculateTotalBookingAmount(priceFromDb, parsedDurationHours);
    if (bookingAmount <= 0) {
      return res.status(400).json({
        message: "Jumlah pembayaran tidak valid (hasil perhitungan nol atau negatif).",
      });
    }

    // Perbaiki pengecekan ketersediaan slot
    const availableSlotsForDate = await Booking.getAvailableSlots(
      playstationId,
      bookingDate
    );
    const isSlotActuallyAvailable = availableSlotsForDate.some(
      (slot) => slot.time === startTime
    );

    if (!isSlotActuallyAvailable) {
      return res.status(409).json({
        message: "Slot waktu yang Anda pilih sudah tidak tersedia. Mohon pilih slot lain.",
      });
    }

    // Simpan booking dengan menyertakan metode pembayaran
    bookingResult = await Booking.create(
      userId,
      psId,
      bookingDate,
      startTime,
      endTime,
      parsedDurationHours,
      bookingAmount,
      paymentMethod // Teruskan metode pembayaran ke model
    );
    const bookingId = bookingResult.insertId;

    // Ambil booking yang baru dibuat untuk mendapatkan total akhir dan kode unik
    const newBooking = await Booking.getById(bookingId);
    const finalAmount = newBooking.amount;

    // Respons kondisional berdasarkan metode pembayaran
    if (paymentMethod === 'on_site') {
      res.status(201).json({ message: "Booking berhasil dibuat. Silakan bayar tunai di lokasi.", bookingId: bookingId, finalAmount: finalAmount });
    } else { // 'online' payment
      res.status(201).json({ message: "Booking berhasil dibuat. Lanjutkan ke pembayaran.", bookingId: bookingId, redirectUrl: `${process.env.APP_URL}/user/payment.html?booking_id=${bookingId}&amount=${finalAmount}` });
    }
  } catch (error) {
    console.error("Error in createBooking:", error);
    if (bookingResult && bookingResult.insertId) {
      await Booking.updateStatus(bookingResult.insertId, "cancelled");
    }
    res.status(500).json({
      message: "Server error saat memproses booking. Silakan coba lagi.",
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.getBookingsByUserId(userId);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error getting user bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userData } = user;
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  if (!username || !email) {
    return res
      .status(400)
      .json({ message: "Username and email are required." });
  }

  try {
    const result = await User.updateProfile(userId, username, email);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "User not found or no changes made." });
    }
    res.status(200).json({ message: "Profil berhasil diperbarui." });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserPassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Current and new passwords are required." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password saat ini salah." });
    }

    await User.updatePassword(userId, newPassword);
    res.status(200).json({ message: "Password berhasil diperbarui." });
  } catch (error) {
    console.error("Error updating user password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- Fungsi controller untuk upload bukti pembayaran ---
exports.uploadPaymentProof = async (req, res) => {
  const bookingId = req.params.bookingId; // Ambil bookingId dari URL parameter
  const userId = req.user.id; // User yang sedang login
  const file = req.file; // File yang diupload oleh Multer

  if (!bookingId || !file) {
    // Hapus file jika tidak ada bookingId atau file
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
      } catch (e) {
        console.error("Error deleting file:", e);
      }
    }
    return res.status(400).json({
      message: "Booking ID dan file bukti pembayaran harus disediakan.",
    });
  }

  try {
    // Verifikasi booking: Pastikan bookingId valid dan milik user yang login
    const booking = await Booking.getBookingDetailsForPayment(bookingId); // Menggunakan metode yang sudah ada
    if (!booking) {
      // Hapus file jika booking tidak ditemukan
      if (file && file.path) {
        try {
          await fs.unlink(file.path);
        } catch (e) {
          console.error("Error deleting file:", e);
        }
      }
      return res.status(404).json({ message: "Booking tidak ditemukan." });
    }
    if (booking.user_id !== userId) {
      // Hapus file jika user tidak diizinkan
      if (file && file.path) {
        try {
          await fs.unlink(file.path);
        } catch (e) {
          console.error("Error deleting file:", e);
        }
      }
      return res.status(403).json({
        message: "Anda tidak diizinkan mengupload bukti untuk booking ini.",
      });
    }
    // Pastikan booking masih dalam status pending/unpaid
    if (booking.payment_status !== "pending") {
      // Hapus file jika status bukan pending
      if (file && file.path) {
        try {
          await fs.unlink(file.path);
        } catch (e) {
          console.error("Error deleting file:", e);
        }
      }
      return res.status(400).json({
        message:
          "Bukti pembayaran hanya bisa diupload untuk booking yang statusnya pending.",
      });
    }

    // Simpan path file di database
    const proofUrl = "/uploads/" + path.basename(file.path);

    await Booking.updatePaymentProofUrl(bookingId, proofUrl);

    res.status(200).json({
      message: "Bukti pembayaran berhasil diupload!",
      proofUrl: proofUrl,
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    // Hapus file yang terupload jika ada error database atau lainnya
    if (file && file.path) {
      try {
        // Gunakan 'fs' yang sudah diimpor
        await fs.unlink(file.path);
        console.log("Uploaded file deleted due to error:", file.path);
      } catch (unlinkError) {
        console.error(
          "Error deleting uploaded file due to another error:",
          unlinkError
        );
      }
    }
    res
      .status(500)
      .json({ message: "Server error saat mengupload bukti pembayaran." });
  }
};
