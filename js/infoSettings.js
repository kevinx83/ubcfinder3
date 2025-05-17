class InfoSettingsManager {
    constructor() {
        this.infoButton = document.getElementById('infoButton');
        this.infoDropdown = document.getElementById('infoDropdown');
        this.campusVRadio = document.getElementById('campusV');
        this.campusORadio = document.getElementById('campusO');
        
        // Get all theme radio buttons with the new naming convention
        this.themeLight1Radio = document.getElementById('themeLight1');
        this.themeDark1Radio = document.getElementById('themeDark1');
        this.themeLight2Radio = document.getElementById('themeLight2');
        this.themeDark2Radio = document.getElementById('themeDark2');
        this.themeLight3Radio = document.getElementById('themeLight3');
        this.themeDark3Radio = document.getElementById('themeDark3');
        this.themeLight4Radio = document.getElementById('themeLight4');
        this.themeDark4Radio = document.getElementById('themeDark4');

        this.initialize();
    }

    initialize() {
        if (!this.infoButton) {
            console.error('Info button not found');
            return;
        }

        // Toggle dropdown on button click
        this.infoButton.addEventListener('click', () => {
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.infoButton.contains(e.target) &&
                !this.infoDropdown.contains(e.target) &&
                this.infoDropdown.classList.contains('active')) {
                this.closeDropdown();
            }
        });

        // Initialize dropdown controls to match current settings
        this.syncWithExistingSettings();

        // Add event listeners for dropdown controls
        this.setupDropdownListeners();
        
        // Ensure default theme is set
        this.ensureDefaultTheme();
    }
    
    // Ensure a default theme is set
    ensureDefaultTheme() {
        // Check if a theme is set in localStorage
        const savedTheme = localStorage.getItem('theme');
        
        // If no theme is set, check system preference or use light-1 as default
        if (!savedTheme) {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const defaultTheme = prefersDarkMode ? 'dark-1' : 'light-1';
            
            localStorage.setItem('theme', defaultTheme);
            document.documentElement.setAttribute('data-theme', defaultTheme);
            
            // Update the radio button state
            const defaultThemeRadio = document.getElementById(`theme${this.capitalizeFirstLetter(defaultTheme.replace('-', ''))}`);
            if (defaultThemeRadio) {
                defaultThemeRadio.checked = true;
            }
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    toggleDropdown() {
        this.infoDropdown.classList.toggle('active');

        if (this.infoDropdown.classList.contains('active')) {
            this.syncWithExistingSettings();
        }
    }

    closeDropdown() {
        this.infoDropdown.classList.remove('active');
    }

    syncWithExistingSettings() {
        // For campus, check URL param or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const campus = urlParams.get('campus') || localStorage.getItem('selectedCampus') || 'v';

        if (campus === 'o') {
            this.campusORadio.checked = true;
            this.campusVRadio.checked = false;
        } else {
            this.campusVRadio.checked = true;
            this.campusORadio.checked = false;
        }

        // For theme, check localStorage
        const savedTheme = localStorage.getItem('theme') || 'light-1';
        
        // Get all theme radio buttons
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        
        // Uncheck all theme radios first
        themeRadios.forEach(radio => {
            radio.checked = false;
        });
        
        // Check the correct theme radio
        // Convert theme name like 'light-1' to 'Light1' for the element ID
        const themeForId = savedTheme.replace('-', '');
        const capitalizedTheme = this.capitalizeFirstLetter(themeForId);
        const selectedThemeRadio = document.getElementById(`theme${capitalizedTheme}`);
        
        if (selectedThemeRadio) {
            selectedThemeRadio.checked = true;
        } else {
            // Default to light-1 if the theme is not found
            this.themeLight1Radio.checked = true;
            document.documentElement.setAttribute('data-theme', 'light-1');
            localStorage.setItem('theme', 'light-1');
        }
    }

    setupDropdownListeners() {
        // Campus radio buttons
        this.campusVRadio.addEventListener('change', () => {
            if (this.campusVRadio.checked) {
                // Update localStorage
                localStorage.setItem('selectedCampus', 'v');

                // Update URL
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('campus', 'v');

                // Replace current URL with new one
                const newUrl = window.location.pathname + '?' + urlParams.toString();

                // Force reload to ensure all data is updated correctly
                window.location.href = newUrl;
            }
        });

        this.campusORadio.addEventListener('change', () => {
            if (this.campusORadio.checked) {
                // Update localStorage
                localStorage.setItem('selectedCampus', 'o');

                // Update URL
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('campus', 'o');

                // Replace current URL with new one
                const newUrl = window.location.pathname + '?' + urlParams.toString();

                // Force reload to ensure all data is updated correctly
                window.location.href = newUrl;
            }
        });

        // Theme radio buttons - set up event listeners for all themes
        const setupThemeListener = (radioElement, themeName) => {
            if (radioElement) {
                radioElement.addEventListener('change', () => {
                    if (radioElement.checked) {
                        document.documentElement.setAttribute('data-theme', themeName);
                        localStorage.setItem('theme', themeName);
                    }
                });
            }
        };

        // Set up listeners for all themes with the new naming convention
        setupThemeListener(this.themeLight1Radio, 'light-1');
        setupThemeListener(this.themeDark1Radio, 'dark-1');
        setupThemeListener(this.themeLight2Radio, 'light-2');
        setupThemeListener(this.themeDark2Radio, 'dark-2');
        setupThemeListener(this.themeLight3Radio, 'light-3');
        setupThemeListener(this.themeDark3Radio, 'dark-3');
        setupThemeListener(this.themeLight4Radio, 'light-4');
        setupThemeListener(this.themeDark4Radio, 'dark-4');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing InfoSettingsManager');
    new InfoSettingsManager();
});