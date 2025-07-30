// public/js/admin/reports.js
document.addEventListener("DOMContentLoaded", () => {
  const checkAdminAccess = () => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") {
      alert("Akses ditolak. Anda bukan admin.");
      window.location.href = "/login.html";
    }
  };
  checkAdminAccess();

  // --- Tambahan: Elemen untuk rekap ringkasan bisnis ---
  const todayBookingsElem = document.getElementById("todayBookings");
  const todayRevenueElem = document.getElementById("todayRevenue");
  const weekBookingsElem = document.getElementById("weekBookings");
  const weekRevenueElem = document.getElementById("weekRevenue");
  const monthBookingsElem = document.getElementById("monthBookings");
  const monthRevenueElem = document.getElementById("monthRevenue");
  const totalBookingsSummaryElem = document.getElementById(
    "totalBookings" // <<< PERBAIKAN: ID elemen yang benar adalah "totalBookings"
  );
  const totalRevenueSummaryElem = document.getElementById(
    "totalRevenueSummary"
  );

  // Elemen untuk statistik umum (kartu bagian bawah)
  const totalRevenueElem = document.getElementById("totalRevenue");
  const totalBookingsCountElem = document.getElementById("totalBookingsCount");
  const pendingBookingsCountElem = document.getElementById(
    "pendingBookingsCount"
  );
  const totalUsersCountElem = document.getElementById("totalUsersCount");
  const reportMessage = document.getElementById("reportMessage");

  // Elemen untuk Laporan Pendapatan (Generator Tabel)
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const generateReportBtn = document.getElementById("generateReportBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  const revenueReportBody = document.getElementById("revenueReportBody");
  const revenueTotalElem = document.getElementById("revenueTotal");

  // Date range elements
  const todayRangeElem = document.getElementById("todayRange");
  const weekRangeElem = document.getElementById("weekRange");
  const monthRangeElem = document.getElementById("monthRange");

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn");
  // Helper function to format currency, dipindahkan ke scope atas agar bisa diakses semua fungsi
  const formatRupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        // Update elemen dengan data yang sesuai
        totalRevenueElem.textContent = `Rp ${Number(
          data.totalRevenue
        ).toLocaleString("id-ID")}`;
        totalBookingsCountElem.textContent = data.totalBookingsCount;
        pendingBookingsCountElem.textContent = data.pendingBookingsCount;
        totalUsersCountElem.textContent = data.totalUsersCount;
      } else {
        reportMessage.textContent =
          "Gagal memuat laporan: " + (data.message || "Server error");
        reportMessage.classList.add("error");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      reportMessage.textContent = "Terjadi kesalahan saat memuat laporan.";
      reportMessage.classList.add("error");
    }
  };

  // Helper function to format date range
  const formatDateRange = (type) => {
    const now = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };

    switch (type) {
      case "today":
        return now.toLocaleDateString("id-ID", options);
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        })} - ${endOfWeek.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`;
      case "month":
        return now.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });
      default:
        return "";
    }
  };

  // Helper function to add loading state
  const setLoadingState = (isLoading) => {
    const cards = document.querySelectorAll(".summary-card");
    cards.forEach((card) => {
      if (isLoading) {
        card.classList.add("loading");
      } else {
        card.classList.remove("loading");
      }
    });

    if (refreshBtn) {
      refreshBtn.disabled = isLoading;
      refreshBtn.innerHTML = isLoading
        ? "<span>⏳</span> Loading..."
        : "<span>🔄</span> Refresh Data";
    }
  };

  // Fetch business summary (rekap harian, mingguan, bulanan, total)
  const fetchBusinessSummary = async () => {
    try {
      setLoadingState(true);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/reports/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summary = await response.json();

      if (response.ok) {
        // Update data
        todayBookingsElem.textContent = summary.today.bookings;
        todayRevenueElem.textContent = formatRupiah(summary.today.revenue);
        weekBookingsElem.textContent = summary.thisWeek.bookings;
        weekRevenueElem.textContent = formatRupiah(summary.thisWeek.revenue);
        monthBookingsElem.textContent = summary.thisMonth.bookings;
        monthRevenueElem.textContent = formatRupiah(summary.thisMonth.revenue);
        // <<< PERBAIKAN: Tambahkan pengecekan null untuk elemen >>>
        if (totalBookingsSummaryElem)
          totalBookingsSummaryElem.textContent = summary.total.bookings;
        if (totalRevenueSummaryElem)
          totalRevenueSummaryElem.textContent = formatRupiah(
            summary.total.revenue
          );
        // Update date ranges
        todayRangeElem.textContent = formatDateRange("today");
        weekRangeElem.textContent = formatDateRange("week");
        monthRangeElem.textContent = formatDateRange("month");

        console.log("Business summary loaded successfully:", summary);
      } else {
        const errorText = "-";
        const errorRevenue = "Rp 0";
        const errorRange = "Error loading data";

        if (todayBookingsElem) todayBookingsElem.textContent = errorText;
        if (weekBookingsElem) weekBookingsElem.textContent = errorText;
        if (monthBookingsElem) monthBookingsElem.textContent = errorText;
        if (totalBookingsSummaryElem)
          totalBookingsSummaryElem.textContent = errorText;
        if (todayRevenueElem) todayRevenueElem.textContent = errorRevenue;
        if (weekRevenueElem) weekRevenueElem.textContent = errorRevenue;
        if (monthRevenueElem) monthRevenueElem.textContent = errorRevenue;
        if (totalRevenueSummaryElem)
          totalRevenueSummaryElem.textContent = errorRevenue;
        if (todayRangeElem) todayRangeElem.textContent = errorRange;
        if (weekRangeElem) weekRangeElem.textContent = errorRange;
        if (monthRangeElem) monthRangeElem.textContent = errorRange;

        console.error("Failed to load business summary:", summary.message);
      }
    } catch (error) {
      console.error("Error fetching business summary:", error);

      // Set error state
      const errorText = "-";
      const errorRevenue = "Rp 0";
      const errorRange = "Connection error";

      if (todayBookingsElem) todayBookingsElem.textContent = errorText;
      if (weekBookingsElem) weekBookingsElem.textContent = errorText;
      if (monthBookingsElem) monthBookingsElem.textContent = errorText;
      if (totalBookingsSummaryElem)
        totalBookingsSummaryElem.textContent = errorText;
      if (todayRevenueElem) todayRevenueElem.textContent = errorRevenue;
      if (weekRevenueElem) weekRevenueElem.textContent = errorRevenue;
      if (monthRevenueElem) monthRevenueElem.textContent = errorRevenue;
      if (totalRevenueSummaryElem)
        totalRevenueSummaryElem.textContent = errorRevenue;
      if (todayRangeElem) todayRangeElem.textContent = errorRange;
      if (weekRangeElem) weekRangeElem.textContent = errorRange;
      if (monthRangeElem) monthRangeElem.textContent = errorRange;
    } finally {
      setLoadingState(false);
    }
  };

  // Add refresh button event listener
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      fetchBusinessSummary(); // Refresh summary cards
      fetchMonthlySummaryReport(); // Refresh monthly summary table
    });
  }
  // --- NEW: Revenue Report Logic ---

  const fetchRevenueReport = async (startDate, endDate) => {
    if (!startDate || !endDate) {
      alert("Silakan pilih rentang tanggal terlebih dahulu.");
      return;
    }

    generateReportBtn.disabled = true;
    generateReportBtn.textContent = "Memuat...";
    revenueReportBody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;">Memuat laporan...</td></tr>';

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data laporan.");
      }

      const data = await response.json();
      renderRevenueReport(data);
      downloadPdfBtn.disabled = data.length === 0;
    } catch (error) {
      console.error("Error fetching revenue report:", error);
      revenueReportBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red;">${error.message}</td></tr>`;
      downloadPdfBtn.disabled = true;
    } finally {
      generateReportBtn.disabled = false;
      generateReportBtn.textContent = "Tampilkan Laporan";
    }
  };

  const renderRevenueReport = (data) => {
    revenueReportBody.innerHTML = "";
    let totalRevenue = 0;

    if (data.length === 0) {
      revenueReportBody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;">Tidak ada data untuk periode yang dipilih.</td></tr>';
      revenueTotalElem.textContent = formatRupiah(0); // <<< PERBAIKAN: formatRupiah sekarang bisa diakses
      return;
    }

    data.forEach((item) => {
      const row = document.createElement("tr");
      totalRevenue += parseFloat(item.total_revenue);
      row.innerHTML = `
            <td>${new Date(item.created_at).toLocaleDateString("id-ID")}</td>
            <td>${item.customer_name || "-"}</td>
            <td>${item.playstation_name}</td>
            <td>${item.duration_hours} Jam</td>
            <td>${formatRupiah(item.price_per_hour)}</td>
            <td>${formatRupiah(item.total_revenue)}</td>
            <td>${item.payment_method || "Transfer"}</td>
        `;
      revenueReportBody.appendChild(row);
    });

    revenueTotalElem.textContent = formatRupiah(totalRevenue);
  };

  const fetchMonthlySummaryReport = async () => {
    const monthlySummaryTable = document.getElementById("monthlySummaryTable");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/reports/monthly-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      let tableHTML = `
            <thead>
                <tr>
                    <th>Bulan</th>
                    <th>Jumlah Transaksi</th>
                    <th>Total Jam Sewa</th>
                    <th>Total Pendapatan</th>
                </tr>
            </thead>
            <tbody>
        `;
      data.forEach((item) => {
        tableHTML += `
                <tr>
                    <td>${item.month}</td>
                    <td>${item.transaction_count}</td>
                    <td>${item.total_hours} jam</td>
                    <td>${formatRupiah(
                      item.total_revenue
                    )}</td>  
                </tr>
            `;
      });
      tableHTML += "</tbody>";
      monthlySummaryTable.innerHTML = tableHTML;
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      monthlySummaryTable.innerHTML =
        '<tr><td colspan="4">Gagal memuat rekap bulanan.</td></tr>';
    }
  };

  const downloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Laporan Pendapatan Detail", 14, 20);
    doc.autoTable({ html: "#revenueReportTable", startY: 25 });

    doc.addPage();
    doc.text("Laporan Rekap Bulanan", 14, 20);
    doc.autoTable({ html: "#monthlySummaryTable", startY: 25 });

    const date = new Date().toISOString().slice(0, 10);
    doc.save(`laporan-pendapatan-${date}.pdf`);
  };

  // Event Listeners
  generateReportBtn.addEventListener("click", () => {
    fetchRevenueReport(startDateInput.value, endDateInput.value);
  });

  downloadPdfBtn.addEventListener("click", downloadPDF);

  // Initial fetch on page load
  fetchMonthlySummaryReport();
  fetchReports();
  fetchBusinessSummary(); // <<< PERBAIKAN: Cukup panggil sekali

  // Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      window.location.href = "/login.html";
    });
  }
});
