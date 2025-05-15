class ThemeManager {
  constructor() {
    this.initialize();
  }

  initialize() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Apply the saved theme
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Use system preference as default
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDarkMode ? 'dark' : 'light';
      
      // Save the initial preference
      localStorage.setItem('theme', defaultTheme);
      
      // Apply the default theme
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
    
    // Add listener for system theme preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only update if the user hasn't set a theme preference
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      }
    });
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});