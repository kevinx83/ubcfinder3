export class TableManager {
  constructor() {
    this.tableBody = document.querySelector("#courseTable tbody");
    this.isCollapsed = false;
    this.currentPage = 1;
    this.itemsPerPage = 100;
    this.bindEventHandlers();
  }

  bindEventHandlers() {
    // Bind the methods to preserve 'this' context
    this.changePage = this.changePage.bind(this);
    this.handleItemsPerPageChange = this.handleItemsPerPageChange.bind(this);
  }

  populateTable(courses, sortBy = 'code') {
    this.totalPages = Math.ceil(courses.length / this.itemsPerPage);

    // Get the current page's courses
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = this.itemsPerPage === -1 ? courses.length : startIndex + this.itemsPerPage;
    const displayedCourses = this.itemsPerPage === -1 ? courses : courses.slice(startIndex, endIndex);

    this.tableBody.innerHTML = '';

    displayedCourses.forEach(course => {
        this.createCourseRow(course);
    });

    this.updatePagination(courses.length);
}

  updatePagination(totalItems) {
    const paginationContainer = document.getElementById('paginationContainer');

    if (totalItems === 0) {
      if (paginationContainer) {
        paginationContainer.innerHTML = '<div class="pagination-controls"><p>No results found</p></div>';
      }
      return;
    }
    if (!paginationContainer) return;

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

    // Add event listeners after creating the elements
    if (this.itemsPerPage !== -1) {
      document.getElementById('firstPageBtn')?.addEventListener('click', () => this.changePage(1));
      document.getElementById('prevPageBtn')?.addEventListener('click', () => this.changePage(this.currentPage - 1));
      document.getElementById('nextPageBtn')?.addEventListener('click', () => this.changePage(this.currentPage + 1));
      document.getElementById('lastPageBtn')?.addEventListener('click', () => this.changePage(totalPages));
    }

    document.getElementById('itemsPerPage')?.addEventListener('change', this.handleItemsPerPageChange);
  }

  handleItemsPerPageChange(e) {
    this.itemsPerPage = parseInt(e.target.value);
    this.currentPage = 1; // Reset to first page when changing items per page
    window.app.handleFilterChange(); // Trigger re-render
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

  calculateTotalStudents(course) {
    const grades = [
      course['<50'] || 0,
      course['50-54'] || 0,
      course['55-59'] || 0,
      course['60-63'] || 0,
      course['64-67'] || 0,
      course['68-71'] || 0,
      course['72-75'] || 0,
      course['76-79'] || 0,
      course['80-84'] || 0,
      course['85-89'] || 0,
      course['90-100'] || 0
    ];
    return grades.reduce((sum, count) => sum + count, 0);
  }

  

  createCourseRow(course) {
    const courseRow = document.createElement("tr");
    courseRow.setAttribute('data-subject', course.Subject);
    const avgClass = this.getAverageClass(course.Average);

    const urlParams = new URLSearchParams(window.location.search);
    const currentCampus = urlParams.get('campus') || 'v';
    const currentSession = document.getElementById('sessionSelect').value;

    courseRow.innerHTML = `
        <td>
            <a href="/course-details.html?code=${encodeURIComponent(course.Code)}&campus=${currentCampus}&session=${currentSession}" 
               class="course-link" 
               style="color: inherit; text-decoration: none; display: block;">
                ${course.Code}
            </a>
        </td>
        <td>${course.Name}</td>
        <td class="monospace text-right">${course.Reported.toLocaleString()}</td>
        <td class="${avgClass}">${course.Average.toFixed(2)}</td>
    `;

    this.tableBody.appendChild(courseRow);
  }

  getAverageClass(average) {
    if (average >= 90) return 'excellent-average';
    if (average >= 85) return 'great-average';
    if (average >= 80) return 'good-average';
    if (average >= 70) return 'fair-average';
    if (average >= 60) return 'bad-average';
    return 'horrible-average';
  }

  toggleAllSections() {
    this.isCollapsed = !this.isCollapsed;
    const buttons = document.querySelectorAll('.collapse-button');
    const courseRows = document.querySelectorAll('tr[data-subject]');
    const toggleAllButton = document.getElementById('toggleAll');

    buttons.forEach(button => button.textContent = this.isCollapsed ? '▶' : '▼');
    courseRows.forEach(row => row.style.display = this.isCollapsed ? 'none' : '');

    if (toggleAllButton) {
      toggleAllButton.textContent = this.isCollapsed ? 'Expand All' : 'Collapse All';
    }
  }
}