// public/js/login.js (Versi Awal, kembali ke ini)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm'); // Kembali mencari 'loginForm'
    const messageDiv = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            messageDiv.textContent = '';
            messageDiv.className = 'message';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message;
                    messageDiv.classList.add('success');
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userRole', data.role);

                    if (data.role === 'admin') {
                        window.location.href = '/admin/dashboard-admin.html';
                    } else {
                        window.location.href = '/user/dashboard.html';
                    }
                } else {
                    messageDiv.textContent = data.message || 'Login gagal. Silakan coba lagi.';
                    messageDiv.classList.add('error');
                }
            } catch (error) {
                console.error('Error during login:', error);
                messageDiv.textContent = 'Terjadi kesalahan. Silakan coba lagi nanti.';
                messageDiv.classList.add('error');
            }
        });
    }
});