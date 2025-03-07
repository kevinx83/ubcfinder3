import { dataService } from './dataService.js';

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Gets the course level from a course code
 * @param {string} courseCode - Course code to analyze
 * @returns {number|null} Course level or null if not found
 */
export function getCourseLevel(courseCode) {
  const match = courseCode.match(/\d{3}/);
  return match ? Math.floor(parseInt(match[0]) / 100) * 100 : null;
}

/**
 * Updates the total courses count in the UI
 * @param {Array} courses - Array of currently filtered courses
 */
export function updateTotalCourses(courses) {
  const totalCourses = document.getElementById('totalCourses');
  if (!totalCourses) return;

  // If courses array is provided and valid, use its length
  if (Array.isArray(courses)) {
    totalCourses.textContent = courses.length;
  } else {
    // Fallback to total count if something went wrong
    totalCourses.textContent = dataService.getTotalCount();
  }
}