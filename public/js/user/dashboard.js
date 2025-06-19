// public/js/user/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    // Fungsi untuk memastikan user terautentikasi
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'user') {
            alert('Anda harus login sebagai pengguna untuk mengakses halaman ini.');
            window.location.href = '/login.html'; // Redirect ke halaman login
        }
    };
    checkAuth();

    const usernameDisplay = document.getElementById('usernameDisplay');
    const emailDisplay = document.getElementById('emailDisplay');
    
    const upcomingBookingsCount = document.getElementById('upcomingBookingsCount'); // New
    const availablePsCount = document.getElementById('availablePsCount'); // New

    const upcomingBookingsList = document.getElementById('upcomingBookingsList');
    const noBookingMessage = document.querySelector('.no-booking-message');
    
    const recentActivitiesList = document.getElementById('recentActivitiesList'); // New
    const noRecentActivityMessage = document.querySelector('.no-recent-activity-message'); // New

    const availablePsList = document.getElementById('availablePsList');
    const noPsMessage = document.querySelector('.no-ps-message');

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                usernameDisplay.textContent = data.user.username;
                emailDisplay.textContent = data.user.email;

                // Update Summary Cards
                upcomingBookingsCount.textContent = data.upcomingBookings.length;
                availablePsCount.textContent = data.availablePlaystations.length;

                // Tampilkan Upcoming Bookings
                upcomingBookingsList.innerHTML = '';
                if (data.upcomingBookings && data.upcomingBookings.length > 0) {
                    noBookingMessage.style.display = 'none';
                    data.upcomingBookings.forEach(booking => {
                        const bookingItem = document.createElement('div');
                        bookingItem.classList.add('booking-item', booking.status, booking.payment_status); // Tambahkan kelas status
                        bookingItem.innerHTML = `
                            <div>
                                <h3>${booking.playstation_name} (${booking.playstation_type})</h3>
                                <p>Tanggal: ${new Date(booking.booking_date).toLocaleDateString('id-ID')}</p>
                                <p>Waktu: ${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)} (${booking.duration_hours} jam)</p>
                            </div>
                            <div>
                                <p>Status Booking: <span class="status-tag ${booking.status}">${booking.status.toUpperCase()}</span></p>
                                <p>Status Bayar: <span class="status-tag ${booking.payment_status}">${booking.payment_status.toUpperCase()}</span></p>
                            </div>
                            ${booking.payment_status === 'pending' ? `<a href="payment.html?booking_id=${booking.id}&amount=${booking.amount}" class="btn primary-btn">Bayar Sekarang</a>` : ''}
                        `;
                        upcomingBookingsList.appendChild(bookingItem);
                    });
                } else {
                    noBookingMessage.style.display = 'block';
                }

                // Tampilkan Recent Activities (Aktivitas Terbaru)
                recentActivitiesList.innerHTML = '';
                if (data.recentActivities && data.recentActivities.length > 0) {
                    noRecentActivityMessage.style.display = 'none';
                    data.recentActivities.forEach(booking => {
                        const bookingItem = document.createElement('div');
                        bookingItem.classList.add('booking-item', booking.status, booking.payment_status);
                        bookingItem.innerHTML = `
                            <div>
                                <h3>${booking.playstation_name} (${booking.playstation_type})</h3>
                                <p>Tanggal: ${new Date(booking.booking_date).toLocaleDateString('id-ID')}, ${booking.start_time.substring(0, 5)}</p>
                            </div>
                            <div>
                                <p>Status Booking: <span class="status-tag ${booking.status}">${booking.status.toUpperCase()}</span></p>
                                <p>Status Bayar: <span class="status-tag ${booking.payment_status}">${booking.payment_status.toUpperCase()}</span></p>
                            </div>
                        `;
                        recentActivitiesList.appendChild(bookingItem);
                    });
                } else {
                    noRecentActivityMessage.style.display = 'block';
                }


                // Tampilkan Available PlayStations
                availablePsList.innerHTML = '';
                if (data.availablePlaystations && data.availablePlaystations.length > 0) {
                    noPsMessage.style.display = 'none';
                    data.availablePlaystations.forEach(ps => {
                        const psCard = document.createElement('div');
                        psCard.classList.add('ps-card');
                        psCard.innerHTML = `
                            <h3>${ps.name}</h3>
                            <p>Tipe: ${ps.type}</p>
                            <p>Harga: Rp ${Number(ps.price_per_hour).toLocaleString('id-ID')}/jam</p>
                        `;
                        availablePsList.appendChild(psCard);
                    });
                } else {
                    noPsMessage.style.display = 'block';
                }

            } else {
                alert('Gagal memuat data dashboard: ' + (data.message || 'Server error'));
                console.error('Failed to fetch dashboard data:', data.message);
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    window.location.href = '/login.html';
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            alert('Terjadi kesalahan saat memuat data dashboard.');
        }
    };

    fetchDashboardData();

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