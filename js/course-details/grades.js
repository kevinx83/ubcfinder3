export class GradesManager {
    constructor() {
        this.gradesContent = document.querySelector('#gradesContent');
        if (!this.gradesContent) {
            console.error('gradesContent element is missing from the DOM');
            return;
        }

        this.urlParams = new URLSearchParams(window.location.search);
        this.currentSession = this.urlParams.get('session') || '2023W';
        
        // Define grade ranges for distribution
        this.gradeRanges = [
            { range: '< 50', key: '<50' },
            { range: '50-54', key: '50-54' },
            { range: '55-59', key: '55-59' },
            { range: '60-63', key: '60-63' },
            { range: '64-67', key: '64-67' },
            { range: '68-71', key: '68-71' },
            { range: '72-75', key: '72-75' },
            { range: '76-79', key: '76-79' },
            { range: '80-84', key: '80-84' },
            { range: '85-89', key: '85-89' },
            { range: '90-100', key: '90-100' }
        ];
    }

    update(course, viewMode = 'overall') {
        if (!course) {
            this.showNoCourseMessage();
            return;
        }

        // Create header with viewing status and properly styled reset button
        const viewingText = viewMode === 'overall' 
            ? '<span style="color: #e9e9e9;">Viewing overall data</span>' 
            : `<span style="color: #e9e9e9;">Viewing data for: ${viewMode}</span> <button id="viewOverallBtn" class="view-grades-btn" style="margin-left: 8px;">View Overall</button>`;

        // Create the stats section with summary data and distribution
        this.gradesContent.innerHTML = `
            <h3>Course Grades <span style="float: right; font-size: 0.9em; font-weight: normal;">${viewingText}</span></h3>
            ${this.createStatsSection(course)}
            ${this.createDistributionSection(course)}
        `;

        // Add event listener for the View Overall button if it exists
        const viewOverallBtn = document.getElementById('viewOverallBtn');
        if (viewOverallBtn) {
            viewOverallBtn.addEventListener('click', () => {
                // Reset to overall view by reloading the page with current parameters
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const campus = urlParams.get('campus');
                const session = document.getElementById('sessionSelect')?.value;
                window.location.href = `/course-details.html?code=${code}&campus=${campus}&session=${session}`;
            });
        }
    }

    showNoCourseMessage() {
        const courseCode = this.urlParams.get('code');
        const currentSession = document.getElementById('sessionSelect').value;
        
        this.gradesContent.innerHTML = `
            <h3>Course Grades</h3>
            <p style="text-align: center; color: #8b949e; padding: 40px 0; font-size: 0.95rem;">
                ${courseCode} was not offered in this session.
            </p>
        `;
    }

    createStatsSection(course) {
        const stats = [
            { label: 'Average', value: course.Average, format: 'average', color: this.getAverageColor(course.Average) },
            { label: 'Enrolled', value: course.Reported, format: 'enrolled', color: '#e9e9e9' },
            { label: 'Weighted Median', value: course.WeightedMedian, format: 'median', color: this.getAverageColor(course.WeightedMedian) },
            { label: 'High', value: course.High, format: 'percent', color: '#e9e9e9' },
            { label: 'Low', value: course.Low, format: 'percent', color: '#e9e9e9' }
        ];

        return `
            <div class="grades-header">
                <div class="stats-grid">
                    ${stats.map(stat => this.createStatsBox(stat)).join('')}
                </div>
            </div>
        `;
    }

    createStatsBox({ label, value, format, color }) {
        const formattedValue = this.formatValue(value, format);
        return `
            <div class="stats-box">
                <h4>${label}</h4>
                <p style="font-size: 1.3em; color: ${color}; font-family: 'JetBrains Mono', monospace;">
                    ${formattedValue}
                </p>
            </div>
        `;
    }

    formatValue(value, format) {
        switch (format) {
            case 'average':
            case 'median':
                return value.toFixed(1) + '%';
            case 'enrolled':
                return Math.round(value).toString();
            case 'percent':
                return Math.round(value) + '%';
            default:
                return value.toString();
        }
    }

    createDistributionSection(course) {
        return `
            <div class="section">
                <h4>Grade Distribution</h4>
                <div class="grade-distribution">
                    ${this.createDistributionBars(course)}
                </div>
            </div>
        `;
    }

    createDistributionBars(course) {
        // Calculate total students and find maximum count for scaling
        const counts = this.gradeRanges.map(grade => course[grade.key] || 0);
        const total = counts.reduce((sum, count) => sum + count, 0);
        const maxCount = Math.max(...counts);

        if (total === 0) {
            return '<p>No distribution data available.</p>';
        }

        return `
            <div class="distribution-bars">
                ${this.gradeRanges.map((grade, index) => {
                    const count = course[grade.key] || 0;
                    const height = maxCount > 0 ? (count / maxCount * 100) : 0;
                    const percentage = (count / total * 100);
                    return `
                        <div class="bar-group">
                            <div class="bar-container">
                                <div class="bar" 
                                     style="height: ${height}%; 
                                            background-color: ${this.getBarColor(percentage)};">
                                    <span class="bar-tooltip">${count} students</span>
                                </div>
                            </div>
                            <div class="bar-label">${grade.range}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    getBarColor(percentage) {
        if (percentage >= 25) return '#4361ee';
        if (percentage >= 15) return '#4355ee';
        if (percentage >= 10) return '#4348ee';
        return '#433bee';
    }

    getAverageColor(average) {
        if (average >= 90) return '#4361ee';
        if (average >= 85) return '#009c1f';
        if (average >= 80) return '#79ff00';
        if (average >= 70) return '#ffef00';
        if (average >= 60) return '#f0883e';
        return '#f85149';
    }
}