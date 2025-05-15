class InfoSettingsManager {
    constructor() {
        this.infoButton = document.getElementById('infoButton');
        this.infoDropdown = document.getElementById('infoDropdown');
        this.campusVRadio = document.getElementById('campusV');
        this.campusORadio = document.getElementById('campusO');
        
        // Get all theme radio buttons
        this.themeLightRadio = document.getElementById('themeLight');
        this.themeDarkRadio = document.getElementById('themeDark');
        this.themeOceanRadio = document.getElementById('themeOcean');
        this.themeSunsetRadio = document.getElementById('themeSunset');
        this.themeForestRadio = document.getElementById('themeForest');
        this.themeNebulaRadio = document.getElementById('themeNebula'); 

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
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        // Get all theme radio buttons
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        
        // Uncheck all theme radios first
        themeRadios.forEach(radio => {
            radio.checked = false;
        });
        
        // Check the correct theme radio
        const selectedThemeRadio = document.getElementById(`theme${savedTheme.charAt(0).toUpperCase() + savedTheme.slice(1)}`);
        if (selectedThemeRadio) {
            selectedThemeRadio.checked = true;
        } else {
            // Default to light if the theme is not found
            this.themeLightRadio.checked = true;
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

        // Set up listeners for all themes
        setupThemeListener(this.themeLightRadio, 'light');
        setupThemeListener(this.themeDarkRadio, 'dark');
        setupThemeListener(this.themeOceanRadio, 'ocean');
        setupThemeListener(this.themeSunsetRadio, 'sunset');
        setupThemeListener(this.themeForestRadio, 'forest');
        setupThemeListener(this.themeNebulaRadio, 'nebula');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing InfoSettingsManager');
    new InfoSettingsManager();
});