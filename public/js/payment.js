document.addEventListener('DOMContentLoaded', async () => {
    // Ambil referensi elemen-elemen HTML
    const paymentHeaderTitle = document.getElementById('paymentHeaderTitle');
    const paymentStatusIcon = document.getElementById('paymentStatusIcon');
    const bookingIdDisplay = document.getElementById('bookingIdDisplay');
    const uniqueCodeDisplay = document.getElementById('uniqueCodeDisplay');
    const baseAmountDisplay = document.getElementById('baseAmountDisplay');
    const finalAmountDisplay = document.getElementById('finalAmountDisplay');
    const customerNameDisplay = document.getElementById('customerNameDisplay');
    const psNameDisplay = document.getElementById('psNameDisplay');
    const psTypeDisplay = document.getElementById('psTypeDisplay');
    const bookingDateTimeDisplay = document.getElementById('bookingDateTimeDisplay');
    const durationDisplay = document.getElementById('durationDisplay');
    const exampleUniqueCode = document.getElementById('exampleUniqueCode');
    const exampleFinalAmount = document.getElementById('exampleFinalAmount');
    const countdownElement = document.getElementById('countdown');
    const uploadProofForm = document.getElementById('uploadProofForm');
    const proofImageInput = document.getElementById('proofImage');
    const uploadProofBtn = document.getElementById('uploadProofBtn');
    const uploadProofMessage = document.getElementById('uploadProofMessage');

    // Ambil parameter dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking_id');
    const amountFromUrl = urlParams.get('amount');

    if (!bookingId) {
        alert('Booking ID tidak ditemukan. Silakan kembali ke halaman booking.');
        window.location.href = '/booking';
        return;
    }

    // --- Fungsionalitas Countdown Timer ---
    const paymentTimeoutMinutes = 30;
    let countdownInterval;

    const startCountdown = () => {
        const endTime = new Date().getTime() + paymentTimeoutMinutes * 60 * 1000;

        countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownElement.textContent = 'Waktu Habis!';
                uploadProofMessage.textContent = 'Waktu pembayaran Anda telah habis. Booking ini mungkin akan dibatalkan. Harap hubungi admin.';
                uploadProofMessage.classList.add('error');
                uploadProofMessage.style.display = 'block';
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
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            let messageText = 'Nomor';
            
            if (targetId === 'rekeningBri') {
                messageText = 'Nomor rekening BRI';
            } else if (targetId === 'gopayNumber') {
                messageText = 'Nomor GoPay';
            } else if (targetId === 'danaNumber') {
                messageText = 'Nomor DANA';
            }
            
            copyToClipboard(targetId, messageText);
        });
    });

    // --- Fungsi Ambil Detail Booking ---
    const fetchBookingDetails = async () => {
        try {
            const response = await fetch(`/api/guest/booking/${bookingId}`);
            const booking = await response.json();

            if (response.ok && booking) {
                // Format tanggal
                const bookingDate = new Date(booking.booking_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Format waktu
                const startTime = booking.start_time.substring(0, 5);
                const endTime = booking.end_time.substring(0, 5);

                // Hitung base amount dan final amount
                const uniqueCode = booking.payment_code || '000';
                const finalAmount = booking.amount;
                const baseAmount = finalAmount - parseInt(uniqueCode);

                // Format amounts
                const formattedBaseAmount = new Intl.NumberFormat('id-ID').format(baseAmount);
                const formattedFinalAmount = new Intl.NumberFormat('id-ID').format(finalAmount);

                // Update display elements
                bookingIdDisplay.textContent = booking.id;
                uniqueCodeDisplay.textContent = uniqueCode;
                baseAmountDisplay.textContent = `Rp ${formattedBaseAmount}`;
                finalAmountDisplay.textContent = `Rp ${formattedFinalAmount}`;
                customerNameDisplay.textContent = booking.customer_name || '-';
                psNameDisplay.textContent = booking.playstation_name;
                psTypeDisplay.textContent = booking.playstation_type;
                bookingDateTimeDisplay.textContent = `${bookingDate} ${startTime} - ${endTime}`;
                durationDisplay.textContent = `${booking.duration_hours} jam`;

                // Update contoh di instruksi
                exampleUniqueCode.textContent = uniqueCode;
                exampleFinalAmount.textContent = formattedFinalAmount;

                // Update status berdasarkan payment status
                if (booking.payment_status === 'paid') {
                    paymentStatusIcon.textContent = '✅';
                    paymentHeaderTitle.textContent = 'Pembayaran Berhasil!';
                    countdownElement.textContent = 'Pembayaran telah dikonfirmasi';
                    clearInterval(countdownInterval);
                } else if (booking.payment_status === 'failed') {
                    paymentStatusIcon.textContent = '❌';
                    paymentHeaderTitle.textContent = 'Pembayaran Gagal';
                    countdownElement.textContent = 'Pembayaran gagal atau dibatalkan';
                    clearInterval(countdownInterval);
                }

                console.log('Booking details loaded:', booking);
                console.log('Unique code:', uniqueCode, 'Base amount:', baseAmount, 'Final amount:', finalAmount);
            } else {
                console.error('Failed to fetch booking details:', booking);
                alert('Gagal memuat detail booking. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            alert('Terjadi kesalahan saat memuat detail booking.');
        }
    };

    // --- Fungsi Upload Bukti Pembayaran ---
    const uploadPaymentProof = async (formData) => {
        try {
            const response = await fetch(`/api/guest/upload-proof/${bookingId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                uploadProofMessage.textContent = result.message;
                uploadProofMessage.classList.add('success');
                uploadProofMessage.style.display = 'block';
                
                // Disable form setelah upload berhasil
                uploadProofBtn.disabled = true;
                proofImageInput.disabled = true;
                
                // Refresh booking details untuk update status
                setTimeout(() => {
                    fetchBookingDetails();
                }, 1000);
            } else {
                uploadProofMessage.textContent = result.message || 'Gagal mengupload bukti pembayaran.';
                uploadProofMessage.classList.add('error');
                uploadProofMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error uploading payment proof:', error);
            uploadProofMessage.textContent = 'Terjadi kesalahan saat mengupload bukti pembayaran.';
            uploadProofMessage.classList.add('error');
            uploadProofMessage.style.display = 'block';
        }
    };

    // Event listener untuk form upload
    uploadProofForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = proofImageInput.files[0];
        if (!file) {
            alert('Silakan pilih file bukti pembayaran.');
            return;
        }

        // Validasi file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file terlalu besar. Maksimal 2MB.');
            return;
        }

        // Validasi file type
        if (!file.type.match('image.*')) {
            alert('File harus berupa gambar (JPG/PNG).');
            return;
        }

        uploadProofBtn.disabled = true;
        uploadProofBtn.textContent = 'Mengupload...';

        const formData = new FormData();
        formData.append('proofImage', file);

        await uploadPaymentProof(formData);

        uploadProofBtn.disabled = false;
        uploadProofBtn.textContent = 'Unggah Bukti';
    });

    // --- Inisialisasi ---
    console.log('Payment page loaded for booking ID:', bookingId);
    
    // Load booking details
    await fetchBookingDetails();
    
    // Start countdown timer
    startCountdown();
}); 