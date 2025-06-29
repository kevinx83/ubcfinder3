import { ProfessorsTableManager } from './professors-table.js';
import { UIManager } from '../ui.js';
import { FilterManager } from '../filters.js';
import { dataService } from '../dataService.js';

class ProfessorsApp {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentCampus = urlParams.get('campus') || 'v';
        this.allProfessors = [];

        // Check if we need to clear session storage (for page reload)
        if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
            this.clearFilterSessionStorage();
        }

        this.tableManager = new ProfessorsTableManager();
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
        document.getElementById('sessionSelect')?.addEventListener('change', async (e) => {
            dataService.setSession(e.target.value);
            await this.loadInitialData(false);
        });

        // Add event listeners to UBCFinder logo links to clear filters
        const logoLinks = document.querySelectorAll('.home-link, a[href="index.html"]');
        logoLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // If clicking to go to index page or reloading professors page
                if (link.getAttribute('href') === 'index.html' ||
                    (window.location.pathname.includes('professors.html') && link.getAttribute('href') === 'professors.html')) {
                    this.clearFilterSessionStorage();
                }
            });
        });

        await this.loadInitialData(true);
        this.setupEventListeners();
        // Restore search input from sessionStorage
        const savedSearch = sessionStorage.getItem('searchTerm');
        if (savedSearch) {
            const input = document.getElementById('searchInput');
            if (input) input.value = savedSearch;
        }

        // Check if we need to apply saved filters
        const hasSessionFilters = sessionStorage.getItem('facultyFilters') ||
            sessionStorage.getItem('yearLevelFilters') ||
            sessionStorage.getItem('averageFilters') ||
            sessionStorage.getItem('searchTerm');
        if (hasSessionFilters) {
            // Apply filters after a short delay to ensure DOM is fully ready
            setTimeout(() => this.handleFilterChange(), 100);
        }
    }

    async loadInitialData(resetFilters = true) {
        try {
            const session = document.getElementById('sessionSelect')?.value || '2023W';
            const campus = this.currentCampus.toUpperCase();

            // Get instructor data from the correct path
            const response = await fetch(`/data/instructor-data/${campus === 'V' ? 'UBCV' : 'UBCO'}/${session}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Calculate simple average and total students for each professor
            const processedData = data.map(professor => {
                // Calculate simple average of all courses
                const validCourses = professor.courses.filter(course => course.average > 0);
                const overallAverage = validCourses.length > 0
                    ? validCourses.reduce((sum, course) => sum + course.average, 0) / validCourses.length
                    : 0;

                // Calculate total students
                const totalStudents = professor.courses.reduce((sum, course) => sum + course.reported, 0);

                return {
                    ...professor,
                    overallAverage: overallAverage,
                    totalStudents: totalStudents,
                    numberOfCourses: professor.courses.length
                };
            });

            this.allProfessors = processedData;

            const sortBy = document.getElementById('sortBy')?.value || 'name';
            const sortedData = this.sortProfessors(processedData, sortBy);

            if (resetFilters) {
                this.initializeFacultyFilter(processedData);
                this.filterManager.initializeYearLevelFilter();
                this.filterManager.initializeAverageFilter();
            }

            this.updateTotalProfessors(sortedData);
            this.tableManager.populateTable(sortedData, sortBy);

            // Apply search term if it exists in session storage
            const searchTerm = sessionStorage.getItem('searchTerm');
            if (searchTerm) {
                document.getElementById('searchInput').value = searchTerm;
                this.handleFilterChange();
            }

        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.allProfessors = [];
            this.updateTotalProfessors([]);
            this.tableManager.populateTable([], 'name');
        }
    }

    initializeFacultyFilter(professors) {
        // Count professors per faculty with a map of original name to [shortName, count]
        const facultyData = new Map();

        // Collect all unique faculties across all professors
        professors.forEach(professor => {
            professor.faculties.forEach(faculty => {
                // First, remove "Faculty of " prefix
                let shortName = faculty.replace("Faculty of ", "");

                // Apply specific name changes
                if (shortName === "School of Architecture & Landscape Architecture") {
                    shortName = "Architecture";
                } else if (shortName === "Commerce and Business Administration") {
                    shortName = "Commerce and Business";
                } else if (shortName === "Faculty Graduate and Postdoctoral Studies") {
                    shortName = "Postdoctoral Studies";
                } else {
                    // Remove "School of " from any remaining names
                    shortName = shortName.replace("School of ", "");
                }

                if (facultyData.has(faculty)) {
                    facultyData.get(faculty).count++;
                } else {
                    facultyData.set(faculty, { shortName, count: 1 });
                }
            });
        });

        // Handle Faculty of Science specially if it's missing
        if (!facultyData.has("Faculty of Science")) {
            facultyData.set("Faculty of Science", { shortName: "Science", count: 0 });
        }

        // Convert to array and sort by count (descending)
        const sortedFaculties = Array.from(facultyData.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .map(([originalName, data]) => ({
                value: originalName, // Keep original name as value for filtering
                label: data.shortName // Display shortened name without course count
            }));

        this.filterManager.createFilterOptions('facultyFilters', sortedFaculties, 'selectAllFaculties');
    }

    setupEventListeners() {
        // Campus toggle
        const campusToggle = document.getElementById('campusToggle');
        if (campusToggle) {
            campusToggle.checked = this.currentCampus === 'o';
            campusToggle.addEventListener('change', async (e) => {
                this.currentCampus = e.target.checked ? 'o' : 'v';

                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('campus', this.currentCampus);
                history.replaceState(null, '', `?${urlParams.toString()}`);

                await this.loadInitialData();
            });
        }

        // Sort selection
        document.getElementById('sortBy')?.addEventListener('change', () => {
            this.handleFilterChange();
        });

        // Search input
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            // Save search term to session storage
            sessionStorage.setItem('searchTerm', e.target.value);
            this.handleFilterChange();
        });

        // Search type select
        document.getElementById('searchTypeSelect')?.addEventListener('change', (e) => {
            switch (e.target.value) {
                case 'course':
                    window.location.href = 'index.html';
                    break;
                case 'program':
                    window.location.href = 'programs.html';
                    break;
                case 'insights':
                    window.location.href = 'data.html';
                    break;
                default:
                    break;
            }
        });
    }

    handleFilterChange(isPageChange = false) {
        if (!isPageChange) {
            this.tableManager.currentPage = 1;
        }

        const sortBy = document.getElementById('sortBy')?.value || 'name';
        const filters = this.filterManager.getSelectedFilters();
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';

        // Filter professors
        let filteredProfessors = this.allProfessors.filter(professor => {
            // Search filter
            if (searchTerm && !professor.name.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Faculty filter
            if (filters.faculties.length > 0 && !professor.faculties.some(faculty => filters.faculties.includes(faculty))) {
                return false;
            }

            // Year level filter
            if (filters.yearLevels.length > 0) {
                const matchesYearLevel = professor.courses.some(course => {
                    const courseLevel = dataService.getCourseLevel(course.code);
                    return filters.yearLevels.includes(courseLevel);
                });
                if (!matchesYearLevel) {
                    return false;
                }
            }

            // Average filter
            if (filters.averageRanges.length > 0) {
                const avg = professor.overallAverage;
                const matchesAverage = filters.averageRanges.some(range => {
                    range = parseInt(range);
                    if (range === 90) return avg >= 90;
                    if (range === 85) return avg >= 85 && avg < 90;
                    if (range === 80) return avg >= 80 && avg < 85;
                    if (range === 70) return avg >= 70 && avg < 80;
                    if (range === 60) return avg >= 60 && avg < 70;
                    if (range === 0) return avg < 60;
                    return false;
                });
                if (!matchesAverage) return false;
            }

            return true;
        });

        // Sort professors
        filteredProfessors = this.sortProfessors(filteredProfessors, sortBy);

        this.updateTotalProfessors(filteredProfessors);
        this.tableManager.populateTable(filteredProfessors, sortBy);
    }

    sortProfessors(professors, sortBy) {
        return [...professors].sort((a, b) => {
            switch (sortBy) {
                case 'average':
                    return b.overallAverage - a.overallAverage;
                case 'average-asc':
                    return a.overallAverage - b.overallAverage;
                case 'courses':
                    return b.numberOfCourses - a.numberOfCourses;
                case 'courses-asc':
                    return a.numberOfCourses - b.numberOfCourses;
                case 'students':
                    return b.totalStudents - a.totalStudents;
                case 'students-asc':
                    return a.totalStudents - b.totalStudents;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });
    }

    updateTotalProfessors(professors) {
        const totalProfessors = document.getElementById('totalProfessors');
        if (totalProfessors) {
            totalProfessors.textContent = professors.length;
        }
    }
}

const app = new ProfessorsApp();
window.app = app;