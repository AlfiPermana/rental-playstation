// public/js/user/history.js
document.addEventListener('DOMContentLoaded', async () => {
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'user') {
            alert('Anda harus login sebagai pengguna untuk mengakses halaman ini.');
            window.location.href = '/login.html';
        }
    };
    checkAuth();

    const historyTableBody = document.querySelector('#historyTable tbody');
    const noHistoryMessage = document.getElementById('noHistoryMessage');
    const historyMessage = document.getElementById('historyMessage');

    const fetchBookingHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/bookings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const bookings = await response.json();

            if (response.ok) {
                historyTableBody.innerHTML = ''; // Clear existing rows
                if (bookings.length === 0) {
                    noHistoryMessage.style.display = 'block';
                    return;
                }
                noHistoryMessage.style.display = 'none'; // Hide if there's data

                bookings.forEach(booking => {
                    const row = historyTableBody.insertRow();
                    const bookingDate = new Date(booking.booking_date).toLocaleDateString('id-ID');
                    const startTime = booking.start_time.substring(0, 5);
                    const endTime = booking.end_time.substring(0, 5);

                    row.innerHTML = `
                        <td>${booking.id}</td>
                        <td>${booking.playstation_name} (${booking.playstation_type})</td>
                        <td>${bookingDate}</td>
                        <td>${startTime} - ${endTime}</td>
                        <td>${booking.duration_hours} jam</td>
                        <td><span class="status-tag ${booking.status}">${booking.status.toUpperCase()}</span></td>
                        <td class="action-btns">
                            ${(booking.status === 'pending' || booking.status === 'confirmed') ? `<button class="cancel-btn" data-id="${booking.id}">Batalkan</button>` : ''}
                        </td>
                    `;
                });
            } else {
                historyMessage.textContent = 'Gagal memuat riwayat booking: ' + (bookings.message || 'Server error');
                historyMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error fetching booking history:', error);
            historyMessage.textContent = 'Terjadi kesalahan saat memuat riwayat booking.';
            historyMessage.classList.add('error');
        }
    };

    historyTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('cancel-btn')) {
            const bookingId = e.target.dataset.id;
            if (confirm('Apakah Anda yakin ingin membatalkan booking ini?')) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/admin/bookings/${bookingId}/status`, { // Re-use admin endpoint for status update
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: 'cancelled' })
                    });
                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message);
                        fetchBookingHistory(); // Refresh history
                    } else {
                        alert(data.message || 'Gagal membatalkan booking.');
                    }
                } catch (error) {
                    console.error('Error canceling booking:', error);
                    alert('Terjadi kesalahan saat membatalkan booking.');
                }
            }
        }
    });

    fetchBookingHistory(); // Load history on page load

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