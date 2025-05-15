// Update infoSettings.js for radio buttons
class InfoSettingsManager {
    constructor() {
        this.infoButton = document.getElementById('infoButton');
        this.infoDropdown = document.getElementById('infoDropdown');
        this.campusVRadio = document.getElementById('campusV');
        this.campusORadio = document.getElementById('campusO');
        this.themeDarkRadio = document.getElementById('themeDark');
        this.themeLightRadio = document.getElementById('themeLight');

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
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.themeDarkRadio.checked = true;
            this.themeLightRadio.checked = false;
        } else {
            // Default to light mode if no theme saved or if it's 'light'
            this.themeLightRadio.checked = true;
            this.themeDarkRadio.checked = false;
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

        // Theme radio buttons
        this.themeDarkRadio.addEventListener('change', () => {
            if (this.themeDarkRadio.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });

        this.themeLightRadio.addEventListener('change', () => {
            if (this.themeLightRadio.checked) {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing InfoSettingsManager');
    new InfoSettingsManager();
});