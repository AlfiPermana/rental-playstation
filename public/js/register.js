// public/js/register.js
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Mencegah reload halaman

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            messageDiv.textContent = ''; // Bersihkan pesan sebelumnya
            messageDiv.className = 'message'; // Reset kelas

            if (password !== confirmPassword) {
                messageDiv.textContent = 'Password dan konfirmasi password tidak cocok.';
                messageDiv.classList.add('error');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message;
                    messageDiv.classList.add('success');
                    // Opsional: Redirect ke halaman login setelah beberapa detik
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    messageDiv.textContent = data.message || 'Registrasi gagal. Silakan coba lagi.';
                    messageDiv.classList.add('error');
                }
            } catch (error) {
                console.error('Error during registration:', error);
                messageDiv.textContent = 'Terjadi kesalahan. Silakan coba lagi nanti.';
                messageDiv.classList.add('error');
            }
        });
    }
});