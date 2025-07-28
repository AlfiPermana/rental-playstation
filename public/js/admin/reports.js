// public/js/admin/reports.js
document.addEventListener('DOMContentLoaded', async () => {
    const checkAdminAccess = () => {
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
            alert('Akses ditolak. Anda bukan admin.');
            window.location.href = '/login.html';
        }
    };
    checkAdminAccess();

    const totalRevenueElem = document.getElementById('totalRevenue');
    // <<< PENTING: Hapus referensi ke elemen yang tidak ada di HTML >>>
    const totalBookingsCountElem = document.getElementById('totalBookingsCount'); 
    const pendingBookingsCountElem = document.getElementById('pendingBookingsCount'); 
    const totalUsersCountElem = document.getElementById('totalUsersCount');       
    // --- Baris di bawah ini dihapus karena elemennya tidak ada di HTML ---
    // const mostPopularPsElem = document.getElementById('mostPopularPs'); 
    // const busiestTimeElem = document.getElementById('busiestTime');     
    // --- Akhir baris yang dihapus ---
    const reportMessage = document.getElementById('reportMessage');

    // --- Tambahan: Elemen untuk rekap ringkasan bisnis ---
    const todayBookingsElem = document.getElementById('todayBookings');
    const todayRevenueElem = document.getElementById('todayRevenue');
    const weekBookingsElem = document.getElementById('weekBookings');
    const weekRevenueElem = document.getElementById('weekRevenue');
    const monthBookingsElem = document.getElementById('monthBookings');
    const monthRevenueElem = document.getElementById('monthRevenue');
    const totalBookingsSummaryElem = document.getElementById('totalBookings');
    const totalRevenueSummaryElem = document.getElementById('totalRevenueSummary');
    
    // Date range elements
    const todayRangeElem = document.getElementById('todayRange');
    const weekRangeElem = document.getElementById('weekRange');
    const monthRangeElem = document.getElementById('monthRange');
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                // Update elemen dengan data yang sesuai
                totalRevenueElem.textContent = `Rp ${Number(data.totalRevenue).toLocaleString('id-ID')}`;
                totalBookingsCountElem.textContent = data.totalBookingsCount; 
                pendingBookingsCountElem.textContent = data.pendingBookingsCount; 
                totalUsersCountElem.textContent = data.totalUsersCount;     

                // <<< HAPUS BARIS INI KARENA ELEMENNYA TIDAK ADA DI HTML >>>
                // --- Baris di bawah ini dihapus karena elemennya tidak ada di HTML ---
                // mostPopularPsElem.textContent = 'PS4 Pro (Contoh)'; 
                // busiestTimeElem.textContent = '19:00 - 22:00 (Contoh)'; 
                // --- Akhir baris yang dihapus ---
                
            } else {
                reportMessage.textContent = 'Gagal memuat laporan: ' + (data.message || 'Server error');
                reportMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            reportMessage.textContent = 'Terjadi kesalahan saat memuat laporan.';
            reportMessage.classList.add('error');
        }
    };

    // Helper function to format date range
    const formatDateRange = (type) => {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        
        switch(type) {
            case 'today':
                return now.toLocaleDateString('id-ID', options);
            case 'week':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            case 'month':
                return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            default:
                return '';
        }
    };

    // Helper function to add loading state
    const setLoadingState = (isLoading) => {
        const cards = document.querySelectorAll('.summary-card');
        cards.forEach(card => {
            if (isLoading) {
                card.classList.add('loading');
            } else {
                card.classList.remove('loading');
            }
        });
        
        if (refreshBtn) {
            refreshBtn.disabled = isLoading;
            refreshBtn.innerHTML = isLoading ? '<span>⏳</span> Loading...' : '<span>🔄</span> Refresh Data';
        }
    };

    // Fetch business summary (rekap harian, mingguan, bulanan, total)
    const fetchBusinessSummary = async () => {
        try {
            setLoadingState(true);
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/reports/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const summary = await response.json();
            
            if (response.ok) {
                // Format angka Indonesia
                const formatRupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');
                
                // Update data
                todayBookingsElem.textContent = summary.today.bookings;
                todayRevenueElem.textContent = formatRupiah(summary.today.revenue);
                weekBookingsElem.textContent = summary.thisWeek.bookings;
                weekRevenueElem.textContent = formatRupiah(summary.thisWeek.revenue);
                monthBookingsElem.textContent = summary.thisMonth.bookings;
                monthRevenueElem.textContent = formatRupiah(summary.thisMonth.revenue);
                totalBookingsSummaryElem.textContent = summary.total.bookings;
                totalRevenueSummaryElem.textContent = formatRupiah(summary.total.revenue);
                
                // Update date ranges
                todayRangeElem.textContent = formatDateRange('today');
                weekRangeElem.textContent = formatDateRange('week');
                monthRangeElem.textContent = formatDateRange('month');
                
                console.log('Business summary loaded successfully:', summary);
            } else {
                // Handle error
                todayBookingsElem.textContent = weekBookingsElem.textContent = monthBookingsElem.textContent = totalBookingsSummaryElem.textContent = '-';
                todayRevenueElem.textContent = weekRevenueElem.textContent = monthRevenueElem.textContent = totalRevenueSummaryElem.textContent = 'Rp 0';
                todayRangeElem.textContent = weekRangeElem.textContent = monthRangeElem.textContent = 'Error loading data';
                
                console.error('Failed to load business summary:', summary.message);
            }
        } catch (error) {
            console.error('Error fetching business summary:', error);
            
            // Set error state
            todayBookingsElem.textContent = weekBookingsElem.textContent = monthBookingsElem.textContent = totalBookingsSummaryElem.textContent = '-';
            todayRevenueElem.textContent = weekRevenueElem.textContent = monthRevenueElem.textContent = totalRevenueSummaryElem.textContent = 'Rp 0';
            todayRangeElem.textContent = weekRangeElem.textContent = monthRangeElem.textContent = 'Connection error';
        } finally {
            setLoadingState(false);
        }
    };

    // Add refresh button event listener
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchBusinessSummary();
            fetchReports(); // Also refresh the main reports
        });
    }

    fetchReports();
    fetchBusinessSummary();

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