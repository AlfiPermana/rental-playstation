// public/js/user/payment.js
document.addEventListener('DOMContentLoaded', async () => {
    // Fungsi untuk memeriksa status autentikasi pengguna (penting untuk halaman ini)
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'user') {
            alert('Anda harus login sebagai pengguna untuk mengakses halaman ini.');
            window.location.href = '/login.html';
        }
    };
    checkAuth();

    // Ambil referensi elemen-elemen HTML untuk menampilkan detail
    const paymentHeaderTitle = document.getElementById('paymentHeaderTitle'); // Ditambahkan di HTML
    const paymentStatusIcon = document.getElementById('paymentStatusIcon');   // Ditambahkan di HTML
    const bookingIdDisplay = document.getElementById('bookingIdDisplay');
    const psNameDisplay = document.getElementById('psNameDisplay');
    const psTypeDisplay = document.getElementById('psTypeDisplay');
    const bookingDateTimeDisplay = document.getElementById('bookingDateTimeDisplay');
    const durationDisplay = document.getElementById('durationDisplay');
    const amountDisplay = document.getElementById('amountDisplay');
    const countdownElement = document.getElementById('countdown');
    const paymentMessage = document.getElementById('paymentMessage');

    // Ambil nomor rekening/DANA/GoPay untuk disalin
    const rekeningBriElement = document.getElementById('rekeningBri');
    const gopayNumberElement = document.getElementById('gopayNumber'); // Referensi untuk nomor GoPay
    const danaNumberElement = document.getElementById('danaNumber');

    // Elemen untuk upload bukti pembayaran
    const uploadProofForm = document.getElementById('uploadProofForm'); // Form upload bukti
    const proofImageInput = document.getElementById('proofImage');     // Input file
    const uploadProofBtn = document.getElementById('uploadProofBtn');   // Tombol upload
    const uploadProofMessage = document.getElementById('uploadProofMessage'); // Pesan untuk upload

    // Ambil parameter dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking_id');
    // const amountFromUrl = urlParams.get('amount'); // Tidak digunakan karena ambil dari API

    // --- Fungsionalitas Countdown Timer ---
    // Atur batas waktu pembayaran (misal 30 menit)
    const paymentTimeoutMinutes = 30; // Anda bisa ubah ini
    let countdownInterval;

    const startCountdown = () => {
        // Asumsi waktu booking dibuat saat ini + timeout. Idealnya, waktu berakhir dikirim dari backend.
        const endTime = new Date().getTime() + paymentTimeoutMinutes * 60 * 1000; 

        countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownElement.textContent = 'Waktu Habis!';
                paymentMessage.textContent = 'Waktu pembayaran Anda telah habis. Booking ini mungkin akan dibatalkan. Harap hubungi admin.';
                paymentMessage.classList.add('error');
                // Nonaktifkan form upload jika waktu habis
                if (uploadProofBtn) uploadProofBtn.disabled = true;
                if (proofImageInput) proofImageInput.disabled = true;
            } else {
                countdownElement.textContent = `${minutes} menit ${seconds} detik`;
            }
        }, 1000);
    };

    // --- Fungsi Salin Teks ---
    const copyToClipboard = (elementId, messageText) => {
        const element = document.getElementById(elementId);
        if (element && navigator.clipboard) {
            navigator.clipboard.writeText(element.textContent).then(() => {
                alert(messageText + ' berhasil disalin!');
            }).catch(err => {
                console.error('Failed to copy text:', err);
                alert('Gagal menyalin. Silakan salin manual.');
            });
        } else {
            // Fallback for older browsers (not critical for this project)
            const textArea = document.createElement('textarea');
            textArea.value = element.textContent;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert(messageText + ' berhasil disalin!');
            } catch (err) {
                console.error('Failed to copy text:', err);
                alert('Gagal menyalin. Browser Anda tidak mendukung. Silakan salin manual.');
            }
            document.body.removeChild(textArea);
        }
    };

    // Tambahkan event listener untuk tombol salin
    const copyButtons = document.querySelectorAll('.copy-btn, .copy-btn-mobile');
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            let message = '';
            if (targetId === 'rekeningBri') {
                message = 'Nomor Rekening BRI';
            } else if (targetId === 'gopayNumber') { // Tambahkan GoPay
                message = 'Nomor GoPay';
            } else if (targetId === 'danaNumber') {
                message = 'Nomor DANA';
            }
            copyToClipboard(targetId, message);
        });
    });


    // --- Memuat Detail Booking dari Backend ---
    const fetchBookingDetails = async () => {
        if (!bookingId) {
            paymentMessage.textContent = 'Nomor booking tidak ditemukan di URL.';
            paymentMessage.classList.add('error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Panggil API untuk mendapatkan detail booking berdasarkan ID
            const response = await fetch(`/api/user/booking-details/${bookingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const bookingDetails = await response.json();

            if (response.ok) {
                // Tampilkan detail booking di halaman
                bookingIdDisplay.textContent = bookingDetails.id;
                psNameDisplay.textContent = bookingDetails.playstation_name;
                psTypeDisplay.textContent = bookingDetails.playstation_type;
                
                const bookingDate = new Date(bookingDetails.booking_date).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
                const startTime = bookingDetails.start_time.substring(0, 5);
                const endTime = bookingDetails.end_time.substring(0, 5);
                bookingDateTimeDisplay.textContent = `${bookingDate}, ${startTime} - ${endTime}`;
                
                durationDisplay.textContent = `${bookingDetails.duration_hours} Jam`;
                amountDisplay.textContent = `Rp ${Number(bookingDetails.amount).toLocaleString('id-ID')}`;

                // --- Update Tampilan Status Pembayaran ---
                paymentStatusIcon.classList.remove('pending', 'success', 'failed'); // Bersihkan kelas sebelumnya

                if (bookingDetails.payment_status === 'pending') {
                    paymentHeaderTitle.textContent = 'Booking Berhasil Dibuat!';
                    paymentStatusIcon.textContent = '⏳'; // Hourglass icon
                    paymentStatusIcon.classList.add('pending');
                    startCountdown(); // Mulai countdown hanya jika pending
                    // Pastikan form upload terlihat
                    if (uploadProofForm) uploadProofForm.style.display = 'block'; 
                } else if (bookingDetails.payment_status === 'paid' || bookingDetails.payment_status === 'confirmed') {
                    paymentHeaderTitle.textContent = 'Pembayaran Dikonfirmasi!';
                    paymentStatusIcon.textContent = '✅'; // Checkmark icon
                    paymentStatusIcon.classList.add('success');
                    if (countdownInterval) clearInterval(countdownInterval); // Hentikan countdown jika sudah dibayar
                    countdownElement.textContent = 'Sudah Dibayar';
                    paymentMessage.textContent = 'Pembayaran Anda telah dikonfirmasi. Booking Anda sudah aktif.';
                    paymentMessage.classList.add('success');
                    // Sembunyikan form upload jika sudah dibayar
                    if (uploadProofForm) uploadProofForm.style.display = 'none'; 
                } else if (bookingDetails.payment_status === 'cancelled' || bookingDetails.payment_status === 'failed') {
                    paymentHeaderTitle.textContent = 'Booking Dibatalkan/Gagal!';
                    paymentStatusIcon.textContent = '❌'; // X icon
                    paymentStatusIcon.classList.add('failed');
                    if (countdownInterval) clearInterval(countdownInterval); // Hentikan countdown
                    countdownElement.textContent = 'Dibatalkan';
                    paymentMessage.textContent = `Booking ini berstatus: ${bookingDetails.payment_status.toUpperCase()}. Harap hubungi admin.`;
                    paymentMessage.classList.add('error');
                    // Sembunyikan form upload jika sudah dibatalkan/gagal
                    if (uploadProofForm) uploadProofForm.style.display = 'none';
                } else { // Status tidak dikenal
                    paymentHeaderTitle.textContent = 'Status Pembayaran Tidak Dikenal!';
                    paymentStatusIcon.textContent = '❓';
                    paymentStatusIcon.classList.add('pending'); // Default ke pending/info
                    countdownElement.textContent = 'Cek Riwayat';
                    paymentMessage.textContent = `Status booking Anda tidak jelas: ${bookingDetails.payment_status}. Mohon hubungi admin.`;
                    paymentMessage.classList.add('error');
                    if (uploadProofForm) uploadProofForm.style.display = 'none';
                }

            } else {
                paymentMessage.textContent = bookingDetails.message || 'Gagal memuat detail booking.';
                paymentMessage.classList.add('error');
                // Sembunyikan form upload jika gagal load detail
                if (uploadProofForm) uploadProofForm.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            paymentMessage.textContent = 'Terjadi kesalahan saat memuat detail booking.';
            paymentMessage.classList.add('error');
            // Sembunyikan form upload jika gagal load detail
            if (uploadProofForm) uploadProofForm.style.display = 'none';
        }
    };

    // --- Fungsionalitas Upload Bukti Pembayaran ---
    if (uploadProofForm) { // Pastikan form ada
        uploadProofForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            uploadProofBtn.disabled = true; // Nonaktifkan tombol saat upload
            uploadProofMessage.textContent = '';
            uploadProofMessage.className = 'message';

            const file = proofImageInput.files[0];
            if (!file) {
                uploadProofMessage.textContent = 'Mohon pilih file gambar.';
                uploadProofMessage.classList.add('error');
                uploadProofBtn.disabled = false;
                return;
            }

            const maxFileSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxFileSize) {
                uploadProofMessage.textContent = 'Ukuran file melebihi 2MB.';
                uploadProofMessage.classList.add('error');
                uploadProofBtn.disabled = false;
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                uploadProofMessage.textContent = 'Format file tidak didukung. Gunakan JPG atau PNG.';
                uploadProofMessage.classList.add('error');
                uploadProofBtn.disabled = false;
                return;
            }

            const formData = new FormData();
            formData.append('proofImage', file); // 'proofImage' harus sesuai dengan nama field di Multer konfigurasi backend

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/user/upload-proof/${bookingId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // 'Content-Type' tidak perlu diset untuk FormData, browser akan set otomatis
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    uploadProofMessage.textContent = data.message;
                    uploadProofMessage.classList.add('success');
                    proofImageInput.value = ''; // Bersihkan input file

                    // Setelah upload sukses, mungkin ingin memperbarui status di halaman
                    // atau memberi tahu user bahwa bukti sudah terkirim dan menunggu verifikasi
                    // Mengambil ulang detail booking akan memperbarui status jika backend sudah memprosesnya
                    alert('Bukti pembayaran berhasil diunggah! Mohon tunggu konfirmasi dari admin.');
                    fetchBookingDetails(); // Reload detail untuk update status
                } else {
                    uploadProofMessage.textContent = data.message || 'Gagal mengunggah bukti pembayaran.';
                    uploadProofMessage.classList.add('error');
                }
            } catch (error) {
                console.error('Error uploading proof:', error);
                uploadProofMessage.textContent = 'Terjadi kesalahan saat mengunggah bukti. Silakan coba lagi.';
                uploadProofMessage.classList.add('error');
            } finally {
                uploadProofBtn.disabled = false; // Selalu aktifkan kembali tombol
            }
        });
    }


    // --- Inisialisasi Saat Halaman Dimuat ---
    fetchBookingDetails(); // Muat detail booking saat halaman dimuat


    // --- Fungsionalitas Logout (di setiap halaman user) ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            window.location.href = '/login.html';
        });
    }
});