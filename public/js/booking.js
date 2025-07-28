document.addEventListener('DOMContentLoaded', async () => {
    // Ambil referensi elemen-elemen HTML
    const customerNameInput = document.getElementById('customerName');
    const customerEmailInput = document.getElementById('customerEmail');
    const customerPhoneInput = document.getElementById('customerPhone');
    const playstationSelect = document.getElementById('playstationSelect');
    const bookingDateInput = document.getElementById('bookingDate');
    const durationHoursSelect = document.getElementById('durationHours');
    const availableSlotsDiv = document.getElementById('availableSlots');
    const bookingForm = document.getElementById('bookingForm');
    const bookingMessage = document.getElementById('bookingMessage');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const priceDisplay = document.getElementById('priceDisplay');
    const totalPriceSpan = document.getElementById('totalPrice');
    
    // New elements for enhanced UI
    const basePriceSpan = document.getElementById('basePrice');
    const uniqueCodePreviewSpan = document.getElementById('uniqueCodePreview');
    const playstationInfoDiv = document.getElementById('playstationInfo');
    const psNameSpan = document.getElementById('psName');
    const psTypeSpan = document.getElementById('psType');
    const psPriceSpan = document.getElementById('psPrice');

    let selectedSlotTime = null;
    let selectedPlaystation = null;
    let playstationsData = [];

    // Fungsi untuk mengupdate status tombol Konfirmasi Booking
    const updateConfirmButtonStatus = () => {
        const isFormComplete = customerNameInput.value && 
                              customerEmailInput.value && 
                              customerPhoneInput.value &&
                              playstationSelect.value && 
                              bookingDateInput.value && 
                              !isNaN(parseInt(durationHoursSelect.value)) && 
                              selectedSlotTime;
        
        confirmBookingBtn.disabled = !isFormComplete;
    };

    // Fungsi untuk menampilkan informasi PlayStation
    const showPlaystationInfo = (playstation) => {
        if (playstation) {
            psNameSpan.textContent = playstation.name;
            psTypeSpan.textContent = playstation.type;
            psPriceSpan.textContent = `Rp ${Number(playstation.price_per_hour).toLocaleString('id-ID')}/jam`;
            playstationInfoDiv.style.display = 'block';
        } else {
            playstationInfoDiv.style.display = 'none';
        }
    };

    // Fungsi untuk generate preview kode unik
    const generateUniqueCodePreview = () => {
        const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return randomCode;
    };

    // Fungsi untuk memuat daftar PlayStation yang tersedia
    const fetchPlaystations = async () => {
        try {
            const response = await fetch('/api/guest/playstations');
            const playstations = await response.json();

            if (response.ok) {
                playstationsData = playstations; // Store data for later use
                playstationSelect.innerHTML = '<option value="">-- Pilih PlayStation --</option>'; 
                playstations.forEach(ps => {
                    const option = document.createElement('option');
                    option.value = ps.id; 
                    option.textContent = `${ps.name} (${ps.type}) - Rp. ${Number(ps.price_per_hour).toLocaleString('id-ID')}/jam`; 
                    option.dataset.price = ps.price_per_hour;
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

    // Fungsi untuk memuat slot waktu yang tersedia
    const fetchAvailableSlots = async () => {
        const playstationId = playstationSelect.value;
        const bookingDate = bookingDateInput.value;
        const duration = parseInt(durationHoursSelect.value);

        selectedSlotTime = null;
        updateConfirmButtonStatus(); 

        if (!playstationId || !bookingDate || isNaN(duration)) {
            availableSlotsDiv.innerHTML = '<p>Pilih PlayStation, tanggal, dan durasi untuk melihat slot.</p>';
            return;
        }

        try {
            const response = await fetch(`/api/guest/available-slots?playstationId=${playstationId}&date=${bookingDate}`);
            const slots = await response.json();

            if (response.ok) {
                availableSlotsDiv.innerHTML = ''; 
                if (slots.length === 0) {
                    availableSlotsDiv.innerHTML = '<p>Tidak ada slot tersedia untuk tanggal ini.</p>';
                    return;
                }

                // Filter slot berdasarkan durasi yang dipilih
                const filteredSlots = slots.filter(slot => {
                    const startTimeHour = parseInt(slot.time.split(':')[0]);
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
                    slotItem.textContent = `${slot.time} - ${displayEndTime.substring(0, 5)}`;
                    slotItem.dataset.startTime = slot.time; 
                    slotItem.classList.add('available');
                    
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

    // Fungsi untuk menghitung dan menampilkan total harga
    const calculateAndDisplayPrice = () => {
        if (selectedPlaystation && selectedSlotTime && durationHoursSelect.value) {
            const pricePerHour = parseFloat(selectedPlaystation.price_per_hour);
            const duration = parseInt(durationHoursSelect.value);
            const basePrice = pricePerHour * duration;
            
            // Generate preview kode unik
            const uniqueCode = generateUniqueCodePreview();
            const finalPrice = basePrice + parseInt(uniqueCode);
            
            // Update display elements
            basePriceSpan.textContent = `Rp ${basePrice.toLocaleString('id-ID')}`;
            uniqueCodePreviewSpan.textContent = uniqueCode;
            totalPriceSpan.textContent = `Rp ${finalPrice.toLocaleString('id-ID')}`;
            priceDisplay.style.display = 'block';
        } else {
            priceDisplay.style.display = 'none';
        }
    };

    // Event Listeners
    customerNameInput.addEventListener('input', updateConfirmButtonStatus);
    customerEmailInput.addEventListener('input', updateConfirmButtonStatus);
    customerPhoneInput.addEventListener('input', updateConfirmButtonStatus);

    playstationSelect.addEventListener('change', () => {
        const selectedOption = playstationSelect.options[playstationSelect.selectedIndex];
        if (selectedOption.value) {
            const selectedPsData = playstationsData.find(ps => ps.id == selectedOption.value);
            selectedPlaystation = {
                id: selectedOption.value,
                price_per_hour: parseFloat(selectedOption.dataset.price)
            };
            showPlaystationInfo(selectedPsData);
        } else {
            selectedPlaystation = null;
            showPlaystationInfo(null);
        }
        fetchAvailableSlots();
        calculateAndDisplayPrice();
        updateConfirmButtonStatus();
    });

    bookingDateInput.addEventListener('change', fetchAvailableSlots);
    durationHoursSelect.addEventListener('change', () => {
        fetchAvailableSlots();
        calculateAndDisplayPrice();
        updateConfirmButtonStatus();
    });

    availableSlotsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('available')) {
            const previouslySelected = document.querySelector('.slot-item.selected');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected');
            }
            e.target.classList.add('selected');
            selectedSlotTime = e.target.dataset.startTime;
            calculateAndDisplayPrice();
            updateConfirmButtonStatus();
        }
    });

    // Handle form submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        console.log('Form submitted!'); 

        const customerName = customerNameInput.value;
        const customerEmail = customerEmailInput.value;
        const customerPhone = customerPhoneInput.value;
        const playstationId = playstationSelect.value;
        const bookingDate = bookingDateInput.value;
        const durationHours = parseInt(durationHoursSelect.value);

        if (!customerName || !customerEmail || !customerPhone || !playstationId || !bookingDate || !selectedSlotTime || isNaN(durationHours)) {
            showMessage('Harap lengkapi semua data yang diperlukan.', 'error');
            return; 
        }

        confirmBookingBtn.disabled = true;
        showMessage('Memproses booking...', 'info');

        try {
            const response = await fetch('/api/guest/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playstationId,
                    bookingDate,
                    startTime: selectedSlotTime,
                    durationHours,
                    customerName,
                    customerEmail,
                    customerPhone
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, 'success');
                
                if (data.redirectUrl) {
                    alert(`Booking berhasil dibuat!\n\nBooking ID: ${data.bookingId}\nHarga Sewa: Rp. ${data.baseAmount.toLocaleString('id-ID')}\nKode Unik: ${data.uniqueCode}\nTotal Pembayaran: Rp. ${data.finalAmount.toLocaleString('id-ID')}\n\nAnda akan diarahkan ke halaman pembayaran.`);
                    window.location.href = data.redirectUrl; 
                } else {
                    alert(`Booking berhasil dibuat!\n\nBooking ID: ${data.bookingId}\nHarga Sewa: Rp. ${data.baseAmount.toLocaleString('id-ID')}\nKode Unik: ${data.uniqueCode}\nTotal Pembayaran: Rp. ${data.finalAmount.toLocaleString('id-ID')}\n\nSilakan tunggu konfirmasi pembayaran.`);
                    bookingForm.reset();
                    availableSlotsDiv.innerHTML = '<p>Pilih PlayStation, tanggal, dan durasi untuk melihat slot.</p>';
                    selectedSlotTime = null; 
                    priceDisplay.style.display = 'none';
                    updateConfirmButtonStatus();
                }

            } else {
                showMessage(data.message || 'Booking gagal. Silakan coba lagi.', 'error');
                confirmBookingBtn.disabled = false; 
            }
        } catch (error) {
            console.error('Error booking PlayStation:', error);
            showMessage('Terjadi kesalahan saat booking. Silakan coba lagi nanti.', 'error');
            confirmBookingBtn.disabled = false; 
        }
    });

    // Fungsi untuk menampilkan pesan
    const showMessage = (message, type) => {
        bookingMessage.textContent = message;
        bookingMessage.className = `message ${type}`;
        bookingMessage.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                bookingMessage.style.display = 'none';
            }, 5000);
        }
    };

    // Inisialisasi
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    bookingDateInput.min = `${year}-${month}-${day}`;
    bookingDateInput.value = `${year}-${month}-${day}`; 

    // Muat daftar PlayStation saat halaman pertama dimuat
    fetchPlaystations();
    
    // Panggil fetchAvailableSlots setelah sedikit delay
    setTimeout(fetchAvailableSlots, 100);
    
    // Atur status awal tombol
    updateConfirmButtonStatus(); 
}); 