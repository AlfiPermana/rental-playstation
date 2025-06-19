// const express = require('express');
// const router = express.Router();
// const Booking = require('../models/Booking'); // Import model Booking
// const { CoreApi } = require('midtrans-client'); // Import sesuai kebutuhan midtrans
// const dotenv = require('dotenv');

// dotenv.config();

// // Konfigurasi Midtrans (contoh)
// const midtransConfig = {
//     isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
//     serverKey: process.env.MIDTRANS_SERVER_KEY,
//     clientKey: process.env.MIDTRANS_CLIENT_KEY
// };
// const coreApi = new CoreApi(midtransConfig);


// // Endpoint untuk menerima notifikasi dari Midtrans
// router.post('/midtrans-notification', async (req, res) => {
//     try {
//         const notification = req.body;
//         const transactionStatus = await coreApi.transaction.notification(notification);

//         // Debugging logs (penting untuk webhook)
//         console.log('Midtrans Notification received:', transactionStatus);

//         let orderId = transactionStatus.order_id;
//         let transactionId = transactionStatus.transaction_id;
//         let fraudStatus = transactionStatus.fraud_status;
//         let paymentType = transactionStatus.payment_type;
//         let bookingId = orderId.split('-')[1]; // Ekstrak bookingId dari order_id kita

//         let bookingNewStatus = 'pending'; // Default
//         let paymentNewStatus = 'pending'; // Default

//         if (transactionStatus.transaction_status === 'capture') {
//             if (fraudStatus === 'challenge') {
//                 // TODO: handle challenge status
//                 bookingNewStatus = 'pending';
//                 paymentNewStatus = 'pending';
//             } else if (fraudStatus === 'accept') {
//                 bookingNewStatus = 'confirmed'; // Booking dikonfirmasi
//                 paymentNewStatus = 'paid';
//             }
//         } else if (transactionStatus.transaction_status === 'settlement') {
//             bookingNewStatus = 'confirmed'; // Booking dikonfirmasi
//             paymentNewStatus = 'paid';
//         } else if (transactionStatus.transaction_status === 'cancel' ||
//                    transactionStatus.transaction_status === 'expire' ||
//                    transactionStatus.transaction_status === 'deny') {
//             bookingNewStatus = 'cancelled'; // Booking dibatalkan
//             paymentNewStatus = 'failed';
//         } else if (transactionStatus.transaction_status === 'pending') {
//             // Keep booking and payment status pending
//             bookingNewStatus = 'pending';
//             paymentNewStatus = 'pending';
//         } else if (transactionStatus.transaction_status === 'refund' ||
//                    transactionStatus.transaction_status === 'partial_refund') {
//             bookingNewStatus = 'cancelled'; // Atau tambahkan status refund di booking
//             paymentNewStatus = 'refunded';
//         }

//         // Update status booking di database
//         await Booking.updateStatus(bookingId, bookingNewStatus);
//         await Booking.updatePaymentStatus(bookingId, paymentNewStatus, transactionId, paymentType);

//         res.status(200).send('OK'); // Penting: Kirim respons OK ke Midtrans
//     } catch (error) {
//         console.error('Error processing Midtrans notification:', error);
//         res.status(500).send('Error');
//     }
// });

// module.exports = router;