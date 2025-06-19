const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware'); // Pastikan ini diimpor
const multer = require('multer');
const path = require('path');

const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Untuk nama file, kita bisa gunakan bookingId yang dilewatkan di form data
        // atau timestamp + random jika bookingId tidak tersedia langsung di Multer
        cb(null, `bukti_${req.params.bookingId || Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
    }
});
const uploadMiddleware = multer({ storage: uploadStorage }); // Middleware upload lokal untuk router ini



router.get('/dashboard', userController.getDashboardData);
router.get('/playstations-for-booking', userController.getPlaystationsForBooking);
router.get('/available-slots', userController.getAvailableSlots);
router.post('/book', userController.createBooking);
router.get('/bookings', userController.getUserBookings);
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.put('/profile/password', userController.updateUserPassword);
router.get('/booking-details/:bookingId', userController.getBookingDetailsForPayment);
router.post('/upload-proof/:bookingId', verifyToken, checkRole('user'), uploadMiddleware.single('proofImage'), userController.uploadPaymentProof);


module.exports = router;