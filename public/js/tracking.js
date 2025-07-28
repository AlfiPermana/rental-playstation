document.addEventListener('DOMContentLoaded', () => {
    // Ambil referensi elemen-elemen HTML
    const searchTabs = document.querySelectorAll('.search-tab');
    const searchContents = document.querySelectorAll('.search-content');
    const bookingIdInput = document.getElementById('bookingId');
    const searchEmailInput = document.getElementById('searchEmail');
    const searchPhoneInput = document.getElementById('searchPhone');
    const searchByIdBtn = document.getElementById('searchByIdBtn');
    const searchByEmailPhoneBtn = document.getElementById('searchByEmailPhoneBtn');
    const bookingDetails = document.getElementById('bookingDetails');
    const bookingMessage = document.getElementById('bookingMessage');

    // Tab switching functionality
    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs and contents
            searchTabs.forEach(t => t.classList.remove('active'));
            searchContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`${targetTab}-search`).classList.add('active');
        });
    });

    // Search by Booking ID
    searchByIdBtn.addEventListener('click', async () => {
        const bookingId = bookingIdInput.value.trim();
        
        if (!bookingId) {
            showMessage('Masukkan Booking ID untuk mencari.', 'error');
            return;
        }

        searchByIdBtn.disabled = true;
        showMessage('Mencari booking...', 'info');

        try {
            const response = await fetch(`/api/guest/booking/${bookingId}`);
            const data = await response.json();

            if (response.ok && data) {
                displayBookingDetails(data);
                showMessage('Booking ditemukan!', 'success');
            } else {
                showMessage('Booking tidak ditemukan. Periksa kembali Booking ID.', 'error');
                hideBookingDetails();
            }
        } catch (error) {
            console.error('Error searching booking:', error);
            showMessage('Terjadi kesalahan saat mencari booking.', 'error');
        } finally {
            searchByIdBtn.disabled = false;
        }
    });

    // Search by Email and Phone
    searchByEmailPhoneBtn.addEventListener('click', async () => {
        const email = searchEmailInput.value.trim();
        const phone = searchPhoneInput.value.trim();
        
        if (!email || !phone) {
            showMessage('Masukkan email dan nomor telepon untuk mencari.', 'error');
            return;
        }

        searchByEmailPhoneBtn.disabled = true;
        showMessage('Mencari booking...', 'info');

        try {
            const response = await fetch(`/api/guest/search?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
            const data = await response.json();

            if (response.ok && data && data.length > 0) {
                // If multiple bookings found, show the most recent one
                const mostRecentBooking = data[0];
                displayBookingDetails(mostRecentBooking);
                showMessage(`Ditemukan ${data.length} booking. Menampilkan yang terbaru.`, 'success');
            } else {
                showMessage('Tidak ada booking ditemukan dengan email dan nomor telepon tersebut.', 'error');
                hideBookingDetails();
            }
        } catch (error) {
            console.error('Error searching bookings:', error);
            showMessage('Terjadi kesalahan saat mencari booking.', 'error');
        } finally {
            searchByEmailPhoneBtn.disabled = false;
        }
    });

    // Function to display booking details
    const displayBookingDetails = (booking) => {
        // Format date
        const bookingDate = new Date(booking.booking_date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Format time
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
        document.getElementById('displayBookingId').textContent = booking.id;
        document.getElementById('displayUniqueCode').textContent = uniqueCode;
        document.getElementById('displayBaseAmount').textContent = `Rp ${formattedBaseAmount}`;
        document.getElementById('displayFinalAmount').textContent = `Rp ${formattedFinalAmount}`;
        document.getElementById('displayCustomerName').textContent = booking.customer_name || '-';
        document.getElementById('displayCustomerEmail').textContent = booking.customer_email || '-';
        document.getElementById('displayCustomerPhone').textContent = booking.customer_phone || '-';
        document.getElementById('displayPlaystation').textContent = `${booking.playstation_name} (${booking.playstation_type})`;
        document.getElementById('displayBookingDate').textContent = bookingDate;
        document.getElementById('displayBookingTime').textContent = `${startTime} - ${endTime}`;
        document.getElementById('displayDuration').textContent = `${booking.duration_hours} jam`;

        // Update status badges
        const statusBadge = document.getElementById('displayStatus');
        statusBadge.textContent = booking.status;
        statusBadge.className = `status-badge status-${booking.status}`;

        const paymentStatusBadge = document.getElementById('displayPaymentStatus');
        paymentStatusBadge.textContent = booking.payment_status;
        paymentStatusBadge.className = `status-badge status-${booking.payment_status}`;

        // Show booking details
        bookingDetails.classList.add('show');
    };

    // Function to hide booking details
    const hideBookingDetails = () => {
        bookingDetails.classList.remove('show');
    };

    // Function to show messages
    const showMessage = (message, type) => {
        bookingMessage.textContent = message;
        bookingMessage.className = `message ${type}`;
        bookingMessage.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                bookingMessage.style.display = 'none';
            }, 5000);
        }
    };

    // Enter key support for search
    bookingIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchByIdBtn.click();
        }
    });

    searchEmailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchByEmailPhoneBtn.click();
        }
    });

    searchPhoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchByEmailPhoneBtn.click();
        }
    });
}); 