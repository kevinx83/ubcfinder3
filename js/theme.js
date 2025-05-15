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
      // Update favicon if you implemented that feature
      if (typeof updateFavicon === 'function') {
        updateFavicon(savedTheme);
      }
    } else {
      // Use light theme as default (removed system preference check)
      const defaultTheme = 'light';
      
      // Save the initial preference
      localStorage.setItem('theme', defaultTheme);
      
      // Apply the default theme
      document.documentElement.setAttribute('data-theme', defaultTheme);
      
      // Update favicon if you implemented that feature
      if (typeof updateFavicon === 'function') {
        updateFavicon(defaultTheme);
      }
    }
    
    // Still listen for system preference changes, but only apply if user hasn't set a preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only update if the user hasn't set a theme preference
      if (!localStorage.getItem('theme')) {
        const newTheme = 'light'; // Always default to light regardless of system preference
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update favicon if implemented
        if (typeof updateFavicon === 'function') {
          updateFavicon(newTheme);
        }
      }
    });
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});