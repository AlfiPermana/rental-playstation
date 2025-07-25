// public/js/user/booking.js
document.addEventListener('DOMContentLoaded', async () => {
    // Fungsi untuk memeriksa status autentikasi pengguna
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'user') {
            alert('Anda harus login sebagai pengguna untuk mengakses halaman ini.');
            // Mengarahkan ke halaman login utama
            window.location.href = '/login.html';
        }
    };
    checkAuth(); // Panggil saat halaman dimuat

    // Ambil referensi elemen-elemen HTML
    const playstationSelect = document.getElementById('playstationSelect');
    const bookingDateInput = document.getElementById('bookingDate');
    const durationHoursSelect = document.getElementById('durationHours');
    const availableSlotsDiv = document.getElementById('availableSlots');
    const bookingForm = document.getElementById('bookingForm');
    const bookingMessage = document.getElementById('bookingMessage');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn'); 

    let selectedSlotTime = null; // Variabel untuk menyimpan waktu mulai slot yang dipilih

    // --- Definisi Fungsi Bantuan ---

    // Fungsi untuk mengupdate status (enabled/disabled) tombol Konfirmasi Booking
    const updateConfirmButtonStatus = () => {
        if (playstationSelect.value && bookingDateInput.value && !isNaN(parseInt(durationHoursSelect.value)) && selectedSlotTime) {
            confirmBookingBtn.disabled = false; // Aktifkan tombol
        } else {
            confirmBookingBtn.disabled = true; // Nonaktifkan tombol
        }
    };

    // Fungsi untuk memuat daftar PlayStation yang tersedia dari backend
    const fetchPlaystations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/playstations-for-booking', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const playstations = await response.json();

            if (response.ok) {
                playstationSelect.innerHTML = '<option value="">-- Pilih PS --</option>'; 
                playstations.forEach(ps => {
                    const option = document.createElement('option');
                    option.value = ps.id; 
                    option.textContent = `${ps.name} (${ps.type})`; 
                    playstationSelect.appendChild(option);
                });
            } else {
                alert('Gagal memuat daftar PlayStation: ' + (playstations.message || 'Server error'));
            }
        } catch (error) {
            console.error('Error fetching PlayStations:', error);
            alert('Terjadi kesalahan saat memuat daftar PlayStation.');
        } finally {
            updateConfirmButtonStatus(); 
        }
    };

    // Fungsi untuk memuat slot waktu yang tersedia berdasarkan pilihan PS dan tanggal
    const fetchAvailableSlots = async () => {
        const playstationId = playstationSelect.value;
        const bookingDate = bookingDateInput.value;
        const duration = parseInt(durationHoursSelect.value);

        selectedSlotTime = null;
        updateConfirmButtonStatus(); 

        if (!playstationId || !bookingDate || isNaN(duration)) {
            availableSlotsDiv.innerHTML = '<p>Pilih PS, tanggal, dan durasi untuk melihat slot.</p>';
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/user/available-slots?playstationId=${playstationId}&date=${bookingDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const slots = await response.json();

            if (response.ok) {
                availableSlotsDiv.innerHTML = ''; 
                if (slots.length === 0) {
                    availableSlotsDiv.innerHTML = '<p>Tidak ada slot tersedia untuk tanggal ini.</p>';
                    return;
                }

                // Filter slot berdasarkan durasi yang dipilih
                // CATATAN: Filter utama waktu yang sudah lewat HARUS di backend (Booking.js)
                const filteredSlots = slots.filter(slot => {
                    const startTimeHour = parseInt(slot.time.split(':')[0]); // Menggunakan slot.time dari backend
                    const potentialEndTimeHour = startTimeHour + duration;
                    return potentialEndTimeHour <= 23; 
                });

                if (filteredSlots.length === 0) {
                    availableSlotsDiv.innerHTML = `<p>Tidak ada slot tersedia untuk durasi ${duration} jam pada tanggal ini.</p>`;
                    return;
                }

                filteredSlots.forEach(slot => {
                    const slotItem = document.createElement('div');
                    slotItem.classList.add('slot-item');
                    const endHour = parseInt(slot.time.split(':')[0]) + duration;
                    const displayEndTime = `${String(endHour).padStart(2, '0')}:${slot.time.split(':')[1]}`;
                    slotItem.textContent = `${slot.time} - ${displayEndTime.substring(0, 5)}`; // Menggunakan slot.time untuk tampilan
                    // Tambahan: Tambahkan data-end-time jika ingin digunakan untuk validasi lebih lanjut
                    slotItem.dataset.startTime = slot.time; 
                    slotItem.classList.add('available'); // Semua slot dari backend dianggap available kecuali ada logic lain
                    
                    availableSlotsDiv.appendChild(slotItem);
                });
            } else {
                availableSlotsDiv.innerHTML = `<p>Gagal memuat slot: ${slots.message || 'Server error'}</p>`;
            }
        } catch (error) {
            console.error('Error fetching available slots:', error);
            availableSlotsDiv.innerHTML = '<p>Terjadi kesalahan saat memuat slot waktu.</p>';
        }
    };

    // --- Event Listeners ---

    playstationSelect.addEventListener('change', fetchAvailableSlots);
    bookingDateInput.addEventListener('change', fetchAvailableSlots);
    durationHoursSelect.addEventListener('change', fetchAvailableSlots);

    availableSlotsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('available')) {
            const previouslySelected = document.querySelector('.slot-item.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }
            e.target.classList.add('selected');
            selectedSlotTime = e.target.dataset.startTime;
            updateConfirmButtonStatus();
        }
    });

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        console.log('Form submitted!'); 

        const playstationId = playstationSelect.value;
        const bookingDate = bookingDateInput.value;
        const durationHours = parseInt(durationHoursSelect.value);

        if (!playstationId || !bookingDate || !selectedSlotTime || isNaN(durationHours)) {
            bookingMessage.textContent = 'Harap lengkapi semua pilihan dan pilih slot waktu.';
            bookingMessage.classList.add('error');
            return; 
        }

        confirmBookingBtn.disabled = true;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    playstationId,
                    bookingDate,
                    startTime: selectedSlotTime,
                    durationHours
                })
            });

            const data = await response.json();

            if (response.ok) {
                bookingMessage.textContent = data.message;
                bookingMessage.classList.add('success');
                
                if (data.redirectUrl) {
                    alert('Booking berhasil dibuat. Anda akan diarahkan ke halaman pembayaran.');
                    window.location.href = data.redirectUrl; 
                } else {
                    alert('Booking berhasil dibuat. Silakan tunggu konfirmasi pembayaran.');
                    bookingForm.reset();
                    availableSlotsDiv.innerHTML = '<p>Pilih PS, tanggal, dan durasi untuk melihat slot.</p>';
                    selectedSlotTime = null; 
                    updateConfirmButtonStatus();
                }

            } else {
                bookingMessage.textContent = data.message || 'Booking gagal. Silakan coba lagi.';
                bookingMessage.classList.add('error');
                confirmBookingBtn.disabled = false; 
            }
        } catch (error) {
            console.error('Error booking PlayStation:', error);
            bookingMessage.textContent = 'Terjadi kesalahan saat booking. Silakan coba lagi nanti.';
            bookingMessage.classList.add('error');
            confirmBookingBtn.disabled = false; 
        }
    });

    // --- Inisialisasi Saat Halaman Dimuat ---

    // Set tanggal minimum untuk input tanggal menjadi hari ini
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    bookingDateInput.min = `${year}-${month}-${day}`;
    // Set nilai default tanggal ke hari ini agar fetchAvailableSlots bisa langsung dipicu
    // Ini penting agar slot muncul saat pertama kali halaman dimuat tanpa perlu user interaksi
    bookingDateInput.value = `${year}-${month}-${day}`; 

    // Muat daftar PlayStation saat halaman pertama dimuat
    fetchPlaystations();
    // Memanggil fetchAvailableSlots setelah PS dimuat dan tanggal default diatur
    // Ini memastikan slot muncul saat halaman dimuat
    playstationSelect.addEventListener('change', fetchAvailableSlots); // Pastikan ini tetap ada
    // Panggil fetchAvailableSlots secara manual jika playstationSelect sudah ada nilai default
    // atau setelah fetchPlaystations selesai dan playstationSelect sudah terisi
    // Agar slot tampil segera setelah PS list dimuat.
    // Tambahkan penundaan singkat atau panggil setelah fetchPlaystations() selesai
    // untuk memastikan playstationSelect sudah ada isinya.

    // Panggil fetchAvailableSlots secara eksplisit setelah DOMContentLoaded
    // Ini akan memicu pengambilan slot jika ada nilai default untuk playstationSelect & bookingDateInput
    // (misalnya setelah fetchPlaystations() mengisi select PS, dan bookingDateInput sudah ada value)
    setTimeout(fetchAvailableSlots, 100); // Panggil setelah sedikit tunda untuk DOM/data siap
    
    // Atur status awal tombol Konfirmasi Booking (harus nonaktif di awal)
    updateConfirmButtonStatus(); 

    // --- Fungsionalitas Logout ---

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