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
                // Extract unique faculties for the filter
                const faculties = [...new Set(data.map(program => program.faculty))].sort();
                const facultyOptions = faculties.map(faculty => ({
                    value: faculty,
                    label: faculty
                }));
                
                // Initialize faculty filter only
                const facultyFilters = document.getElementById('facultyFilters');
                if (facultyFilters) {
                    this.filterManager.createFilterOptions('facultyFilters', facultyOptions, 'selectAllFaculties');
                }
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
                // Stay on programs page for 'program' option
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