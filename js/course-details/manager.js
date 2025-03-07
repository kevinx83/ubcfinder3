import { GradesManager } from './grades.js';
import { PrerequisitesManager } from './prerequisites.js';
import { ProfessorsManager } from './professors.js';
import { dataService } from '../dataService.js';

export class CourseDetails {
  constructor() {
    this.prereqsManager = new PrerequisitesManager();
    this.gradesManager = new GradesManager();
    this.professorsManager = new ProfessorsManager();
    // Make the GradesManager instance accessible globally
    window.app = {
      gradesManager: this.gradesManager
    };
    this.initialize();
  }

  async initialize() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get('code');
    const campus = urlParams.get('campus');
    const session = urlParams.get('session') || '2023W';

    if (!courseCode || !campus) {
      this.showNotFound();
      return;
    }

    try {
      // Set initial session
      const sessionSelect = document.getElementById('sessionSelect');
      sessionSelect.value = session;
      dataService.setSession(session);

      // Load course data for current session
      const courses = await dataService.loadCourseData(campus);
      const course = courses.find(c => c.Code === courseCode);

      if (!course) {
        this.showNotFound();
        return;
      }

      // Load course prerequisite data
      const response = await fetch('course-data/subjects-prereqs/course-prereqs.json', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const prereqsData = await response.json();
      const coursePrereqs = prereqsData.find(c => c.code === courseCode);

      // Update header info
      this.updateHeaderInfo(course, coursePrereqs);

      // Update prerequisites
      this.prereqsManager.update(coursePrereqs);

      // Update grades and professors based on current session data
      this.gradesManager.update(course);
      this.professorsManager.update(course.Professors, course.Code); // Pass the course code here

      // Add session change handler
      sessionSelect.addEventListener('change', async (e) => {
        try {
          const newSession = e.target.value;
          console.log('Session changed to:', newSession);

          // Update URL when session changes
          urlParams.set('session', newSession);
          history.replaceState(null, '', `?${urlParams.toString()}`);
          console.log('URL updated');

          // Update course data for new session
          dataService.setSession(newSession);
          console.log('Fetching new course data...');
          const newCourses = await dataService.loadCourseData(campus);
          console.log('Courses loaded:', newCourses.length);
          const updatedCourse = newCourses.find(c => c.Code === courseCode);
          console.log('Course found:', !!updatedCourse);

          // Update UI
          this.gradesManager.update(updatedCourse);
          this.professorsManager.update(updatedCourse ? updatedCourse.Professors : [], courseCode); // Pass the course code here too
          console.log('UI updated');
        } catch (error) {
          console.error('Error during session change:', error);
          // Try to update UI even if there's an error
          this.gradesManager.update(null);
          this.professorsManager.update([], courseCode); // Keep passing the course code
        }
      });
    } catch (error) {
      console.error('Error loading course details:', error);
      this.showNotFound();
    }
  }

  updateHeaderInfo(course, coursePrereqs) {
    document.getElementById('courseCode').textContent = course.Code;
    document.getElementById('courseName').textContent = course.Name;
    document.title = `${course.Code} - UBCFinder`;

    const descriptionElement = document.getElementById('courseDescription');
    const subjectElement = document.getElementById('courseSubject');
    const credFacElement = document.getElementById('credFacElement');

    subjectElement.textContent = `Subject: ${course.Subject}`;

    if (coursePrereqs) {
      descriptionElement.textContent = coursePrereqs.desc || 'No description available';
      credFacElement.textContent = `Credits: ${coursePrereqs.cred || 'Data unavailable.'} - ${course.Faculty}`;
    } else {
      descriptionElement.textContent = 'No description available';
      credFacElement.textContent = `Credits: No information available - ${course.Faculty}`;
    }
  }

  showNotFound() {
    document.querySelector('.back-button')?.remove();
    document.querySelector('.course-header')?.remove();
    document.querySelector('.course-details-container')?.remove();

    const mainContent = document.createElement('div');
    mainContent.innerHTML = `
      <div class="not-found-container">
        <div class="not-found-card">
          <div class="not-found-404">404</div>
          <h2 class="not-found-title">Data Not Available</h2>
          <p class="not-found-message">
            The data for this course is currently unavailable.<br>
          </p>
          <a href="index.html" class="not-found-button">
            ← Back to Course List
          </a>
        </div>
      </div>
    `;

    document.querySelector('.header-container').after(mainContent);
  }
}

new CourseDetails();