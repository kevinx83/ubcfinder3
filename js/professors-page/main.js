import { ProfessorsTableManager } from './professors-table.js';
import { UIManager } from '../ui.js';
import { FilterManager } from '../filters.js';
import { dataService } from '../dataService.js';

class ProfessorsApp {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentCampus = urlParams.get('campus') || 'v';
        this.allProfessors = [];

        this.tableManager = new ProfessorsTableManager();
        this.uiManager = new UIManager();
        this.filterManager = new FilterManager(() => this.handleFilterChange());

        this.initialize();
    }

    async initialize() {
        document.getElementById('sessionSelect')?.addEventListener('change', async (e) => {
            dataService.setSession(e.target.value);
            await this.loadInitialData(false);
        });

        await this.loadInitialData(true);
        this.setupEventListeners();
    }

    async loadInitialData(resetFilters = true) {
        try {
            const session = document.getElementById('sessionSelect')?.value || '2023W';
            const campus = this.currentCampus.toUpperCase();
            
            // Get instructor data from the correct path
            const response = await fetch(`/instructor-data/${campus === 'V' ? 'UBCV' : 'UBCO'}/${session}.json`);
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
                this.filterManager.initializeProfessorFilters(sortedData);
                this.filterManager.initializeYearLevelFilter();
            }

            this.updateTotalProfessors(sortedData);
            this.tableManager.populateTable(sortedData, sortBy);

        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.allProfessors = [];
            this.updateTotalProfessors([]);
            this.tableManager.populateTable([], 'name');
        }
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
        document.getElementById('searchInput')?.addEventListener('input', () => {
            this.handleFilterChange();
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