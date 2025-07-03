document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    registerForm?.addEventListener('submit', handleRegister);

    async function handleRegister(e) {
        e.preventDefault();
        
        const formData = getFormData(e.target);
        resetMessage(messageDiv);

        if (!validatePasswords(formData.password, formData.confirmPassword, messageDiv)) {
            return;
        }

        try {
            const response = await registerUser(formData);
            handleResponse(response, messageDiv);
        } catch (error) {
            handleRegistrationError(error, messageDiv);
        }
    }

    function getFormData(form) {
        return {
            username: form.username.value,
            email: form.email.value,
            password: form.password.value,
            confirmPassword: form.confirmPassword.value
        };
    }

    function resetMessage(element) {
        element.textContent = '';
        element.className = 'message';
    }

    function validatePasswords(password, confirmPassword, messageElement) {
        if (password !== confirmPassword) {
            messageElement.textContent = 'Password dan konfirmasi password tidak cocok.';
            messageElement.classList.add('error');
            return false;
        }
        return true;
    }

    async function registerUser({ username, email, password }) {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        return {
            ok: response.ok,
            data: await response.json()
        };
    }

    function handleResponse({ ok, data }, messageElement) {
        if (ok) {
            showSuccess(messageElement, data.message);
            setTimeout(() => window.location.href = '/login', 2000);
        } else {
            showError(messageElement, data.message || 'Registrasi gagal. Silakan coba lagi.');
        }
    }

    function showSuccess(element, message) {
        element.textContent = message;
        element.classList.add('success');
    }

    function showError(element, message) {
        element.textContent = message;
        element.classList.add('error');
    }

    function handleRegistrationError(error, messageElement) {
        console.error('Registration error:', error);
        showError(messageElement, 'Terjadi kesalahan. Silakan coba lagi nanti.');
    }
});