const Playstation = require("../models/Playstation");
const Booking = require("../models/Booking");

// Fungsi helper untuk menghitung total biaya booking
const calculateTotalBookingAmount = (pricePerHour, durationHours) => {
    if (typeof pricePerHour !== "number" || pricePerHour <= 0) {
        console.warn(`Invalid pricePerHour: ${pricePerHour}. Defaulting to 0.`);
        return 0;
    }
    return pricePerHour * durationHours;
};

// Validasi email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validasi nomor telepon (format Indonesia)
const isValidPhone = (phone) => {
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    return phoneRegex.test(phone);
};

// Get available playstations for guest booking
exports.getAvailablePlaystations = async (req, res) => {
    try {
        const playstations = await Playstation.getAvailablePlaystations();
        res.status(200).json(playstations);
    } catch (error) {
        console.error("Error fetching playstations for guest booking:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get available slots for guest booking
exports.getAvailableSlots = async (req, res) => {
    const { playstationId, date } = req.query;
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

// Create guest booking (tanpa login)
exports.createGuestBooking = async (req, res) => {
    const { 
        playstationId, 
        bookingDate, 
        startTime, 
        durationHours,
        customerName,
        customerEmail,
        customerPhone
    } = req.body;

    console.log("Guest Booking Request:", req.body);

    // Validasi input
    if (!playstationId || !bookingDate || !startTime || !durationHours) {
        return res
            .status(400)
            .json({ message: "Semua detail booking harus diisi." });
    }

    if (!customerName || !customerEmail || !customerPhone) {
        return res
            .status(400)
            .json({ message: "Nama, email, dan nomor telepon harus diisi." });
    }

    // Validasi format email dan telepon
    if (!isValidEmail(customerEmail)) {
        return res.status(400).json({ message: "Format email tidak valid." });
    }

    if (!isValidPhone(customerPhone)) {
        return res.status(400).json({ 
            message: "Format nomor telepon tidak valid. Gunakan format: 08xxxxxxxxxx" 
        });
    }

    const psId = Number(playstationId);
    const parsedDurationHours = parseInt(durationHours);

    if (isNaN(parsedDurationHours) || parsedDurationHours <= 0) {
        return res.status(400).json({
            message: "Durasi harus berupa angka yang valid dan lebih dari 0.",
        });
    }

    // Hitung waktu selesai
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDateTime = new Date(
        `${bookingDate}T${String(startHour).padStart(2, "0")}:${String(
            startMinute
        ).padStart(2, "0")}:00`
    );
    startDateTime.setHours(startDateTime.getHours() + parsedDurationHours);
    const endTime = `${String(startDateTime.getHours()).padStart(
        2,
        "0"
    )}:${String(startDateTime.getMinutes()).padStart(2, "0")}:00`;

    let bookingAmount;
    let playstationData;
    let bookingResult;

    try {
        console.log("Step 1: Getting PlayStation data for ID:", psId);
        
        // Ambil data PlayStation
        playstationData = await Playstation.getById(psId);
        if (!playstationData) {
            console.error("PlayStation not found for ID:", psId);
            return res
                .status(404)
                .json({ message: "PlayStation tidak ditemukan di database." });
        }

        console.log("Step 2: PlayStation data:", playstationData);

        const priceFromDb = parseFloat(playstationData.price_per_hour);

        if (isNaN(priceFromDb) || priceFromDb <= 0) {
            console.error(
                "ERROR: price_per_hour dari database tidak valid untuk PS ID:",
                psId,
                "Nilai:",
                playstationData.price_per_hour
            );
            return res
                .status(500)
                .json({ message: "Informasi harga PlayStation tidak valid." });
        }

        bookingAmount = calculateTotalBookingAmount(priceFromDb, parsedDurationHours);
        console.log("Step 3: Calculated booking amount:", bookingAmount);

        if (bookingAmount <= 0) {
            return res.status(400).json({
                message: "Jumlah pembayaran tidak valid (hasil perhitungan nol atau negatif).",
            });
        }

        console.log("Step 4: Checking slot availability");
        
        // Cek ketersediaan slot
        const availableSlotsForDate = await Booking.getAvailableSlots(
            playstationId,
            bookingDate
        );
        const isSlotActuallyAvailable = availableSlotsForDate.some(
            (slot) => slot.time === startTime
        );

        console.log("Step 5: Available slots:", availableSlotsForDate);
        console.log("Step 6: Is slot available:", isSlotActuallyAvailable);

        if (!isSlotActuallyAvailable) {
            return res.status(409).json({
                message: "Slot waktu yang Anda pilih sudah tidak tersedia. Mohon pilih slot lain.",
            });
        }

        console.log("Step 7: Creating guest booking with data:", {
            psId,
            bookingDate,
            startTime,
            endTime,
            parsedDurationHours,
            bookingAmount,
            customerName,
            customerEmail,
            customerPhone
        });

        // Buat booking untuk guest
        console.log("Step 7.5: Calling Booking.createGuestBooking...");
        bookingResult = await Booking.createGuestBooking(
            psId,
            bookingDate,
            startTime,
            endTime,
            parsedDurationHours,
            bookingAmount,
            customerName,
            customerEmail,
            customerPhone
        );
        
        console.log("Step 8: Booking created successfully:", bookingResult);
        
        const bookingId = bookingResult.insertId;

        // Ambil data booking yang baru dibuat untuk mendapatkan kode unik
        const newBooking = await Booking.findByBookingId(bookingId);
        const uniqueCode = newBooking.payment_code;
        const finalAmount = newBooking.amount;

        // Response sukses dengan informasi kode unik
        res.status(201).json({
            message: "Booking berhasil dibuat. Lanjutkan ke pembayaran.",
            bookingId: bookingId,
            baseAmount: bookingAmount, // Harga asli tanpa kode unik
            uniqueCode: uniqueCode, // Kode unik 3 digit
            finalAmount: finalAmount, // Total pembayaran (harga + kode unik)
            redirectUrl: `http://localhost:3000/payment?booking_id=${bookingId}&amount=${finalAmount}&unique_code=${uniqueCode}`,
        });

    } catch (error) {
        console.error("Error in createGuestBooking:", error);
        console.error("Error stack:", error.stack);
        
        if (bookingResult && bookingResult.insertId) {
            try {
                await Booking.updateStatus(bookingResult.insertId, "cancelled");
            } catch (cleanupError) {
                console.error("Error cleaning up booking:", cleanupError);
            }
        }
        res.status(500).json({
            message: "Server error saat memproses booking. Silakan coba lagi.",
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get booking details for guest (untuk tracking)
exports.getBookingDetails = async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await Booking.findByBookingId(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking tidak ditemukan." });
        }

        res.status(200).json(booking);
    } catch (error) {
        console.error("Error getting booking details:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// Search bookings by email and phone
exports.searchBookings = async (req, res) => {
    const { email, phone } = req.query;

    if (!email || !phone) {
        return res.status(400).json({ 
            message: "Email dan nomor telepon diperlukan untuk mencari booking." 
        });
    }

    try {
        const bookings = await Booking.findByEmailAndPhone(email, phone);
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error searching bookings:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// Upload payment proof for guest booking
exports.uploadPaymentProof = async (req, res) => {
    const { bookingId } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: "File bukti pembayaran diperlukan." });
    }

    try {
        // Cek apakah booking exists dan milik guest
        const booking = await Booking.findByBookingId(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking tidak ditemukan." });
        }

        // Update payment proof URL
        const proofUrl = `/uploads/${req.file.filename}`;
        await Booking.updatePaymentProofUrl(bookingId, proofUrl);

        res.status(200).json({ 
            message: "Bukti pembayaran berhasil diupload. Admin akan memverifikasi pembayaran Anda." 
        });
    } catch (error) {
        console.error("Error uploading payment proof:", error);
        res.status(500).json({ message: "Server error saat mengupload bukti pembayaran." });
    }
}; 