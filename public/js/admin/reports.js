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

    fetchReports();

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