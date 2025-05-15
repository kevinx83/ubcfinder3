export class FilterManager {
  constructor(onFilterChange) {
    this.onFilterChange = onFilterChange;
    this.setupFilterListeners();
    this.setupMoreFiltersToggle();
  }

  setupMoreFiltersToggle() {
    const showMoreBtn = document.getElementById('showMoreFilters');
    const collapsibleFilters = document.getElementById('collapsibleFilters');

    if (showMoreBtn && collapsibleFilters) {
      showMoreBtn.addEventListener('click', () => {
        collapsibleFilters.classList.toggle('expanded');
        showMoreBtn.textContent = collapsibleFilters.classList.contains('expanded')
          ? 'Show Less Filters'
          : 'Show More Filters';
      });
    }
  }

  setupFilterListeners() {
    const filterContainers = [
      'facultyFilters',
      'yearLevelFilters',
      'averageFilters',
      'studentFilters',
      'creditFilters'
    ];

    filterContainers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.addEventListener('change', (e) => {
          const target = e.target;
          const container = target.closest('.filter-options');
          const selectAllCheckbox = container.querySelector('input[id*="selectAll"]');
          const regularCheckboxes = container.querySelectorAll('input[type="checkbox"]:not([id*="selectAll"])');

          if (target.id.includes('selectAll')) {
            regularCheckboxes.forEach(checkbox => checkbox.checked = target.checked);
          } else {
            const checkedCount = Array.from(regularCheckboxes).filter(cb => cb.checked).length;
            selectAllCheckbox.checked = checkedCount === regularCheckboxes.length;
            if (checkedCount === 0) {
              selectAllCheckbox.checked = false;
            }
          }

          this.onFilterChange();
        });
      }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.onFilterChange());
    }
  }

  getSelectedFilters() {
    return {
      faculties: this.getSelectedValues('facultyFilters'),
      yearLevels: this.getSelectedValues('yearLevelFilters').map(Number),
      averageRanges: this.getSelectedValues('averageFilters').map(Number),
      studentRanges: this.getSelectedValues('studentFilters').map(Number),
      credits: this.getSelectedValues('creditFilters').map(Number),
      searchTerm: document.getElementById('searchInput')?.value || ''
    };
  }

  getSelectedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];

    const checkboxes = container.querySelectorAll('input[type="checkbox"]:not([id*="selectAll"])');
    const selectAll = container.querySelector('input[id*="selectAll"]');

    // If Select All is checked, return empty array (indicating all selected)
    if (selectAll && selectAll.checked) {
      return [];
    }

    // Otherwise, return array of checked values
    const selectedValues = Array.from(checkboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);

    // If no checkboxes are selected and Select All is unchecked,
    // return a special value that will match no courses
    if (selectedValues.length === 0 && !selectAll.checked) {
      return ['NO_MATCHES'];
    }

    return selectedValues;
  }

  clearFilters() {
    const containers = [
      'facultyFilters',
      'yearLevelFilters',
      'averageFilters',
      'studentFilters',
      'creditFilters'
    ];
    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = '';
      }
    });
  }

  createFilterOptions(containerId, options, selectAllId) {
    const container = document.createElement('div');
    container.className = 'filter-options';

    container.innerHTML = `
      <label class="filter-option">
        <input type="checkbox" id="${selectAllId}" checked>
        <span>Select All</span>
      </label>
      ${options.map(option => `
        <label class="filter-option">
          <input type="checkbox" value="${option.value}" checked>
          <span>${option.label}</span>
        </label>
      `).join('')}
    `;

    const filterContainer = document.getElementById(containerId);
    if (filterContainer) {
      filterContainer.innerHTML = '';
      filterContainer.appendChild(container);
    }
  }

  initializeFacultyFilter(courses) {
  // Count courses per faculty with a map of original name to [shortName, count]
  const facultyData = new Map();
  
  courses.forEach(course => {
    const baseFaculty = this.getBaseFaculty(course.Faculty);
    // First, remove "Faculty of " prefix
    let shortName = baseFaculty.replace("Faculty of ", "");
    
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
    
    if (facultyData.has(baseFaculty)) {
      facultyData.get(baseFaculty).count++;
    } else {
      facultyData.set(baseFaculty, { shortName, count: 1 });
    }
  });
  
  // Handle Faculty of Science specially if it's missing
  if (!facultyData.has("Faculty of Science")) {
    facultyData.set("Faculty of Science", { shortName: "Science", count: 0 });
  }
  
  // Convert to array and sort by course count (descending)
  const sortedFaculties = Array.from(facultyData.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([originalName, data]) => ({
      value: originalName, // Keep original name as value for filtering
      label: data.shortName // Display shortened name without course count
    }));
  
  this.createFilterOptions('facultyFilters', sortedFaculties, 'selectAllFaculties');
}

  initializeYearLevelFilter() {
    const yearLevels = [
      { value: "100", label: "100s" },
      { value: "200", label: "200s" },
      { value: "300", label: "300s" },
      { value: "400", label: "400s" },
      { value: "500", label: "500s" },
      { value: "600", label: "600s" }
    ];
    this.createFilterOptions('yearLevelFilters', yearLevels, 'selectAllYears');
  }

  initializeAverageFilter() {
    const averageRanges = [
      { value: "90", label: ">90" },
      { value: "85", label: "85-89" },
      { value: "80", label: "80-84" },
      { value: "70", label: "70-79" },
      { value: "60", label: "60-69" },
      { value: "0", label: "<60" }
    ];
    this.createFilterOptions('averageFilters', averageRanges, 'selectAllAverages');
  }

  initializeStudentFilter() {
    const studentRanges = [
      { value: "800", label: ">800" },
      { value: "400", label: "400-799" },
      { value: "100", label: "100-399" },
      { value: "50", label: "50-99" },
      { value: "0", label: "<50" }
    ];
    this.createFilterOptions('studentFilters', studentRanges, 'selectAllStudents');
  }

  initializeCreditFilter() {
    const creditRanges = [
      { value: "4", label: "4 credits" },
      { value: "3", label: "3 credits" },
      { value: "2", label: "2 credits" },
      { value: "1", label: "1 credit" },
      { value: "0", label: "Unknown" }
    ];
    this.createFilterOptions('creditFilters', creditRanges, 'selectAllCredits');
  }

  initializeProfessorFilters(professors) {
    // Clear existing filters first
    this.clearFilters();

    // Initialize faculty filters
    const faculties = [...new Set(professors.flatMap(prof => prof.faculties))].sort();
    this.createFilterOptions('facultyFilters',
      faculties.map(faculty => ({ value: faculty, label: faculty })),
      'selectAllFaculties'
    );

    // Initialize year level filters
    this.initializeYearLevelFilter();

    // Initialize average range filters
    this.createFilterOptions('averageFilters', [
      { value: "90", label: ">90%" },
      { value: "85", label: "85-89%" },
      { value: "80", label: "80-84%" },
      { value: "70", label: "70-79%" },
      { value: "60", label: "60-69%" },
      { value: "0", label: "<60%" }
    ], 'selectAllAverages');
  }

  getBaseFaculty(faculty) {
    return faculty.replace(" (Honorary Science Credit)", "");
  }
}