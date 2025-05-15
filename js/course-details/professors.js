export class ProfessorsManager {
    constructor() {
        this.professorsContent = document.getElementById('professorsContent');
        this.instructorData = null;
        this.sortOption = 'average-desc'; // Default sort option
    }

    async update(professors, courseCode) {
        if (!this.professorsContent) {
            console.error('professorsContent element not found');
            return;
        }

        if (!professors || professors.length === 0) {
            this.professorsContent.innerHTML = '<tr><td colspan="3">No professor information available</td></tr>';
            return;
        }

        try {
            // Get current campus and session from URL
            const urlParams = new URLSearchParams(window.location.search);
            const campus = urlParams.get('campus') || 'v';
            const session = document.getElementById('sessionSelect')?.value || '2023W';
            
            const campusName = campus.toLowerCase() === 'v' ? 'UBCV' : 'UBCO';
            const response = await fetch(`/data/instructor-data/${campusName}/${session}.json`);
            const instructorData = await response.json();
            this.instructorData = instructorData;

            // Find all professors who teach this course
            let courseProfessors = [];
            for (const instructor of instructorData) {
                // Look for this course in the instructor's courses
                const courseEntry = instructor.courses.find(course => course.code === courseCode);
                if (courseEntry) {
                    courseProfessors.push({
                        name: instructor.name,
                        courseData: courseEntry
                    });
                }
            }

            // Sort the professors based on current sort option
            this.sortProfessors(courseProfessors);

            // Clear current content
            this.professorsContent.innerHTML = '';

            // Add each professor row directly
            courseProfessors.forEach(prof => {
                const avgClass = this.getAverageClass(prof.courseData.average);
                const searchUrl = `https://www.ratemyprofessors.com/search/professors?q=${encodeURIComponent(prof.name)}`;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <a href="${searchUrl}" 
                           class="course-link" 
                           target="_blank" 
                           rel="noopener noreferrer">${prof.name}</a>
                    </td>
                    <td>
                        <button class="view-grades-btn" 
                                data-professor="${prof.name}"
                                data-course="${courseCode}">🔍</button>
                    </td>
                    <td class="${avgClass} monospace">
                        ${prof.courseData.average.toFixed(2)}
                    </td>
                `;
                
                this.professorsContent.appendChild(row);
            });

            // Add event listeners for view grades buttons
            const viewGradesButtons = document.querySelectorAll('.view-grades-btn');
            viewGradesButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const profName = e.target.dataset.professor;
                    const courseCode = e.target.dataset.course;
                    this.showProfessorGrades(profName, courseCode);
                });
            });

        } catch (error) {
            console.error('Error loading instructor data:', error);
            this.professorsContent.innerHTML = '<tr><td colspan="3">Error loading professor information</td></tr>';
        }
    }

    // Rest of methods remain the same
    sortProfessors(professors) {
        switch (this.sortOption) {
            case 'average-desc':
                professors.sort((a, b) => b.courseData.average - a.courseData.average);
                break;
            case 'average-asc':
                professors.sort((a, b) => a.courseData.average - b.courseData.average);
                break;
            case 'name-asc':
                professors.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                professors.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }
        return professors;
    }

    showProfessorGrades(profName, courseCode) {
        const prof = this.instructorData.find(p => p.name === profName);
        const courseData = prof?.courses.find(c => c.code === courseCode);
        
        if (courseData) {
            const gradeDistribution = {
                Average: courseData.average,
                Reported: courseData.reported,
                WeightedMedian: courseData.median,
                High: courseData.high,
                Low: courseData.low,
                '<50': courseData['<50'] || 0,
                '50-54': courseData['50-54'] || 0,
                '55-59': courseData['55-59'] || 0,
                '60-63': courseData['60-63'] || 0,
                '64-67': courseData['64-67'] || 0,
                '68-71': courseData['68-71'] || 0,
                '72-75': courseData['72-75'] || 0,
                '76-79': courseData['76-79'] || 0,
                '80-84': courseData['80-84'] || 0,
                '85-89': courseData['85-89'] || 0,
                '90-100': courseData['90-100'] || 0
            };

            const gradesManager = window.app?.gradesManager;
            if (gradesManager) {
                gradesManager.update(gradeDistribution, profName);
            }
        }
    }

    getAverageClass(average) {
        if (!average) return '';
        if (average >= 90) return 'excellent-average';
        if (average >= 85) return 'great-average';
        if (average >= 80) return 'good-average';
        if (average >= 70) return 'fair-average';
        if (average >= 60) return 'bad-average';
        return 'horrible-average';
    }
}