// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Fungsionalitas untuk hamburger menu (untuk tampilan mobile)
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // Tambahkan fungsionalitas JavaScript umum lainnya di sini
    // Contoh: pesan pop-up, animasi scroll, dll.
});