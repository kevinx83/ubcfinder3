class DataService {
  constructor() {
    this.allCourses = [];
    this.sessionData = {};
    this.currentSession = '2023W';
  }

  async loadCourseData(campus) {
    try {
      const cacheKey = `${campus}_${this.currentSession}`;
      console.log('Loading data for:', cacheKey);

      if (this.sessionData[cacheKey]) {
        console.log('Returning cached data');
        this.allCourses = this.sessionData[cacheKey];
        return this.allCourses;
      }

      console.log('Fetching from server...');
      const courseResponse = await fetch(`/course-data/post-processed/UBC${campus.toUpperCase()}/${this.currentSession}.json`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!courseResponse.ok) {
        throw new Error(`HTTP error! status: ${courseResponse.status}`);
      }
      const courseData = await courseResponse.json();
      console.log('Data fetched successfully');

      // Load prerequisites data
      const prereqResponse = await fetch('/course-data/subjects-prereqs/course-prereqs.json', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!prereqResponse.ok) {
        throw new Error(`HTTP error! status: ${prereqResponse.status}`);
      }
      const prereqData = await prereqResponse.json();

      // Merge credit information into course data
      const mergedData = courseData.map(course => {
        const prereqInfo = prereqData.find(p => p.code === course.Code);
        return {
          ...course,
          Credits: prereqInfo && prereqInfo.cred ? parseInt(prereqInfo.cred) : 0
        };
      });

      this.sessionData[cacheKey] = mergedData;
      this.allCourses = mergedData;
      return mergedData;
    } catch (error) {
      console.error(`Error loading data for session ${this.currentSession}:`, error);
      const cacheKey = `${campus}_${this.currentSession}`;
      if (this.sessionData[cacheKey]) {
        return this.sessionData[cacheKey];
      }
      throw error;
    }
  }

  setSession(session) {
    this.currentSession = session;
  }

  filterCourses(filters) {
    const { faculties, yearLevels, averageRanges, studentRanges, credits, searchTerm } = filters;

    return this.allCourses.filter(course => {
      // Search Filter
      if (searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase();
        const normalizedCode = course.Code.toLowerCase();
        const normalizedSubject = course.Subject.toLowerCase();
        const normalizedName = course.Name.toLowerCase();
        const noSpaceSearch = normalizedSearch.replace(/\s+/g, '');
        const noSpaceCode = normalizedCode.replace(/\s+/g, '');

        if (!normalizedCode.includes(normalizedSearch) &&
          !noSpaceCode.includes(noSpaceSearch) &&
          !normalizedSubject.includes(normalizedSearch) &&
          !normalizedName.includes(normalizedSearch)) {
          return false;  // No match found in code, subject, or name
        }
      }

      // Faculty Filter - Modified to handle honorary science credit
      if (faculties.length > 0) {
        const baseFaculty = this.getBaseFaculty(course.Faculty);
        const hasHonorary = this.hasHonoraryScience(course.Faculty);
        
        // Special case: If Science is selected, also show honorary science courses
        const showAsScience = hasHonorary && faculties.includes("Faculty of Science");
        
        // Include if either base faculty is selected OR it has honorary science and Science is selected
        if (!faculties.includes(baseFaculty) && !showAsScience) {
          return false;
        }
      }

      // Year Level Filter
      if (yearLevels.length > 0) {
        const courseLevel = this.getCourseLevel(course.Code);
        if (!courseLevel || !yearLevels.includes(courseLevel)) {
          return false;
        }
      }

      // Average Filter
      if (averageRanges.length > 0) {
        const avg = course.Average;
        const matchesAverage = averageRanges.some(range => {
          if (range === 90) return avg >= 90;
          if (range === 85) return avg >= 85 && avg < 90;
          if (range === 80) return avg >= 80 && avg < 85;
          if (range === 70) return avg >= 70 && avg < 80;
          if (range === 60) return avg >= 60 && avg < 70;
          if (range === 0) return avg < 60;
          return false;
        });
        if (!matchesAverage) return false;
      }

      // Student Count Filter
      if (studentRanges.length > 0) {
        const students = course.Reported;
        const matchesStudents = studentRanges.some(range => {
          if (range === 800) return students >= 800;
          if (range === 400) return students >= 400 && students < 800;
          if (range === 100) return students >= 100 && students < 400;
          if (range === 50) return students >= 50 && students < 100;
          if (range === 0) return students < 50;
          return false;
        });
        if (!matchesStudents) return false;
      }

      // Credits Filter
      if (credits.length > 0) {
        const matchesCredits = credits.some(credit => {
          if (credit === 0) return !course.Credits || course.Credits === 0;
          return course.Credits === credit;
        });
        if (!matchesCredits) return false;
      }

      return true;
    });
  }

  getCourseLevel(courseCode) {
    const match = courseCode.match(/\d{3}/);
    return match ? Math.floor(parseInt(match[0]) / 100) * 100 : null;
  }

  sortCourses(courses, sortBy) {
    return [...courses].sort((a, b) => {
      switch (sortBy) {
        case 'average':
          return b.Average - a.Average;
        case 'average-asc':
          return a.Average - b.Average;
        case 'students':
          return b.Reported - a.Reported;
        case 'students-asc':
          return a.Reported - b.Reported;
        case 'code':
          return a.Code.localeCompare(b.Code);
        default:
          return 0;
      }
    });
  }

  clearCache() {
    this.sessionData = {};
    this.allCourses = [];
  }

  getTotalCount() {
    return this.allCourses.length;
  }



  // Helper function to get base faculty name without honorary science suffix
  getBaseFaculty(faculty) {
    return faculty.replace(" (Honorary Science Credit)", "");
  }

  // Helper function to check if a course has honorary science credit
  hasHonoraryScience(faculty) {
    return faculty.includes("(Honorary Science Credit)");
  }
}

export const dataService = new DataService();