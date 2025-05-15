import { ProgramsTableManager } from './programs-table.js';
import { UIManager } from '../ui.js';
import { FilterManager } from '../filters.js';

class ProgramsApp {
    constructor() {
        this.allPrograms = [];
        this.tableManager = new ProgramsTableManager();
        this.uiManager = new UIManager();
        this.filterManager = new FilterManager(() => this.handleFilterChange());

        this.initialize();
    }

    async initialize() {
        await this.loadInitialData(true);
        this.setupEventListeners();
    }

    async loadInitialData(resetFilters = true) {
        try {
            // Get program data from JSON file
            const response = await fetch('/data/program-data/UBCV.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            this.allPrograms = data;

            if (resetFilters) {
                this.initializeFacultyFilter(data);
            }

            this.updateTotalPrograms(data);
            this.tableManager.populateTable(data);
        } catch (error) {
            console.error('Failed to load program data:', error);
            this.allPrograms = [];
            this.updateTotalPrograms([]);
            this.tableManager.populateTable([]);
        }
    }

    initializeFacultyFilter(programs) {
        // Count faculties with a map of original name to [shortName, count]
        const facultyData = new Map();
        
        programs.forEach(program => {
            const faculty = program.faculty;
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
        // Search input
        document.getElementById('searchInput')?.addEventListener('input', () => {
            this.handleFilterChange();
        });

        // Search type select
        document.getElementById('searchTypeSelect')?.addEventListener('change', (e) => {
            switch (e.target.value) {
                case 'course':
                    window.location.href = 'index.html';
                    break;
                case 'professor':
                    window.location.href = 'professors.html';
                    break;
                case 'insights':
                    window.location.href = 'data.html';
                    break;
                default:
                    break;
            }
        });
    }

    handleFilterChange() {
        const filters = this.filterManager.getSelectedFilters();
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';

        // Filter programs
        let filteredPrograms = this.allPrograms.filter(program => {
            // Search filter
            if (searchTerm && !program.name.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Faculty filter
            if (filters.faculties.length > 0 && !filters.faculties.includes(program.faculty)) {
                return false;
            }

            return true;
        });

        this.updateTotalPrograms(filteredPrograms);
        this.tableManager.populateTable(filteredPrograms);
    }

    updateTotalPrograms(programs) {
        const totalPrograms = document.getElementById('totalPrograms');
        if (totalPrograms) {
            totalPrograms.textContent = programs.length;
        }
    }
}

const app = new ProgramsApp();
window.app = app;