document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Elemen Form
    const form = document.getElementById('adminBookingForm');
    const customerNameInput = document.getElementById('customerName');
    const playstationSelect = document.getElementById('playstationSelect');
    const bookingDateInput = document.getElementById('bookingDate');
    const durationHoursSelect = document.getElementById('durationHours');
    const availableSlotsDiv = document.getElementById('availableSlots');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const messageDiv = document.getElementById('message');

    let selectedSlotTime = null;

    // Fungsi untuk menampilkan pesan
    const showMessage = (message, type = 'error') => {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    };

    // Fungsi untuk update status tombol
    const updateConfirmButtonStatus = () => {
        const isFormComplete =
            customerNameInput.value &&
            playstationSelect.value &&
            bookingDateInput.value &&
            durationHoursSelect.value > 0 &&
            selectedSlotTime &&
            paymentMethodSelect.value;
        confirmBookingBtn.disabled = !isFormComplete;
    };

    // Memuat daftar PlayStation yang 'available'
    const fetchPlaystations = async () => {
        try {
            const response = await fetch('/api/admin/playstations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const playstations = await response.json();
            if (response.ok) {
                playstationSelect.innerHTML = '<option value="">-- Pilih PlayStation --</option>';
                playstations.forEach(ps => {
                    if (ps.status === 'available') { // Hanya tampilkan yang tersedia
                        const option = document.createElement('option');
                        option.value = ps.id;
                        option.textContent = `${ps.name} (${ps.type})`;
                        playstationSelect.appendChild(option);
                    }
                });
            } else {
                showMessage('Gagal memuat daftar PlayStation.');
            }
        } catch (error) {
            showMessage('Terjadi kesalahan saat memuat PlayStation.');
        }
    };

    // Memuat slot waktu yang tersedia (menggunakan endpoint guest yang tidak perlu auth)
    const fetchAvailableSlots = async () => {
        const playstationId = playstationSelect.value;
        const date = bookingDateInput.value;
        const duration = parseInt(durationHoursSelect.value);

        selectedSlotTime = null;
        updateConfirmButtonStatus();
        availableSlotsDiv.innerHTML = '<div class="slots-placeholder"><p>Memuat slot...</p></div>';

        if (!playstationId || !date || isNaN(duration) || duration < 1) {
            availableSlotsDiv.innerHTML = '<div class="slots-placeholder"><p>Pilih PS, tanggal, dan durasi.</p></div>';
            return;
        }

        try {
            const response = await fetch(`/api/guest/available-slots?playstationId=${playstationId}&date=${date}`);
            const slots = await response.json();

            availableSlotsDiv.innerHTML = '';
            if (slots.length === 0) {
                availableSlotsDiv.innerHTML = '<p>Tidak ada slot tersedia.</p>';
                return;
            }

            slots.forEach(slot => {
                const slotItem = document.createElement('div');
                slotItem.classList.add('slot-item', 'available');
                slotItem.textContent = slot.time.substring(0, 5);
                slotItem.dataset.startTime = slot.time;
                availableSlotsDiv.appendChild(slotItem);
            });
        } catch (error) {
            showMessage('Gagal memuat slot waktu.');
        }
    };

    // Event listener untuk memilih slot
    availableSlotsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('available')) {
            document.querySelectorAll('.slot-item.selected').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedSlotTime = e.target.dataset.startTime;
            updateConfirmButtonStatus();
        }
    });

    // Event listener untuk perubahan form
    [playstationSelect, bookingDateInput, durationHoursSelect, customerNameInput, paymentMethodSelect].forEach(el => {
        el.addEventListener('change', updateConfirmButtonStatus);
    });
    [playstationSelect, bookingDateInput, durationHoursSelect].forEach(el => {
        el.addEventListener('change', fetchAvailableSlots);
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        confirmBookingBtn.disabled = true;
        showMessage('Memproses booking...', 'info');

        const bookingData = {
            customerName: customerNameInput.value,
            playstationId: playstationSelect.value,
            bookingDate: bookingDateInput.value,
            startTime: selectedSlotTime,
            durationHours: parseInt(durationHoursSelect.value),
            paymentMethod: paymentMethodSelect.value,
        };

        try {
            const response = await fetch('/api/admin/bookings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, 'success');
                form.reset();
                availableSlotsDiv.innerHTML = '<div class="slots-placeholder"><p>Pilih PS, tanggal, dan durasi.</p></div>';
                selectedSlotTime = null;
                if (result.redirectUrl) {
                    alert(`Booking berhasil dibuat. Berikan link ini ke pelanggan untuk pembayaran: ${result.redirectUrl}`);
                }
                // Refresh slot setelah berhasil
                fetchAvailableSlots();
            } else {
                showMessage(result.message || 'Gagal membuat booking.');
            }
        } catch (error) {
            showMessage('Terjadi kesalahan jaringan.');
        } finally {
            confirmBookingBtn.disabled = false;
            updateConfirmButtonStatus();
        }
    });

    // Inisialisasi
    const today = new Date().toISOString().split('T')[0];
    bookingDateInput.min = today;
    bookingDateInput.value = today;
    fetchPlaystations();
});

