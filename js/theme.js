class ThemeManager {
  constructor() {
    this.initialize();
  }

  initialize() {
    // Get the theme toggle element
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    // Update the toggle state to match the current theme
    if (savedTheme) {
      themeToggle.checked = savedTheme === 'light';
    } else {
      // Use system preference as default
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToggle.checked = !prefersDarkMode;
      
      // Save the initial preference
      localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
    }

    // Add event listener for toggle change
    themeToggle.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});