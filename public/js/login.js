document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    loginForm?.addEventListener('submit', handleLogin);

    async function handleLogin(e) {
        e.preventDefault();
        
        const { username, password } = e.target.elements;
        resetMessage();

        try {
            const { ok, data } = await authenticate(username.value, password.value);
            
            if (ok) {
                handleSuccess(data);
            } else {
                showError(data.message || 'Login gagal. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Terjadi kesalahan. Silakan coba lagi nanti.');
        }
    }

    async function authenticate(username, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        return { ok: response.ok, data };
    }

    function handleSuccess(data) {
        showSuccess(data.message);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        
        const redirectPath = data.role === 'admin' 
            ? '/admin/dashboard-admin.html' 
            : '/user/dashboard.html';
        
        window.location.href = redirectPath;
    }

    function resetMessage() {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }

    function showSuccess(msg) {
        messageDiv.textContent = msg;
        messageDiv.classList.add('success');
    }

    function showError(msg) {
        messageDiv.textContent = msg;
        messageDiv.classList.add('error');
    }
});