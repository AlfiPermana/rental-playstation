// public/js/admin/manage-ps.js
document.addEventListener('DOMContentLoaded', async () => {
    // Basic access check (duplicate for every admin page for safety)
    const checkAdminAccess = () => {
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
            alert('Akses ditolak. Anda bukan admin.');
            window.location.href = '/login.html';
        }
    };
    checkAdminAccess();

    const addPsBtn = document.getElementById('addPsBtn');
    const psFormContainer = document.getElementById('psFormContainer');
    const psForm = document.getElementById('psForm');
    const formTitle = document.getElementById('formTitle');
    const psIdInput = document.getElementById('psId');
    const psNameInput = document.getElementById('psName');
    const psTypeInput = document.getElementById('psType');
    const psStatusInput = document.getElementById('psStatus');
    const psDescriptionInput = document.getElementById('psDescription');
    const cancelPsFormBtn = document.getElementById('cancelPsFormBtn');
    const formMessage = document.getElementById('formMessage');
    const psTableBody = document.querySelector('#psTable tbody');

    let isEditMode = false;

    const showForm = () => {
        psFormContainer.style.display = 'block';
        formMessage.textContent = '';
        formMessage.className = 'message';
    };

    const hideForm = () => {
        psFormContainer.style.display = 'none';
        psForm.reset();
        psIdInput.value = '';
        isEditMode = false;
        formTitle.textContent = 'Tambah';
        psStatusInput.value = 'available'; // Default for new PS
    };

    addPsBtn.addEventListener('click', () => {
        hideForm(); // Reset form if in edit mode
        showForm();
    });

    cancelPsFormBtn.addEventListener('click', hideForm);

    const fetchPlaystations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/playstations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const playstations = await response.json();

            if (response.ok) {
                psTableBody.innerHTML = ''; // Clear existing rows
                if (playstations.length === 0) {
                    psTableBody.innerHTML = '<tr><td colspan="5">Tidak ada PlayStation yang terdaftar.</td></tr>';
                    return;
                }
                playstations.forEach(ps => {
                    const row = psTableBody.insertRow();
                    row.innerHTML = `
                        <td>${ps.id}</td>
                        <td>${ps.name}</td>
                        <td>${ps.type}</td>
                        <td><span class="status-tag ${ps.status}">${ps.status.toUpperCase()}</span></td>
                        <td class="action-btns">
                            <button class="edit-btn" data-id="${ps.id}">Edit</button>
                            <button class="delete-btn" data-id="${ps.id}">Hapus</button>
                        </td>
                    `;
                });
            } else {
                formMessage.textContent = 'Gagal memuat PlayStation: ' + (playstations.message || 'Server error');
                formMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error fetching PlayStations:', error);
            formMessage.textContent = 'Terjadi kesalahan saat memuat PlayStation.';
            formMessage.classList.add('error');
        }
    };

    psForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = psIdInput.value;
        const name = psNameInput.value;
        const type = psTypeInput.value;
        const status = psStatusInput.value;
        const description = psDescriptionInput.value;

        const token = localStorage.getItem('token');
        let url = '/api/admin/playstations';
        let method = 'POST';

        if (isEditMode) {
            url = `/api/admin/playstations/${id}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, type, status, description })
            });

            const data = await response.json();

            if (response.ok) {
                formMessage.textContent = data.message;
                formMessage.classList.add('success');
                hideForm();
                fetchPlaystations(); // Refresh list
            } else {
                formMessage.textContent = data.message || 'Operasi gagal.';
                formMessage.classList.add('error');
            }
        } catch (error) {
            console.error('Error submitting PS form:', error);
            formMessage.textContent = 'Terjadi kesalahan saat menyimpan data PlayStation.';
            formMessage.classList.add('error');
        }
    });

    psTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            isEditMode = true;
            formTitle.textContent = 'Edit';
            showForm();

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/admin/playstations/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const ps = await response.json();

                if (response.ok && ps) {
                    psIdInput.value = ps.id;
                    psNameInput.value = ps.name;
                    psTypeInput.value = ps.type;
                    psStatusInput.value = ps.status;
                    psDescriptionInput.value = ps.description || '';
                } else {
                    formMessage.textContent = 'Gagal memuat data PlayStation untuk diedit.';
                    formMessage.classList.add('error');
                    hideForm();
                }
            } catch (error) {
                console.error('Error fetching PS for edit:', error);
                formMessage.textContent = 'Terjadi kesalahan saat memuat data PlayStation.';
                formMessage.classList.add('error');
                hideForm();
            }
        } else if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('Apakah Anda yakin ingin menghapus PlayStation ini?')) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/admin/playstations/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message);
                        fetchPlaystations(); // Refresh list
                    } else {
                        alert(data.message || 'Gagal menghapus PlayStation.');
                    }
                } catch (error) {
                    console.error('Error deleting PlayStation:', error);
                    alert('Terjadi kesalahan saat menghapus PlayStation.');
                }
            }
        }
    });

    fetchPlaystations(); // Load PS on page load

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