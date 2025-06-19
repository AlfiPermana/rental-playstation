// public/js/admin/manage-users.js
document.addEventListener('DOMContentLoaded', async () => {
    const checkAdminAccess = () => {
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
            alert('Akses ditolak. Anda bukan admin.');
            window.location.href = '/login.html';
        }
    };
    checkAdminAccess();

    const usersTableBody = document.querySelector('#usersTable tbody');
    const userMessage = document.getElementById('userMessage');

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await response.json();

            if (response.ok) {
                usersTableBody.innerHTML = '';
                if (users.length === 0) {
                    usersTableBody.innerHTML = '<tr><td colspan="6">Tidak ada data user yang ditemukan.</td></tr>';
                    return;
                }
                users.forEach(user => {
                    const row = usersTableBody.insertRow();
                    row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                        <td class="action-btns">
                            ${user.role !== 'admin' ? `<button class="delete-btn" data-id="${user.id}">Hapus</button>` : ''}
                        </td>
                    `;
                });
            } else {
                userMessage.textContent = 'Gagal memuat user: ' + (users.message || 'Server error');
                userMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            userMessage.textContent = 'Terjadi kesalahan saat memuat user.';
            userMessage.classList.add('error');
        }
    };

    usersTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('Apakah Anda yakin ingin menghapus user ini? Semua booking terkait juga akan terhapus.')) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/admin/users/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message);
                        fetchUsers(); // Refresh list
                    } else {
                        alert(data.message || 'Gagal menghapus user.');
                    }
                } catch (error) {
                    console.error('Error deleting user:', error);
                    alert('Terjadi kesalahan saat menghapus user.');
                }
            }
        }
    });

    fetchUsers(); // Load users on page load

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