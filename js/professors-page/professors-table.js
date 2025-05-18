export class ProfessorsTableManager {
    constructor() {
        this.tableBody = document.querySelector("#professorTable tbody");
        this.currentPage = 1;
        this.itemsPerPage = 100;
        this.bindEventHandlers();
    }

    bindEventHandlers() {
        this.changePage = this.changePage.bind(this);
        this.handleItemsPerPageChange = this.handleItemsPerPageChange.bind(this);
    }

    populateTable(professors, sortBy = 'name') {
        if (!this.tableBody) return;

        this.totalPages = Math.ceil(professors.length / this.itemsPerPage);

        // Get the current page's professors
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = this.itemsPerPage === -1 ? professors.length : startIndex + this.itemsPerPage;
        const displayedProfessors = this.itemsPerPage === -1 ? professors : professors.slice(startIndex, endIndex);

        this.tableBody.innerHTML = '';

        displayedProfessors.forEach(professor => {
            this.createProfessorRow(professor);
        });

        this.updatePagination(professors.length);
    }

    createProfessorRow(professor) {
        const row = document.createElement("tr");

        // Create RateMyProfessors search URL
        const searchUrl = `https://www.ratemyprofessors.com/search/professors?q=${encodeURIComponent(professor.name)}`;

        // Calculate total students for this professor
        const totalStudents = professor.courses.reduce((sum, course) => sum + course.reported, 0);

        // Create vertical list of courses and their averages
        const coursesHtml = professor.courses.map(course => {
            const urlParams = new URLSearchParams(window.location.search);
            const currentCampus = urlParams.get('campus') || 'v';
            const currentSession = document.getElementById('sessionSelect')?.value || '2023W';
            const avgClass = this.getAverageClass(course.average);

            return `<div class="course-row">
                    <a href="/course-details.html?code=${encodeURIComponent(course.code)}&campus=${currentCampus}&session=${currentSession}" 
                    class="course-link" 
                    title="${course.title}">${course.code}</a>
                </div>`;
        }).join('');

        const averagesHtml = professor.courses.map(course => {
            const avgClass = this.getAverageClass(course.average);
            return `<div class="course-row">
                    <span class="${avgClass} monospace">${course.average.toFixed(2)}</span>
                </div>`;
        }).join('');

        const studentsHtml = professor.courses.map(course => {
            return `<div class="course-row">
                    <span class="monospace">${course.reported}</span>
                </div>`;
        }).join('');

        row.innerHTML = `
        <td>
            <a href="${searchUrl}" 
                class="course-link" 
                target="_blank" 
                rel="noopener noreferrer">${professor.name}</a>
        </td>
        <!-- Remove this line: <td>${professor.faculties.join(', ')}</td> -->
        <td>${coursesHtml}</td>
        <td>${studentsHtml}</td>
        <td>${averagesHtml}</td>
    `;

        this.tableBody.appendChild(row);
    }

    getAverageClass(average) {
        if (average >= 90) return 'excellent-average';
        if (average >= 85) return 'great-average';
        if (average >= 80) return 'good-average';
        if (average >= 70) return 'fair-average';
        if (average >= 60) return 'bad-average';
        return 'horrible-average';
    }

    updatePagination(totalItems) {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) return;

        if (totalItems === 0) {
            paginationContainer.innerHTML = '<div class="pagination-controls"><p>No results found</p></div>';
            return;
        }

        const totalPages = this.itemsPerPage === -1 ? 1 : Math.ceil(totalItems / this.itemsPerPage);

        paginationContainer.innerHTML = `
            <div class="pagination-controls">
                <div class="items-per-page">
                    <select id="itemsPerPage" class="filter-select">
                        <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50 per page</option>
                        <option value="100" ${this.itemsPerPage === 100 ? 'selected' : ''}>100 per page</option>
                        <option value="1000" ${this.itemsPerPage === 1000 ? 'selected' : ''}>1000 per page</option>
                        <option value="-1" ${this.itemsPerPage === -1 ? 'selected' : ''}>Show all</option>
                    </select>
                </div>
                <div class="pagination-buttons">
                    ${this.itemsPerPage !== -1 ? `
                        <button class="control-button" id="firstPageBtn" ${this.currentPage === 1 ? 'disabled' : ''}>
                            First
                        </button>
                        <button class="control-button" id="prevPageBtn" ${this.currentPage === 1 ? 'disabled' : ''}>
                            Previous
                        </button>
                        <span class="pagination-info">Page ${this.currentPage} of ${totalPages}</span>
                        <button class="control-button" id="nextPageBtn" ${this.currentPage === totalPages ? 'disabled' : ''}>
                            Next
                        </button>
                        <button class="control-button" id="lastPageBtn" ${this.currentPage === totalPages ? 'disabled' : ''}>
                            Last
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Add event listeners
        if (this.itemsPerPage !== -1) {
            document.getElementById('firstPageBtn')?.addEventListener('click', () => this.changePage(1));
            document.getElementById('prevPageBtn')?.addEventListener('click', () => this.changePage(this.currentPage - 1));
            document.getElementById('nextPageBtn')?.addEventListener('click', () => this.changePage(this.currentPage + 1));
            document.getElementById('lastPageBtn')?.addEventListener('click', () => this.changePage(totalPages));
        }

        document.getElementById('itemsPerPage')?.addEventListener('change', this.handleItemsPerPageChange);
    }

    changePage(page) {
        this.currentPage = page;
        window.app.handleFilterChange(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleItemsPerPageChange(e) {
        this.itemsPerPage = parseInt(e.target.value);
        this.currentPage = 1;
        window.app.handleFilterChange();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}