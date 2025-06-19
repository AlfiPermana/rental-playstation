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
    // Pastikan tombol ini memiliki ID 'confirmBookingBtn' di HTML Anda
    const confirmBookingBtn = document.getElementById('confirmBookingBtn'); 

    let selectedSlotTime = null; // Variabel untuk menyimpan waktu mulai slot yang dipilih

    // --- Definisi Fungsi Bantuan ---

    // Fungsi untuk mengupdate status (enabled/disabled) tombol Konfirmasi Booking
    const updateConfirmButtonStatus = () => {
        // Tombol aktif jika semua kondisi terpenuhi:
        // 1. PlayStation sudah dipilih (value tidak kosong)
        // 2. Tanggal booking sudah dipilih (value tidak kosong)
        // 3. Durasi sudah dipilih (value bukan NaN)
        // 4. Slot waktu sudah dipilih (selectedSlotTime tidak null)
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
                // *** PENTING: Bersihkan semua opsi yang ada (kecuali opsi placeholder) ***
                playstationSelect.innerHTML = '<option value="">-- Pilih PS --</option>'; 
                playstations.forEach(ps => {
                    const option = document.createElement('option');
                    option.value = ps.id; // Nilai opsi adalah ID PlayStation dari database
                    option.textContent = `${ps.name} (${ps.type})`; // Teks yang ditampilkan (misal: "PS4 Unit 1 (PS4)")
                    playstationSelect.appendChild(option);
                });
            } else {
                alert('Gagal memuat daftar PlayStation: ' + (playstations.message || 'Server error'));
            }
        } catch (error) {
            console.error('Error fetching PlayStations:', error);
            alert('Terjadi kesalahan saat memuat daftar PlayStation.');
        } finally {
            // Selalu panggil setelah PS dimuat (berhasil atau gagal)
            // Agar status tombol dievaluasi ulang
            updateConfirmButtonStatus();
        }
    };

    // Fungsi untuk memuat slot waktu yang tersedia berdasarkan pilihan PS dan tanggal
    const fetchAvailableSlots = async () => {
        const playstationId = playstationSelect.value;
        const bookingDate = bookingDateInput.value;
        const duration = parseInt(durationHoursSelect.value);

        // Reset slot yang dipilih dan nonaktifkan tombol konfirmasi saat input berubah
        selectedSlotTime = null;
        updateConfirmButtonStatus(); // Nonaktifkan tombol saat input berubah

        // Jika salah satu input penting belum terisi, tampilkan pesan default
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
                availableSlotsDiv.innerHTML = ''; // Bersihkan slot yang ada
                if (slots.length === 0) {
                    availableSlotsDiv.innerHTML = '<p>Tidak ada slot tersedia untuk tanggal ini.</p>';
                    return;
                }

                // Filter slot berdasarkan durasi yang dipilih
                const filteredSlots = slots.filter(slot => {
                    const startTimeHour = parseInt(slot.start.split(':')[0]);
                    const potentialEndTimeHour = startTimeHour + duration;
                    return potentialEndTimeHour <= 23; // Cek agar tidak melebihi jam tutup (23:00)
                });

                if (filteredSlots.length === 0) {
                    availableSlotsDiv.innerHTML = `<p>Tidak ada slot tersedia untuk durasi ${duration} jam pada tanggal ini.</p>`;
                    return;
                }

                filteredSlots.forEach(slot => {
                    const slotItem = document.createElement('div');
                    slotItem.classList.add('slot-item');
                    // Hitung dan tampilkan rentang waktu sesuai durasi yang dipilih
                    const endHour = parseInt(slot.start.split(':')[0]) + duration;
                    const displayEndTime = `${String(endHour).padStart(2, '0')}:${slot.start.split(':')[1]}`;
                    slotItem.textContent = `${slot.start.substring(0, 5)} - ${displayEndTime}`;

                    if (slot.available) {
                        slotItem.classList.add('available'); // Tambahkan kelas 'available' untuk slot yang bisa diklik
                        slotItem.dataset.startTime = slot.start; // Simpan waktu mulai di data attribute
                    }
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

    // Panggil fetchAvailableSlots setiap kali pilihan PlayStation, Tanggal, atau Durasi berubah
    playstationSelect.addEventListener('change', fetchAvailableSlots);
    bookingDateInput.addEventListener('change', fetchAvailableSlots);
    durationHoursSelect.addEventListener('change', fetchAvailableSlots);

    // Menangani klik pada slot waktu
    availableSlotsDiv.addEventListener('click', (e) => {
        // Hanya proses jika yang diklik adalah elemen dengan kelas 'available'
        if (e.target.classList.contains('available')) {
            // Hapus kelas 'selected' dari slot yang sebelumnya terpilih (jika ada)
            const previouslySelected = document.querySelector('.slot-item.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }
            // Tambahkan kelas 'selected' ke slot yang baru diklik
            e.target.classList.add('selected');
            // Simpan waktu mulai slot yang dipilih
            selectedSlotTime = e.target.dataset.startTime;
            // Update status tombol Konfirmasi Booking
            updateConfirmButtonStatus();
        }
    });

    // --- Hanya Satu Definisi Event Listener untuk Form Submit ---
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah reload halaman
        console.log('Form submitted!'); // Pesan log untuk debugging

        const playstationId = playstationSelect.value;
        const bookingDate = bookingDateInput.value;
        const durationHours = parseInt(durationHoursSelect.value);

        // Validasi terakhir sebelum mengirim data ke backend
        if (!playstationId || !bookingDate || !selectedSlotTime || isNaN(durationHours)) {
            bookingMessage.textContent = 'Harap lengkapi semua pilihan dan pilih slot waktu.';
            bookingMessage.classList.add('error');
            return; // Hentikan proses submit
        }

        // Nonaktifkan tombol Konfirmasi Booking saat proses submit dimulai
        // Untuk mencegah double click dan pengiriman berulang
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
                
                // *** PENTING: Penanganan Redirect ke halaman pembayaran Midtrans ***
                if (data.redirectUrl) {
                    alert('Booking berhasil dibuat. Anda akan diarahkan ke halaman pembayaran.');
                    window.location.href = data.redirectUrl; // Arahkan ke URL pembayaran dari Midtrans
                    // Catatan: Setelah redirect, form tidak perlu di-reset di sini
                    // karena user akan meninggalkan halaman ini.
                } else {
                    // Jika tidak ada redirectUrl (misal skenario non-pembayaran online atau error lain di backend)
                    // Atau jika Anda ingin tetap di halaman ini setelah booking sukses tanpa pembayaran online.
                    alert('Booking berhasil dibuat. Silakan tunggu konfirmasi pembayaran.');
                    // Bersihkan form
                    bookingForm.reset();
                    availableSlotsDiv.innerHTML = '<p>Pilih PS, tanggal, dan durasi untuk melihat slot.</p>';
                    selectedSlotTime = null; 
                    updateConfirmButtonStatus(); // Nonaktifkan tombol setelah reset form
                    // Opsional: Redirect ke halaman riwayat booking jika tidak ada pembayaran online
                    // setTimeout(() => window.location.href = 'history.html', 2000);
                }

            } else {
                bookingMessage.textContent = data.message || 'Booking gagal. Silakan coba lagi.';
                bookingMessage.classList.add('error');
                confirmBookingBtn.disabled = false; // Aktifkan kembali tombol jika ada kegagalan
            }
        } catch (error) {
            console.error('Error booking PlayStation:', error);
            bookingMessage.textContent = 'Terjadi kesalahan saat booking. Silakan coba lagi nanti.';
            bookingMessage.classList.add('error');
            confirmBookingBtn.disabled = false; // Aktifkan kembali tombol jika ada error jaringan/lainnya
        }
    });

    // --- Inisialisasi Saat Halaman Dimuat ---

    // Set tanggal minimum untuk input tanggal menjadi hari ini
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0 (0-11)
    const day = String(today.getDate()).padStart(2, '0');
    bookingDateInput.min = `${year}-${month}-${day}`;

    // Muat daftar PlayStation saat halaman pertama dimuat
    fetchPlaystations();

    // Atur status awal tombol Konfirmasi Booking (harus nonaktif di awal)
    updateConfirmButtonStatus();

    // --- Fungsionalitas Logout ---

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token'); // Hapus token
            localStorage.removeItem('userRole'); // Hapus peran
            window.location.href = '/login.html'; // Arahkan ke halaman login
        });
    }
}); // Penutup DOMContentLoaded yang benar