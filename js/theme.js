class ThemeManager {
  constructor() {
    this.initialize();
    // Make updateFavicon accessible globally
    window.updateFavicon = (theme) => this.updateFavicon(theme);
  }

  initialize() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Apply the saved theme
      document.documentElement.setAttribute('data-theme', savedTheme);
      // Update favicon to match theme
      this.updateFavicon(savedTheme);
    } else {
      // Use light theme as default
      const defaultTheme = 'light-1';
      
      // Save the initial preference
      localStorage.setItem('theme', defaultTheme);
      
      // Apply the default theme
      document.documentElement.setAttribute('data-theme', defaultTheme);
      
      // Update favicon to match theme
      this.updateFavicon(defaultTheme);
    }
    
    // Still listen for system preference changes, but only apply if user hasn't set a preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only update if the user hasn't set a theme preference
      if (!localStorage.getItem('theme')) {
        const newTheme = 'light-1'; // Always default to light regardless of system preference
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update favicon to match theme
        this.updateFavicon(newTheme);
      }
    });
  }
  
  // Add this function for updating the favicon
  updateFavicon(theme) {
    let iconPath;
    
    // Map themes to their corresponding icon files
    switch(theme) {
      case 'light-1':
      case 'dark-1':
        iconPath = '/icons/Default.ico';
        break;
      case 'light-2':
        iconPath = '/icons/Reef.ico';
        break;
      case 'dark-2':
        iconPath = '/icons/Grape.ico';
        break;
      case 'light-3':
        iconPath = '/icons/Meadow.ico';
        break;
      case 'dark-3':
        iconPath = '/icons/Galaxy.ico';
        break;
      case 'light-4':
        iconPath = '/icons/Sakura.ico';
        break;
      case 'dark-4':
        iconPath = '/icons/Spooky.ico';
        break;
      default:
        iconPath = '/icons/Default.ico';
    }
    
    // Update favicon link
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = iconPath;
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});