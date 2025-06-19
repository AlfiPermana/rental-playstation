// public/js/user/profile.js
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

    const profileForm = document.getElementById('profileForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const profileMessage = document.getElementById('profileMessage');

    const passwordForm = document.getElementById('passwordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const passwordMessage = document.getElementById('passwordMessage');

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const user = await response.json();

            if (response.ok) {
                usernameInput.value = user.username;
                emailInput.value = user.email;
            } else {
                profileMessage.textContent = 'Gagal memuat profil: ' + (user.message || 'Server error');
                profileMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            profileMessage.textContent = 'Terjadi kesalahan saat memuat profil.';
            profileMessage.classList.add('error');
        }
    };

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value;
        const email = emailInput.value;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, email })
            });

            const data = await response.json();

            if (response.ok) {
                profileMessage.textContent = data.message;
                profileMessage.classList.add('success');
            } else {
                profileMessage.textContent = data.message || 'Gagal update profil.';
                profileMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            profileMessage.textContent = 'Terjadi kesalahan saat update profil.';
            profileMessage.classList.add('error');
        }
    });

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        if (newPassword !== confirmNewPassword) {
            passwordMessage.textContent = 'Konfirmasi password baru tidak cocok.';
            passwordMessage.classList.add('error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                passwordMessage.textContent = data.message;
                passwordMessage.classList.add('success');
                passwordForm.reset();
            } else {
                passwordMessage.textContent = data.message || 'Gagal mengubah password.';
                passwordMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            passwordMessage.textContent = 'Terjadi kesalahan saat mengubah password.';
            passwordMessage.classList.add('error');
        }
    });

    fetchUserProfile(); // Load user profile on page load

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