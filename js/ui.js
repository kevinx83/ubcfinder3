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
    if (campusToggle) {
      // Remove any existing campus selection from localStorage
      localStorage.removeItem('selectedCampus');
      
      // Always set to Vancouver (unchecked) when initializing
      campusToggle.checked = false;
      
      // Update URL to reflect Vancouver campus
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('campus', 'v');
      history.replaceState(null, '', `?${urlParams.toString()}`);
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
    return document.getElementById('campusToggle')?.checked ? 'o' : 'v';
  }

  updateToggleButtonVisibility(sortBy) {
    const toggleAllButton = document.getElementById('toggleAll');
    if (toggleAllButton) {
      toggleAllButton.style.display =
        (sortBy === 'average' || sortBy === 'average-asc') ? 'none' : 'inline-block';
    }
  }
}