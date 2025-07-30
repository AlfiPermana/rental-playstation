document.addEventListener("DOMContentLoaded", async () => {
  // Ambil referensi elemen-elemen HTML
  const customerNameInput = document.getElementById("customerName");
  const customerEmailInput = document.getElementById("customerEmail");
  const customerPhoneInput = document.getElementById("customerPhone");
  const playstationSelect = document.getElementById("playstationSelect");
  const bookingDateInput = document.getElementById("bookingDate");
  const durationHoursSelect = document.getElementById("durationHours");
  const availableSlotsDiv = document.getElementById("availableSlots");
  const bookingForm = document.getElementById("bookingForm");
  const bookingMessage = document.getElementById("bookingMessage");
  const confirmBookingBtn = document.getElementById("confirmBookingBtn");
  const priceDisplay = document.getElementById("priceDisplay");
  const totalPriceSpan = document.getElementById("totalPrice");

  // New elements for enhanced UI
  const basePriceSpan = document.getElementById("basePrice");
  const uniqueCodePreviewSpan = document.getElementById("uniqueCodePreview");
  const playstationInfoDiv = document.getElementById("playstationInfo");
  const psNameSpan = document.getElementById("psName");
  const psTypeSpan = document.getElementById("psType");
  const psPriceSpan = document.getElementById("psPrice");

  // Elemen untuk Modal Pembayaran
  const paymentChoiceModal = document.getElementById("paymentChoiceModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const payOnlineBtn = document.getElementById("payOnlineBtn");
  const payOnSiteBtn = document.getElementById("payOnSiteBtn");

  // Variabel untuk menyimpan state
  let selectedSlotTime = null;
  let selectedPlaystation = null;
  let playstationsData = [];
  let bookingData = {}; // Untuk menyimpan data booking sementara

  // Fungsi untuk mengupdate status tombol Konfirmasi Booking
  const updateConfirmButtonStatus = () => {
    const isFormComplete =
      customerNameInput.value &&
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
      psPriceSpan.textContent = `Rp ${Number(
        playstation.price_per_hour
      ).toLocaleString("id-ID")}/jam`;
      playstationInfoDiv.style.display = "block";
    } else {
      playstationInfoDiv.style.display = "none";
    }
  };

  // Fungsi untuk generate preview kode unik
  const generateUniqueCodePreview = () => {
    const randomCode = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return randomCode;
  };

  // Fungsi untuk memuat daftar PlayStation yang tersedia
  const fetchPlaystations = async () => {
    try {
      const response = await fetch("/api/guest/playstations");
      const playstations = await response.json();

      if (response.ok) {
        playstationsData = playstations;
        playstationSelect.innerHTML =
          '<option value="">-- Pilih PlayStation --</option>';
        playstations.forEach((ps) => {
          const option = document.createElement("option");
          option.value = ps.id;
          option.textContent = `${ps.name} (${ps.type}) - Rp. ${Number(
            ps.price_per_hour
          ).toLocaleString("id-ID")}/jam`;
          option.dataset.price = ps.price_per_hour;
          playstationSelect.appendChild(option);
        });
      } else {
        alert(
          "Gagal memuat daftar PlayStation: " +
            (playstations.message || "Server error")
        );
      }
    } catch (error) {
      console.error("Error fetching PlayStations:", error);
      alert("Terjadi kesalahan saat memuat daftar PlayStation.");
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

    if (!playstationId || !bookingDate || isNaN(duration) || duration < 1) {
      availableSlotsDiv.innerHTML =
        '<div class="slots-placeholder"><span class="icon">⏰</span><p>Pilih PlayStation, tanggal, dan durasi untuk melihat slot.</p></div>';
      return;
    }

    try {
      const response = await fetch(
        `/api/guest/available-slots?playstationId=${playstationId}&date=${bookingDate}`
      );
      const slots = await response.json();

      if (response.ok) {
        availableSlotsDiv.innerHTML = "";
        if (slots.length === 0) {
          availableSlotsDiv.innerHTML =
            "<p>Tidak ada slot tersedia untuk tanggal ini.</p>";
          return;
        }

        const filteredSlots = slots.filter((slot) => {
          const startTimeHour = parseInt(slot.time.split(":")[0]);
          const potentialEndTimeHour = startTimeHour + duration;
          return potentialEndTimeHour <= 23;
        });

        if (filteredSlots.length === 0) {
          availableSlotsDiv.innerHTML = `<p>Tidak ada slot tersedia untuk durasi ${duration} jam pada tanggal ini.</p>`;
          return;
        }

        filteredSlots.forEach((slot) => {
          const slotItem = document.createElement("div");
          slotItem.classList.add("slot-item");
          const endHour = parseInt(slot.time.split(":")[0]) + duration;
          const displayEndTime = `${String(endHour).padStart(2, "0")}:${
            slot.time.split(":")[1]
          }`;
          slotItem.textContent = `${slot.time} - ${displayEndTime.substring(
            0,
            5
          )}`;
          slotItem.dataset.startTime = slot.time;
          slotItem.classList.add("available");

          availableSlotsDiv.appendChild(slotItem);
        });
      } else {
        availableSlotsDiv.innerHTML = `<p>Gagal memuat slot: ${
          slots.message || "Server error"
        }</p>`;
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      availableSlotsDiv.innerHTML =
        "<p>Terjadi kesalahan saat memuat slot waktu.</p>";
    }
  };

  // Fungsi untuk menghitung dan menampilkan total harga
  const calculateAndDisplayPrice = () => {
    if (selectedPlaystation && selectedSlotTime && durationHoursSelect.value) {
      const pricePerHour = parseFloat(selectedPlaystation.price_per_hour);
      const duration = parseInt(durationHoursSelect.value);
      const basePrice = pricePerHour * duration;

      const uniqueCode = generateUniqueCodePreview();
      const finalPrice = basePrice + parseInt(uniqueCode);

      basePriceSpan.textContent = `Rp ${basePrice.toLocaleString("id-ID")}`;
      uniqueCodePreviewSpan.textContent = uniqueCode;
      totalPriceSpan.textContent = `Rp ${finalPrice.toLocaleString("id-ID")}`;
      priceDisplay.style.display = "block";
    } else {
      priceDisplay.style.display = "none";
    }
  };

  // Fungsi untuk menampilkan pesan
  const showMessage = (message, type) => {
    bookingMessage.textContent = message;
    bookingMessage.className = `message ${type}`;
    bookingMessage.style.display = "block";

    if (type === "success" || type === "info") {
      setTimeout(() => {
        bookingMessage.style.display = "none";
      }, 5000);
    }
  };

  // Event Listeners untuk input form
  [
    customerNameInput,
    customerEmailInput,
    customerPhoneInput,
    playstationSelect,
    bookingDateInput,
    durationHoursSelect,
  ].forEach((el) => {
    el.addEventListener("input", updateConfirmButtonStatus);
  });

  playstationSelect.addEventListener("change", () => {
    const selectedOption =
      playstationSelect.options[playstationSelect.selectedIndex];
    if (selectedOption.value) {
      const selectedPsData = playstationsData.find(
        (ps) => ps.id == selectedOption.value
      );
      selectedPlaystation = {
        id: selectedOption.value,
        price_per_hour: parseFloat(selectedOption.dataset.price),
      };
      showPlaystationInfo(selectedPsData);
    } else {
      selectedPlaystation = null;
      showPlaystationInfo(null);
    }
    fetchAvailableSlots();
    calculateAndDisplayPrice();
  });

  durationHoursSelect.addEventListener("input", () => {
    fetchAvailableSlots();
    calculateAndDisplayPrice();
  });

  bookingDateInput.addEventListener("change", fetchAvailableSlots);

  availableSlotsDiv.addEventListener("click", (e) => {
    if (e.target.classList.contains("available")) {
      const previouslySelected = document.querySelector(".slot-item.selected");
      if (previouslySelected) {
        previouslySelected.classList.remove("selected");
      }
      e.target.classList.add("selected");
      selectedSlotTime = e.target.dataset.startTime;
      calculateAndDisplayPrice();
      updateConfirmButtonStatus();
    }
  });

  // --- LOGIKA BARU: Handle form submission dengan menampilkan modal ---
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Simpan data booking ke variabel sementara
    bookingData = {
      customerName: customerNameInput.value,
      customerEmail: customerEmailInput.value,
      customerPhone: customerPhoneInput.value,
      playstationId: playstationSelect.value,
      bookingDate: bookingDateInput.value,
      startTime: selectedSlotTime,
      durationHours: parseInt(durationHoursSelect.value),
    };

    // Tampilkan modal pilihan pembayaran
    confirmBookingBtn.disabled = true;
    paymentChoiceModal.style.display = "flex";
  });

  // --- LOGIKA BARU: Proses booking setelah metode pembayaran dipilih ---
  const proceedWithBooking = async (paymentMethod) => {
    paymentChoiceModal.style.display = "none";
    showMessage("Memproses booking...", "info");

    try {
      const response = await fetch("/api/guest/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bookingData, paymentMethod }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.redirectUrl) {
          // Pembayaran Online
          alert(
            `Booking berhasil dibuat!\n\nBooking ID: ${
              data.bookingId
            }\nHarga Sewa: Rp. ${data.baseAmount.toLocaleString(
              "id-ID"
            )}\nKode Unik: ${data.uniqueCode}\nTotal Pembayaran: Rp. ${Number(
              data.finalAmount
            ).toLocaleString(
              "id-ID"
            )}\n\nAnda akan diarahkan ke halaman pembayaran.`
          );
          window.location.href = data.redirectUrl;
        } else {
          // Pembayaran di Tempat (Tunai) - Alur Baru
          alert(
            `Permintaan Booking Berhasil!\n\n` +
              `Booking ID: ${data.bookingId}\n` +
              `Total Pembayaran: Rp. ${Number(data.finalAmount).toLocaleString(
                "id-ID"
              )}\n\n` +
              `${data.message}\nAdmin akan segera menghubungi Anda melalui WhatsApp/Telepon.`
          );

          bookingForm.reset();
          availableSlotsDiv.innerHTML =
            '<div class="slots-placeholder"><span class="icon">⏰</span><p>Pilih PlayStation, tanggal, dan durasi untuk melihat slot.</p></div>';
          selectedSlotTime = null;
          priceDisplay.style.display = "none";
          playstationInfoDiv.style.display = "none";
          updateConfirmButtonStatus();
        }
      } else {
        showMessage(
          data.message || "Booking gagal. Silakan coba lagi.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error booking PlayStation:", error);
      showMessage(
        "Terjadi kesalahan saat booking. Silakan coba lagi nanti.",
        "error"
      );
    } finally {
      confirmBookingBtn.disabled = false;
    }
  };

  // --- LOGIKA BARU: Event listener untuk tombol-tombol di modal ---
  payOnlineBtn.addEventListener("click", () => proceedWithBooking("online"));
  payOnSiteBtn.addEventListener("click", () => proceedWithBooking("on_site"));

  closeModalBtn.addEventListener("click", () => {
    paymentChoiceModal.style.display = "none";
    confirmBookingBtn.disabled = false; // Aktifkan kembali tombol jika modal ditutup
  });

  window.addEventListener("click", (event) => {
    if (event.target == paymentChoiceModal) {
      paymentChoiceModal.style.display = "none";
      confirmBookingBtn.disabled = false;
    }
  });

  // Inisialisasi
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  bookingDateInput.min = `${year}-${month}-${day}`;
  bookingDateInput.value = `${year}-${month}-${day}`;

  fetchPlaystations();
  setTimeout(fetchAvailableSlots, 100);
  updateConfirmButtonStatus();
});
