import { dataService } from './dataService.js';

class InsightsManager {
    constructor() {
        this.initialize();
    }

    async initialize() {
        // Set up event listeners
        document.getElementById('sessionSelect')?.addEventListener('change', () => this.loadData());
        document.getElementById('campusToggle')?.addEventListener('change', () => this.loadData());

        // Initial data load
        await this.loadData();
    }

    getCampusName() {
        return document.getElementById('campusToggle')?.checked ? 'UBCO' : 'UBCV';
    }

    getSession() {
        return document.getElementById('sessionSelect')?.value || '2023W';
    }

    async loadData() {
        const campus = document.getElementById('campusToggle')?.checked ? 'o' : 'v';
        const session = this.getSession();
        
        try {
            dataService.setSession(session);
            const courses = await dataService.loadCourseData(campus);
            this.displayInsights(courses);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    formatAverageWithColor(average) {
        let color;
        if (average >= 90) color = '#4361ee';      // excellent
        else if (average >= 85) color = '#009c1f';  // great
        else if (average >= 80) color = '#79ff00';  // good
        else if (average >= 70) color = '#ffef00';  // fair
        else if (average >= 60) color = '#f0883e';  // bad
        else color = '#f85149';                     // horrible
        
        return `<span style="color: ${color}; font-family: 'JetBrains Mono', monospace;">${average.toFixed(2)}%</span>`;
    }

    displayInsights(courses) {
        const stats = this.calculateStats(courses);
        const container = document.getElementById('statsContent');
        const campusName = this.getCampusName();
        const session = this.getSession();
        
        // Store current controls state
        const currentToggleState = document.getElementById('campusToggle')?.checked;
        const currentSession = document.getElementById('sessionSelect')?.value;
        
        // Update stats and faculty section only
        const statsAndFaculty = document.createElement('div');
        statsAndFaculty.innerHTML = `
            <div class="stats-grid">
                ${this.createStatCard('Highest Average Course', stats.highestAvg.course, this.formatAverageWithColor(stats.highestAvg.value))}
                ${this.createStatCard('Lowest Average Course', stats.lowestAvg.course, this.formatAverageWithColor(stats.lowestAvg.value))}
                ${this.createStatCard('Most Enrolled Course', stats.mostEnrolled.course, stats.mostEnrolled.value + ' Students')}
                ${this.createStatCard('Overall Average', `Average of every ${campusName} course during ${session}`, this.formatAverageWithColor(stats.overallAvg))}
                ${this.createStatCard('Total Courses', `Total number of courses offered at ${campusName} during ${session}`, stats.totalCourses)}
                ${this.createStatCard('Total Enrollments', `Total course enrollments by ${campusName} students during ${session}`, stats.totalStudents.toLocaleString())}
            </div>

            <div class="insights-sections">
                ${this.createFacultySection(stats.facultyStats)}
            </div>
        `;

        // Update only the content after the controls
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <div class="campus-toggle">
                    <span class="toggle-label">UBC-V</span>
                    <label class="switch">
                        <input type="checkbox" id="campusToggle">
                        <span class="slider round"></span>
                    </label>
                    <span class="toggle-label">UBC-O</span>
                </div>
                <select id="sessionSelect" class="filter-select">
                    <option value="2023W">2023W</option>
                    <option value="2023S">2023S</option>
                    <option value="2022W">2022W</option>
                    <option value="2022S">2022S</option>
                    <option value="2021W">2021W</option>
                    <option value="2021S">2021S</option>
                </select>
            </div>
        `;
        container.appendChild(statsAndFaculty);

        // Restore control states and reattach listeners
        const toggleInput = document.getElementById('campusToggle');
        const sessionSelect = document.getElementById('sessionSelect');
        
        if (toggleInput) {
            toggleInput.checked = currentToggleState ?? (this.getCampusName() === 'UBCO');
            toggleInput.addEventListener('change', () => this.loadData());
        }
        
        if (sessionSelect) {
            sessionSelect.value = currentSession ?? session;
            sessionSelect.addEventListener('change', () => this.loadData());
        }

        // Add event listener for faculty sorting
        document.getElementById('facultySortSelect')?.addEventListener('change', (e) => {
            this.updateFacultyTable(stats.facultyStats, e.target.value);
        });
    }

    calculateStats(courses) {
        const validCourses = courses.filter(c => c.Average > 0 && c.Reported > 0);
        
        const stats = {
          highestAvg: {
            course: '',
            value: 0
          },
          lowestAvg: {
            course: '',
            value: 100
          },
          mostEnrolled: {
            course: '',
            value: 0
          },
          overallAvg: 0,
          totalCourses: validCourses.length,
          totalStudents: 0,
          facultyStats: {}
        };
    
        let totalWeightedAvg = 0;
        validCourses.forEach(course => {
          // Update highest/lowest averages
          if (course.Average > stats.highestAvg.value) {
            stats.highestAvg = {
              course: `${course.Code} - ${course.Name}`,
              value: course.Average
            };
          }
          if (course.Average < stats.lowestAvg.value) {
            stats.lowestAvg = {
              course: `${course.Code} - ${course.Name}`,
              value: course.Average
            };
          }
    
          // Update most enrolled
          if (course.Reported > stats.mostEnrolled.value) {
            stats.mostEnrolled = {
              course: `${course.Code} - ${course.Name}`,
              value: course.Reported
            };
          }
    
          // Update totals
          totalWeightedAvg += course.Average * course.Reported;
          stats.totalStudents += course.Reported;
    
          // Get base faculty name without honorary science suffix
          const baseFaculty = this.getBaseFaculty(course.Faculty);
    
          // Update faculty stats using base faculty name
          if (!stats.facultyStats[baseFaculty]) {
            stats.facultyStats[baseFaculty] = {
              totalCourses: 0,
              totalStudents: 0,
              averageGrade: 0,
              weightedTotal: 0
            };
          }
          stats.facultyStats[baseFaculty].totalCourses++;
          stats.facultyStats[baseFaculty].totalStudents += course.Reported;
          stats.facultyStats[baseFaculty].weightedTotal += course.Average * course.Reported;
        });
    
        // Calculate overall average
        stats.overallAvg = totalWeightedAvg / stats.totalStudents;
    
        // Calculate faculty averages
        Object.keys(stats.facultyStats).forEach(faculty => {
          stats.facultyStats[faculty].averageGrade = 
            stats.facultyStats[faculty].weightedTotal / stats.facultyStats[faculty].totalStudents;
        });
    
        return stats;
      }

    createStatCard(title, subtitle, value) {
        return `
            <div class="stat-card">
                <h3>${title}</h3>
                <p class="stat-value">${value}</p>
                <p class="stat-subtitle">${subtitle}</p>
            </div>
        `;
    }

    sortFacultyStats(stats, sortBy) {
        return Object.entries(stats).sort((a, b) => {
            const [facultyA, dataA] = a;
            const [facultyB, dataB] = b;
    
            switch (sortBy) {
                case 'courses-desc':
                    return dataB.totalCourses - dataA.totalCourses;
                case 'courses-asc':
                    return dataA.totalCourses - dataB.totalCourses;
                case 'average-desc':
                    return dataB.averageGrade - dataA.averageGrade;
                case 'average-asc':
                    return dataA.averageGrade - dataB.averageGrade;
                default:
                    return dataB.totalStudents - dataA.totalStudents;
            }
        });
    }

    getBaseFaculty(faculty) {
        return faculty.replace(" (Honorary Science Credit)", "");
      }

    updateFacultyTable(stats, sortBy) {
        const tableBody = document.getElementById('facultyTableBody');
        if (!tableBody) return;

        const sortedStats = this.sortFacultyStats(stats, sortBy);
        tableBody.innerHTML = sortedStats.map(([faculty, stats]) => `
            <tr>
                <td>${faculty}</td>
                <td>${stats.totalCourses}</td>
                <td>${stats.totalStudents.toLocaleString()}</td>
                <td>${this.formatAverageWithColor(stats.averageGrade)}</td>
            </tr>
        `).join('');
    }

    createFacultySection(facultyStats) {
        return `
            <div class="insights-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Faculty Statistics</h3>
                    <div class="faculty-filters">
                        <select id="facultySortSelect" class="filter-select">
                            <option value="courses-desc">Sort by Enrollments ↓</option>
                            <option value="courses-asc">Sort by Enrollments ↑</option>
                            <option value="average-desc">Sort by Average ↓</option>
                            <option value="average-asc">Sort by Average ↑</option>
                        </select>
                    </div>
                </div>
                <div class="table-wrapper">
                    <table class="insights-table">
                        <thead>
                            <tr>
                                <th>Faculty</th>
                                <th>Courses</th>
                                <th>Course Enrollments</th>
                                <th>Average</th>
                            </tr>
                        </thead>
                        <tbody id="facultyTableBody">
                            ${this.sortFacultyStats(facultyStats, 'students-desc').map(([faculty, stats]) => `
                                <tr>
                                    <td>${faculty}</td>
                                    <td>${stats.totalCourses}</td>
                                    <td>${stats.totalStudents.toLocaleString()}</td>
                                    <td>${this.formatAverageWithColor(stats.averageGrade)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}

new InsightsManager();