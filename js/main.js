import { dataService } from './dataService.js';
import { FilterManager } from './filters.js';
import { TableManager } from './table.js';
import { UIManager } from './ui.js';
import { updateTotalCourses } from './helpers.js';

class App {
  constructor() {
    // Initialize campus from URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlCampus = urlParams.get('campus');
    const storedCampus = localStorage.getItem('selectedCampus');
    this.currentCampus = urlCampus || storedCampus || 'v';
    
    // Ensure localStorage is updated
    if (!storedCampus || storedCampus !== this.currentCampus) {
      localStorage.setItem('selectedCampus', this.currentCampus);
    }

    this.tableManager = new TableManager();
    this.uiManager = new UIManager();
    this.filterManager = new FilterManager(() => this.handleFilterChange());

    this.initialize();
  }

  async initialize() {
    // Add session change listener
    document.getElementById('sessionSelect')?.addEventListener('change', async (e) => {
      dataService.setSession(e.target.value);
      await this.loadInitialData(false);
    });

    await this.loadInitialData(true);
    this.setupEventListeners();
  }

  async loadInitialData(resetFilters = true) {
    try {
      if (resetFilters) {
        this.filterManager.clearFilters();
      }
      const data = await dataService.loadCourseData(this.currentCampus);

      const sortBy = document.getElementById('sortBy')?.value || 'code';

      const sortedData = dataService.sortCourses(data, sortBy);

      if (resetFilters) {
        this.filterManager.initializeFacultyFilter(data);
        this.filterManager.initializeYearLevelFilter();
        this.filterManager.initializeAverageFilter();
        this.filterManager.initializeStudentFilter();
        this.filterManager.initializeCreditFilter();
      }

      updateTotalCourses(data);
      this.tableManager.populateTable(sortedData, sortBy);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  setupEventListeners() {
    // Campus toggle
    const campusToggle = document.getElementById('campusToggle');
    if (campusToggle) {
      // Set initial state based on currentCampus
      campusToggle.checked = this.currentCampus === 'o';

      // Update URL to match the current state
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('campus', this.currentCampus);
      history.replaceState(null, '', `?${urlParams.toString()}`);

      campusToggle.addEventListener('change', async (e) => {
        this.currentCampus = e.target.checked ? 'o' : 'v';

        // Save to localStorage
        localStorage.setItem('selectedCampus', this.currentCampus);

        // Update URL
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('campus', this.currentCampus);
        history.replaceState(null, '', `?${urlParams.toString()}`);

        dataService.clearCache();
        await this.loadInitialData();
        this.handleFilterChange();
      });
    }

    // Sort selection
    document.getElementById('sortBy')?.addEventListener('change', () => {
      this.handleFilterChange();
    });

    // Toggle all sections
    document.getElementById('toggleAll')?.addEventListener('click', () => {
      this.tableManager.toggleAllSections();
    });

    // Search input
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      // Get the search input value
      const searchText = e.target.value.trim();

      // If user is typing something and the current sort isn't 'code'
      const sortBySelect = document.getElementById('sortBy');
      if (searchText.length > 0 && sortBySelect && sortBySelect.value !== 'code') {
        // Change to 'code' sorting
        sortBySelect.value = 'code';
      }

      // Always trigger filter change to update the table
      this.handleFilterChange();
    });

    // Search type select
    document.getElementById('searchTypeSelect')?.addEventListener('change', (e) => {
      switch (e.target.value) {
        case 'professor':
          window.location.href = 'professors.html';
          break;
        case 'program':
          window.location.href = 'programs.html';
          break;
        // Stay on courses page for 'course' option
        default:
          break;
      }
    });
  }

  async handleCampusChange() {
    try {
      this.filterManager.clearFilters(); // Clear existing filters first
      dataService.clearCache();
      const data = await dataService.loadCourseData(this.currentCampus);
      this.filterManager.initializeFacultyFilter(data);
      this.filterManager.initializeYearLevelFilter();
      this.filterManager.initializeAverageFilter();
      this.handleFilterChange();
    } catch (error) {
      console.error('Failed to change campus:', error);
    }
  }

  handleFilterChange(isPageChange = false) {
    if (!isPageChange) {
      this.tableManager.currentPage = 1;
    }

    const sortBy = document.getElementById('sortBy')?.value || 'code';
    const filters = this.filterManager.getSelectedFilters();

    let filteredCourses = dataService.filterCourses(filters);
    filteredCourses = dataService.sortCourses(filteredCourses, sortBy);

    this.uiManager.updateToggleButtonVisibility(sortBy);
    // Only update total count when filters change, not during pagination
    if (!isPageChange) {
      updateTotalCourses(filteredCourses);
    }
    this.tableManager.populateTable(filteredCourses, sortBy);
  }
}

