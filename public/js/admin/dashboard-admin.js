// public/js/admin/dashboard-admin.js
document.addEventListener('DOMContentLoaded', async () => {
    // Fungsi untuk memastikan user adalah admin
    const checkAdminAccess = () => {
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
            alert('Akses ditolak. Anda bukan admin.');
            window.location.href = '/login.html'; // Redirect ke halaman login
        }
    };
    checkAdminAccess();

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                document.getElementById('totalPs').textContent = data.totalPlaystations;
                document.getElementById('availablePs').textContent = data.availablePlaystations;
                document.getElementById('totalBookings').textContent = data.totalBookings;
                document.getElementById('pendingBookings').textContent = data.pendingBookings;
                document.getElementById('totalUsers').textContent = data.totalUsers;
            } else {
                console.error('Failed to fetch dashboard stats:', data.message);
                alert('Gagal memuat data dashboard: ' + (data.message || 'Server error'));
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            alert('Terjadi kesalahan saat memuat data dashboard.');
        }
    };

    const fetchRecentBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/bookings', { // Mengambil semua booking, bisa difilter di backend
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                const recentBookingsDiv = document.getElementById('recentBookings');
                recentBookingsDiv.innerHTML = ''; // Bersihkan konten sebelumnya

                if (data.length > 0) {
                    // Ambil 5 booking terbaru
                    const latestBookings = data.slice(0, 5);
                    latestBookings.forEach(booking => {
                        const bookingItem = document.createElement('div');
                        bookingItem.classList.add('booking-item');
                        bookingItem.innerHTML = `
                            <span>${new Date(booking.booking_date).toLocaleDateString()} - ${booking.start_time} (${booking.duration_hours} jam)</span>
                            <span>PS: ${booking.playstation_name} (${booking.playstation_type}) by ${booking.username}</span>
                            <span class="status-tag ${booking.status}">${booking.status.toUpperCase()}</span>
                        `;
                        recentBookingsDiv.appendChild(bookingItem);
                    });
                } else {
                    recentBookingsDiv.innerHTML = '<p>Tidak ada aktivitas booking terbaru.</p>';
                }
            } else {
                console.error('Failed to fetch recent bookings:', data.message);
                // Tampilkan pesan error ke user jika perlu
            }
        } catch (error) {
            console.error('Error fetching recent bookings:', error);
            // Tampilkan pesan error ke user jika perlu
        }
    };

    fetchDashboardStats();
    fetchRecentBookings();

    // Logout functionality (from main.js or duplicated here)
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