const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const multer = require('multer');
const path = require('path');

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diperbolehkan.'), false);
        }
    }
});

// Routes untuk guest booking (tanpa authentication)
router.get('/playstations', guestController.getAvailablePlaystations);
router.get('/available-slots', guestController.getAvailableSlots);
router.post('/book', guestController.createGuestBooking);
router.get('/booking/:bookingId', guestController.getBookingDetails);
router.get('/search', guestController.searchBookings);
router.post('/upload-proof/:bookingId', upload.single('proofImage'), guestController.uploadPaymentProof);

module.exports = router; 