export class ProgramsTableManager {
    constructor() {
        this.tableBody = document.querySelector("#programTable tbody");
        this.currentPage = 1;
        this.itemsPerPage = 100;
        this.bindEventHandlers();
    }

    bindEventHandlers() {
        this.changePage = this.changePage.bind(this);
        this.handleItemsPerPageChange = this.handleItemsPerPageChange.bind(this);
    }

    populateTable(programs) {
        if (!this.tableBody) return;

        this.totalPages = Math.ceil(programs.length / this.itemsPerPage);

        // Get the current page's programs
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = this.itemsPerPage === -1 ? programs.length : startIndex + this.itemsPerPage;
        const displayedPrograms = this.itemsPerPage === -1 ? programs : programs.slice(startIndex, endIndex);

        this.tableBody.innerHTML = '';

        displayedPrograms.forEach(program => {
            this.createProgramRow(program);
        });

        this.updatePagination(programs.length);
    }

    createProgramRow(program) {
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>
            <a href="${program['program link']}" 
               class="course-link" 
               target="_blank" 
               rel="noopener noreferrer">${program.name}</a>
        </td>
        <td>${program.faculty}</td>
        <td>${program.length}</td>
        <td>
            <a href="${program['requirements link']}" 
               class="course-link" 
               target="_blank" 
               rel="noopener noreferrer">View</a>
        </td>
    `;

        this.tableBody.appendChild(row);
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