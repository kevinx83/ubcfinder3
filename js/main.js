import { dataService } from './dataService.js';
import { FilterManager } from './filters.js';
import { TableManager } from './table.js';
import { UIManager } from './ui.js';
import { updateTotalCourses } from './helpers.js';

class App {
  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCampus = urlParams.get('campus');
    const storedCampus = localStorage.getItem('selectedCampus');
    this.currentCampus = urlCampus || storedCampus || 'v';

    if (!storedCampus || storedCampus !== this.currentCampus) {
      localStorage.setItem('selectedCampus', this.currentCampus);
    }

    // Force default session to 2024W on page load
    localStorage.setItem('selectedSession', '2024W');

    if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
      this.clearFilterSessionStorage();
    }

    this.tableManager = new TableManager();
    this.uiManager = new UIManager();
    this.filterManager = new FilterManager(() => this.handleFilterChange());

    this.initialize();
  }

  clearFilterSessionStorage() {
    sessionStorage.removeItem('facultyFilters');
    sessionStorage.removeItem('yearLevelFilters');
    sessionStorage.removeItem('averageFilters');
    sessionStorage.removeItem('studentFilters');
    sessionStorage.removeItem('creditFilters');
    sessionStorage.removeItem('searchTerm');
  }

  async initialize() {
    const sessionSelect = document.getElementById('sessionSelect');
    if (sessionSelect) {
      sessionSelect.value = '2024W';
      sessionSelect.addEventListener('change', async (e) => {
        const selected = e.target.value;
        localStorage.setItem('selectedSession', selected);
        dataService.setSession(selected);
        await this.loadInitialData(false);
      });
    }

    const logoLinks = document.querySelectorAll('.home-link, a[href="index.html"]');
    logoLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        if (window.location.pathname.includes('index.html') && link.getAttribute('href') === 'index.html') {
          e.preventDefault();
          this.clearFilterSessionStorage();
          window.location.reload();
        }
      });
    });

    await this.loadInitialData(true);
    this.setupEventListeners();

    if (this.hasSessionFilters()) {
      setTimeout(() => this.handleFilterChange(), 100);
    }
  }

  hasSessionFilters() {
    return sessionStorage.getItem('facultyFilters') ||
           sessionStorage.getItem('yearLevelFilters') ||
           sessionStorage.getItem('averageFilters') ||
           sessionStorage.getItem('studentFilters') ||
           sessionStorage.getItem('creditFilters') ||
           sessionStorage.getItem('searchTerm');
  }

  async loadInitialData(resetFilters = true) {
    try {
      if (resetFilters) this.filterManager.clearFilters();

      const session = localStorage.getItem('selectedSession') || '2024W';
      dataService.setSession(session);

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

      const searchTerm = sessionStorage.getItem('searchTerm');
      if (searchTerm) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = searchTerm;
          this.handleFilterChange();
        }
      }

    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  setupEventListeners() {
    const campusToggle = document.getElementById('campusToggle');
    if (campusToggle) {
      campusToggle.checked = this.currentCampus === 'o';

      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('campus', this.currentCampus);
      history.replaceState(null, '', `?${urlParams.toString()}`);

      campusToggle.addEventListener('change', async (e) => {
        this.currentCampus = e.target.checked ? 'o' : 'v';
        localStorage.setItem('selectedCampus', this.currentCampus);

        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('campus', this.currentCampus);
        history.replaceState(null, '', `?${urlParams.toString()}`);

        dataService.clearCache();
        await this.loadInitialData();
        this.handleFilterChange();
      });
    }

    document.getElementById('sortBy')?.addEventListener('change', () => {
      this.handleFilterChange();
    });

    document.getElementById('toggleAll')?.addEventListener('click', () => {
      this.tableManager.toggleAllSections();
    });

    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      const searchText = e.target.value.trim();
      const sortBySelect = document.getElementById('sortBy');
      if (searchText.length > 0 && sortBySelect && sortBySelect.value !== 'code') {
        sortBySelect.value = 'code';
      }
      this.handleFilterChange();
    });

    document.getElementById('searchTypeSelect')?.addEventListener('change', (e) => {
      switch (e.target.value) {
        case 'professor':
          window.location.href = 'professors.html';
          break;
        case 'program':
          window.location.href = 'programs.html';
          break;
        default:
          break;
      }
    });
  }

  async handleCampusChange() {
    try {
      this.filterManager.clearFilters();
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
    if (!isPageChange) {
      updateTotalCourses(filteredCourses);
    }
    this.tableManager.populateTable(filteredCourses, sortBy);
  }
}

const app = new App();
window.app = app;

class SubjectSuggestionSystem {
  constructor() {
    this.subjects = [];
    this.isLoaded = false;
    this.searchInput = document.getElementById('searchInput');
    this.currentCampus = localStorage.getItem('selectedCampus') || 'v';
    this.initialize();
  }

  async initialize() {
    this.createSuggestionContainer();
    this.setupEventListeners();
    await this.loadSubjects();
  }

  createSuggestionContainer() {
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
    this.searchInput?.addEventListener('input', () => this.handleInput());

    const campusToggle = document.getElementById('campusToggle');
    campusToggle?.addEventListener('change', (e) => {
      this.currentCampus = e.target.checked ? 'o' : 'v';
      this.loadSubjects();
    });

    document.addEventListener('click', (e) => {
      if (e.target !== this.searchInput && e.target !== this.suggestionsContainer) {
        this.hideSuggestions();
      }
    });
  }

  async loadSubjects() {
    try {
      this.currentCampus = localStorage.getItem('selectedCampus') || 'v';
      const campus = this.currentCampus.toUpperCase();
      const response = await fetch(`/data/course-data/subjects-prereqs/UBC${campus}-subjects.json`);
      if (!response.ok) throw new Error(`Failed to load subjects: ${response.status}`);
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
    if (!searchText || !this.isLoaded) {
      this.hideSuggestions();
      return;
    }

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
    this.suggestionsContainer.innerHTML = '';
    subjects.forEach(subject => {
      if (subject.code.toUpperCase() === searchText) {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
          <span class="suggestion-icon">🔍</span>
          <span class="suggestion-text">View only <strong>${subject.code}</strong> courses</span>
          <span class="suggestion-desc">${subject.title}</span>
        `;
        suggestionItem.addEventListener('click', () => {
          this.searchInput.value = subject.code + '  ';
          this.searchInput.focus();
          this.hideSuggestions();
          this.searchInput.dispatchEvent(new Event('input'));
        });
        this.suggestionsContainer.appendChild(suggestionItem);
      }
    });

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
  window.subjectSuggestions = new SubjectSuggestionSystem();
}
initSubjectSuggestions();