const app = new App();
window.app = app;

// Add this to your main.js file to implement subject code suggestions

class SubjectSuggestionSystem {
  constructor() {
    this.subjects = [];
    this.isLoaded = false;
    this.searchInput = document.getElementById('searchInput');
    this.currentCampus = localStorage.getItem('selectedCampus') || 'v'; // Get from localStorage
    this.initialize();
  }

  async initialize() {
    // Create suggestion container
    this.createSuggestionContainer();

    // Set up event listeners
    this.setupEventListeners();

    // Initial load of subjects
    await this.loadSubjects();
  }

  createSuggestionContainer() {
    // Create the suggestion container if it doesn't exist
    if (!document.getElementById('searchSuggestions')) {
      const searchParent = this.searchInput.parentElement;
      const suggestionContainer = document.createElement('div');
      suggestionContainer.id = 'searchSuggestions';
      suggestionContainer.className = 'search-suggestions';
      searchParent.style.position = 'relative';
      searchParent.appendChild(suggestionContainer);
    }
    this.suggestionsContainer = document.getElementById('searchSuggestions');
  }

  setupEventListeners() {
    // Listen for input changes
    this.searchInput?.addEventListener('input', () => this.handleInput());

    // Listen for campus changes
    const campusToggle = document.getElementById('campusToggle');
    campusToggle?.addEventListener('change', (e) => {
      this.currentCampus = e.target.checked ? 'o' : 'v';
      this.loadSubjects(); // Reload subjects when campus changes
    });

    // Close suggestions when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (e.target !== this.searchInput && e.target !== this.suggestionsContainer) {
        this.hideSuggestions();
      }
    });
  }

  async loadSubjects() {
    try {
      // Get current campus from localStorage (most reliable source)
      this.currentCampus = localStorage.getItem('selectedCampus') || 'v';

      // Fetch the appropriate subjects file
      const campus = this.currentCampus.toUpperCase();
      const response = await fetch(`/data/course-data/subjects-prereqs/UBC${campus}-subjects.json`);

      if (!response.ok) {
        throw new Error(`Failed to load subjects: ${response.status}`);
      }

      this.subjects = await response.json();
      this.isLoaded = true;
      console.log(`Loaded ${this.subjects.length} subjects for UBC${campus}`);
    } catch (error) {
      console.error('Error loading subjects:', error);
      this.subjects = [];
    }
  }

  handleInput() {
    const searchText = this.searchInput.value.trim().toUpperCase();

    // If no text or subjects not loaded, hide suggestions
    if (!searchText || !this.isLoaded) {
      this.hideSuggestions();
      return;
    }

    // Check if the search text matches a subject code
    const matchingSubjects = this.subjects.filter(subject =>
      subject.code.toUpperCase() === searchText ||
      subject.code.toUpperCase().startsWith(searchText)
    );

    if (matchingSubjects.length > 0) {
      this.showSuggestions(matchingSubjects, searchText);
    } else {
      this.hideSuggestions();
    }
  }

  showSuggestions(subjects, searchText) {
    // Clear previous suggestions
    this.suggestionsContainer.innerHTML = '';

    // Create suggestion items
    subjects.forEach(subject => {
      if (subject.code.toUpperCase() === searchText) {
        // Exact match - show "View only" suggestion
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
          <span class="suggestion-icon">🔍</span>
          <span class="suggestion-text">View only <strong>${subject.code}</strong> courses</span>
          <span class="suggestion-desc">${subject.title}</span>
        `;

        // Add click handler
        suggestionItem.addEventListener('click', () => {
          this.searchInput.value = subject.code + '  ';
          this.searchInput.focus();
          this.hideSuggestions();

          // Trigger search/filter
          this.searchInput.dispatchEvent(new Event('input'));
        });

        this.suggestionsContainer.appendChild(suggestionItem);
      }
    });

    // Show the container if there are suggestions
    if (this.suggestionsContainer.children.length > 0) {
      this.suggestionsContainer.style.display = 'block';
    } else {
      this.hideSuggestions();
    }
  }

  hideSuggestions() {
    if (this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'none';
    }
  }
}
function initSubjectSuggestions() {
  // Initialize the suggestion system after the app is fully loaded
  window.subjectSuggestions = new SubjectSuggestionSystem();
}
initSubjectSuggestions();