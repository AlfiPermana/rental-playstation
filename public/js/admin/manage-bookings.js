// public/js/admin/manage-bookings.js
document.addEventListener('DOMContentLoaded', async () => {
    const checkAdminAccess = () => {
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
            alert('Akses ditolak. Anda bukan admin.');
            window.location.href = '/login.html';
        }
    };
    checkAdminAccess();

    const bookingsTableBody = document.querySelector('#bookingsTable tbody');
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    const bookingMessage = document.getElementById('bookingMessage');
    const noBookingsMessage = document.getElementById('noBookingsMessage');

    const fetchBookings = async (filterStatus = 'all') => {
        try {
            const token = localStorage.getItem('token');
            const url = `/api/admin/bookings?status=${filterStatus}`; // Selalu gunakan filter status
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const bookings = await response.json();

            if (response.ok) {
                bookingsTableBody.innerHTML = ''; // Clear existing rows
                if (bookings.length === 0) {
                    noBookingsMessage.style.display = 'block';
                    return;
                }
                noBookingsMessage.style.display = 'none';

                bookings.forEach(booking => {
                    const row = bookingsTableBody.insertRow();
                    const bookingDate = new Date(booking.booking_date).toLocaleDateString('id-ID');
                    const startTime = booking.start_time.substring(0, 5);
                    const endTime = booking.end_time.substring(0, 5);

                    // Tentukan konten link bukti pembayaran
                    const proofHtml = booking.proof_of_payment_url
                        ? `<a href="${booking.proof_of_payment_url}" target="_blank" class="proof-link">Lihat Bukti</a>`
                        : `<span class="proof-link none">Tidak Ada</span>`;
                    
                    row.innerHTML = `
                        <td>${booking.id}</td>
                        <td>${booking.username}</td>
                        <td>${booking.playstation_name} (${booking.playstation_type})</td>
                        <td>${bookingDate} ${startTime} - ${endTime}</td>
                        <td>${booking.duration_hours} jam</td>
                        <td>Rp ${Number(booking.amount).toLocaleString('id-ID')}</td>
                        <td><span class="status-tag ${booking.status}">${booking.status.toUpperCase()}</span></td>
                        <td><span class="status-tag ${booking.payment_status}">${booking.payment_status.toUpperCase()}</span></td>
                        <td>${proofHtml}</td>
                        <td class="action-btns">
                            ${(booking.payment_status === 'pending' || booking.payment_status === 'uploaded') && booking.proof_of_payment_url ? `<button class="confirm-payment-btn" data-id="${booking.id}">Konfirmasi Bayar</button>` : ''}
                            ${(booking.payment_status === 'pending' || booking.payment_status === 'uploaded') && booking.proof_of_payment_url ? `<button class="reject-payment-btn" data-id="${booking.id}">Tolak Bayar</button>` : ''}
                            
                            ${booking.status === 'confirmed' ? `<button class="complete-booking-btn" data-id="${booking.id}">Selesaikan Booking</button>` : ''}
                            ${(booking.status === 'pending' || booking.status === 'confirmed') && booking.payment_status !== 'failed' && booking.payment_status !== 'cancelled' ? `<button class="cancel-booking-btn" data-id="${booking.id}">Batalkan Booking</button>` : ''}
                        </td>
                    `;
                });
            } else {
                bookingMessage.textContent = 'Gagal memuat booking: ' + (bookings.message || 'Server error');
                bookingMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            bookingMessage.textContent = 'Terjadi kesalahan saat memuat booking.';
            bookingMessage.classList.add('error');
        }
    };

    const updateBookingOrPaymentStatus = async (id, newStatus, actionType) => { // actionType: 'booking-status', 'payment-confirm', 'payment-reject'
        try {
            const token = localStorage.getItem('token');
            let url;
            let successMessage;
            let bodyData = {};

            if (actionType === 'payment-confirm') {
                url = `/api/admin/bookings/${id}/confirm-payment`;
                successMessage = 'Pembayaran berhasil dikonfirmasi!';
            } else if (actionType === 'payment-reject') {
                url = `/api/admin/bookings/${id}/reject-payment`;
                successMessage = 'Pembayaran ditolak dan booking dibatalkan.';
            } else if (actionType === 'booking-status') { // Untuk status booking (confirmed/cancelled/completed)
                url = `/api/admin/bookings/${id}/status`;
                successMessage = `Status booking berhasil diubah menjadi ${newStatus}.`;
                bodyData.status = newStatus; // Kirim status dalam body
            } else {
                alert('Tipe aksi tidak valid.');
                return;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData) // Kirim body hanya jika ada
            });
            const data = await response.json();

            if (response.ok) {
                alert(data.message || successMessage);
                fetchBookings(bookingStatusFilter.value); // Refresh with current filter
            } else {
                alert(data.message || `Gagal mengubah status.`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Terjadi kesalahan saat mengubah status.');
        }
    };

    // Event listener untuk filter status
    bookingStatusFilter.addEventListener('change', (e) => {
        fetchBookings(e.target.value);
    });

    // Event listener untuk tombol-tombol di tabel booking (delegation)
    bookingsTableBody.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('confirm-payment-btn')) {
            if (confirm('Konfirmasi pembayaran ini? Ini akan mengubah status booking menjadi "confirmed" dan pembayaran menjadi "paid".')) {
                await updateBookingOrPaymentStatus(id, 'paid', 'payment-confirm');
            }
        } else if (e.target.classList.contains('reject-payment-btn')) {
            if (confirm('Tolak pembayaran ini? Ini akan mengubah status booking menjadi "cancelled" dan pembayaran menjadi "failed".')) {
                await updateBookingOrPaymentStatus(id, 'failed', 'payment-reject');
            }
        } else if (e.target.classList.contains('complete-booking-btn')) {
            if (confirm('Tandai booking ini sebagai selesai?')) {
                await updateBookingOrPaymentStatus(id, 'completed', 'booking-status');
            }
        } else if (e.target.classList.contains('cancel-booking-btn')) {
            if (confirm('Batalkan booking ini?')) {
                await updateBookingOrPaymentStatus(id, 'cancelled', 'booking-status');
            }
        }
    });

    fetchBookings(); // Load all bookings on page load

    // Logout functionality
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