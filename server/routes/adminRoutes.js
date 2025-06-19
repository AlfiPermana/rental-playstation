const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); // Pastikan ini diimpor

// PlayStation Routes
router.get('/playstations', adminController.getAllPlaystations);
router.post('/playstations', adminController.addPlaystation);
router.put('/playstations/:id', adminController.updatePlaystation);
router.delete('/playstations/:id', adminController.deletePlaystation);

// Booking Routes (Tambahkan rute konfirmasi/tolak pembayaran di sini)
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id/status', adminController.updateBookingStatus);

// <<< TAMBAHKAN DUA RUTE INI >>>
router.put('/bookings/:bookingId/confirm-payment', adminController.confirmPayment);
router.put('/bookings/:bookingId/reject-payment', adminController.rejectPayment);
// <<< AKHIR RUTE YANG DITAMBAHKAN >>>


// User Routes
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Reports/Dashboard Stats
router.get('/stats', adminController.getDashboardStats);

module.exports = router;