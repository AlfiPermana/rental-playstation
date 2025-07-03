document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu functionality
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.querySelector('.sidebar');

  
  // Toggle mobile menu
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking on a nav link
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }

  // Scroll animations
  const animateOnScroll = function () {
    const elements = document.querySelectorAll(
      ".feature-card, .pricing-card, .step-card, .location-card"
    );

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.3;

      if (elementPosition < screenPosition) {
        element.classList.add("slide-up");
      }
    });
  };

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for fixed header
          behavior: 'smooth'
        });
      }
    });
  });

  // Initialize scroll animations
  window.addEventListener("scroll", animateOnScroll);
  animateOnScroll(); // Run once on page load

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  // Function to handle sidebar state changes
  function setSidebarState(isActive) {
      if (isActive) {
          sidebar.classList.add('active');
          overlay.style.display = 'block';
          document.body.style.overflow = 'hidden';
          hamburgerBtn.classList.add('disabled');
      } else {
          sidebar.classList.remove('active');
          overlay.style.display = 'none';
          document.body.style.overflow = '';
          hamburgerBtn.classList.remove('disabled');
      }
  }

  // Toggle sidebar when hamburger button is clicked
  hamburgerBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Only toggle if button is not disabled
      if (!hamburgerBtn.classList.contains('disabled')) {
          const isActive = !sidebar.classList.contains('active');
          setSidebarState(isActive);
      }
  });
  
  // Close sidebar when clicking on overlay
  overlay.addEventListener('click', function() {
      setSidebarState(false);
  });
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768 && 
          !sidebar.contains(e.target) && 
          !hamburgerBtn.contains(e.target)) {
          setSidebarState(false);
      }
  });
  
  // Close sidebar when clicking on a nav link (for mobile)
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  navLinks.forEach(link => {
      link.addEventListener('click', function() {
          if (window.innerWidth <= 768) {
              setSidebarState(false);
          }
      });
  });
  
  // Close sidebar when window is resized to desktop size
  window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
          setSidebarState(false);
      }
  });

  // Add CSS for disabled state (can also be added to your CSS file)
  const style = document.createElement('style');
  style.textContent = `
      .hamburger-btn.disabled {
          pointer-events: none;
          opacity: 0.7;
      }
      .hamburger-btn.disabled span {
          background-color: #ccc;
      }
  `;
  document.head.appendChild(style);

  // Rest of your dashboard functionality remains the same...
  function loadUserData() {
      const userData = {
          name: 'John Doe',
          email: 'john.doe@example.com'
      };
      document.getElementById('usernameDisplay').textContent = userData.name;
      document.getElementById('emailDisplay').textContent = userData.email;
  }

  function loadDashboardData() {
      // ... (keep your existing dashboard data implementation)
  }

  document.getElementById('logoutBtn').addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin logout?')) {
          localStorage.removeItem('userToken');
          window.location.href = '../index.html';
      }
  });

  loadUserData();
  loadDashboardData();
});

