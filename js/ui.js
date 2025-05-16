export class UIManager {
  constructor() {
    this.setupMobileMenu();
    this.initializeCampusToggle();
    this.setupBackToTop();
  }

  setupBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    if (!backToTopButton) return;

    // Show button after scrolling down 300px
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    });

    // Scroll to top when clicked
    backToTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  initializeCampusToggle() {
    const campusToggle = document.getElementById('campusToggle');
    const campusVRadio = document.getElementById('campusV');
    const campusORadio = document.getElementById('campusO');
    
    if (campusToggle) {
      // Get campus from localStorage only, ignoring URL
      const storedCampus = localStorage.getItem('selectedCampus') || 'v';
      
      // Set toggle state
      campusToggle.checked = storedCampus === 'o';
    }
    
    // Also initialize radio buttons if they exist
    if (campusVRadio && campusORadio) {
      const storedCampus = localStorage.getItem('selectedCampus') || 'v';
      if (storedCampus === 'o') {
        campusORadio.checked = true;
        campusVRadio.checked = false;
      } else {
        campusVRadio.checked = true;
        campusORadio.checked = false;
      }
    }
  }

  setupMobileMenu() {
    const menuButton = document.querySelector('.menu-button');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    menuButton?.addEventListener('click', () => this.toggleSidebar());
    overlay?.addEventListener('click', () => this.toggleSidebar());
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  }

  setupCampusToggle() {
    // Get campus directly from localStorage
    return localStorage.getItem('selectedCampus') === 'o' ? 'o' : 'v';
  }

  updateToggleButtonVisibility(sortBy) {
    const toggleAllButton = document.getElementById('toggleAll');
    if (toggleAllButton) {
      toggleAllButton.style.display =
        (sortBy === 'average' || sortBy === 'average-asc') ? 'none' : 'inline-block';
    }
  }
}