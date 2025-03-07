import pandas as pd
import glob
import os
import json
from collections import defaultdict

# Paths setup remains the same
root_folder = "course-data/pre-processed"
output_root = "instructor-data"
ubcv_folder = os.path.join(root_folder, "UBCV")
ubco_folder = os.path.join(root_folder, "UBCO")

# Load faculty data
with open("course-data/subjects-prereqs/UBCV-subjects.json") as f:
    vancouver_subjects = json.load(f)

with open("course-data/subjects-prereqs/UBCO-subjects.json") as f:
    okanagan_subjects = json.load(f)

grade_ranges = ['<50', '50-54', '55-59', '60-63', '64-67', '68-71', '72-75', '76-79', '80-84', '85-89', '90-100']

def get_faculty_for_subject(subject_code, subjects):
    subject_info = next((item for item in subjects if item["code"] == subject_code), None)
    if subject_info:
        return subject_info["faculty_school"], subject_info["title"]
    return "Unknown Faculty", subject_code

def combine_course_sections(sections):
    """
    Combines multiple sections of the same course.
    Parameters:
        sections: List of dictionaries containing section data
    Returns:
        Dictionary with combined statistics
    """
    total_students = sum(section['reported'] for section in sections)
    if total_students == 0:
        return None

    # Convert sections to strings before joining
    all_sections = sorted(set(str(section['section']) for section in sections))
    combined_sections = ", ".join(all_sections)

    # Initialize combined data
    combined = {
        "section": combined_sections,
        "reported": total_students,
        "title": sections[0]['title'],  # Use title from first section
    }

    # Calculate weighted average
    weighted_sum = sum(section['average'] * section['reported'] for section in sections)
    combined['average'] = round(weighted_sum / total_students, 2)

    # Calculate weighted median
    weighted_median_sum = sum(section['median'] * section['reported'] for section in sections)
    combined['median'] = round(weighted_median_sum / total_students, 2)

    # Calculate weighted percentiles
    weighted_p25_sum = sum(section['percentile25'] * section['reported'] for section in sections)
    weighted_p75_sum = sum(section['percentile75'] * section['reported'] for section in sections)
    combined['percentile25'] = round(weighted_p25_sum / total_students, 2)
    combined['percentile75'] = round(weighted_p75_sum / total_students, 2)

    # Take the maximum high and minimum low across all sections
    combined['high'] = max(section['high'] for section in sections)
    combined['low'] = min(section['low'] for section in sections)

    # Sum up the grade distributions
    for grade_range in grade_ranges:
        combined[grade_range] = sum(section[grade_range] for section in sections)

    return combined

def process_professor_data(df, subjects):
    df_expanded = df[df['Professor'].notnull()].copy()  # Only process rows with non-null Professor
    df_expanded = df_expanded.assign(Professor=df_expanded['Professor'].str.split(';')).explode('Professor')
    df_expanded['Professor'] = df_expanded['Professor'].str.strip()

    professors_data = {}

    # First, group by professor
    for professor in df_expanded['Professor'].unique():
        if professor not in professors_data:
            professors_data[professor] = {
                "name": professor,
                "faculties": set(),
                "courses": defaultdict(list)  # Use defaultdict to group course sections
            }

        # Get all rows for this professor
        prof_rows = df_expanded[df_expanded['Professor'] == professor]

        for _, row in prof_rows.iterrows():
            faculty, subject_title = get_faculty_for_subject(row['Subject'], subjects)
            professors_data[professor]["faculties"].add(faculty)

            course_code = f"{row['Subject']} {row['Course']}"

            # Create section data
            section_data = {
                "subject": subject_title,
                "code": course_code,
                "section": row['Section'],
                "title": row['Title'],
                "reported": int(row['Reported']),
                "average": float(row['Avg']),
                "median": float(row['Median']),
                "percentile25": float(row['Percentile (25)']),
                "percentile75": float(row['Percentile (75)']),
                "high": int(row['High']),
                "low": int(row['Low'])
            }

            # Add grade distribution
            for grade_range in grade_ranges:
                section_data[grade_range] = int(row[grade_range])

            # Add to the list of sections for this course
            professors_data[professor]["courses"][course_code].append(section_data)

    # Process the grouped data
    final_professors_data = []
    for professor, data in professors_data.items():
        # Combine sections for each course
        combined_courses = []
        for course_code, sections in data["courses"].items():
            combined = combine_course_sections(sections)
            if combined:
                combined["code"] = course_code
                combined["subject"] = sections[0]["subject"]  # Use subject from first section
                combined_courses.append(combined)

        # Calculate professor's overall statistics
        total_students = sum(course["reported"] for course in combined_courses)
        if total_students > 0:
            weighted_avg = sum(course["average"] * course["reported"] for course in combined_courses) / total_students

            prof_data = {
                "name": professor,
                "faculties": sorted(list(data["faculties"])),
                "courses": sorted(combined_courses, key=lambda x: x["code"]),
                "totalStudents": total_students,
                "overallAverage": round(weighted_avg, 2),
                "numberOfCourses": len(combined_courses)
            }
            final_professors_data.append(prof_data)

    return sorted(final_professors_data, key=lambda x: x["name"])

# Main processing loop remains the same
for campus_folder, subjects, campus_name in [
    (ubcv_folder, vancouver_subjects, "UBCV"),
    (ubco_folder, okanagan_subjects, "UBCO")
]:
    output_campus_folder = os.path.join(output_root, campus_name)
    os.makedirs(output_campus_folder, exist_ok=True)

    term_folders = [f.path for f in os.scandir(campus_folder) if f.is_dir()]

    for term_folder in term_folders:
        term_name = os.path.basename(term_folder)
        output_file = os.path.join(output_campus_folder, f"{term_name}.json")

        csv_files = glob.glob(f"{term_folder}/*.csv")
        all_data = []

        for file in csv_files:
            try:
                df = pd.read_csv(file)
                df.columns = df.columns.str.strip()

                # Initialize missing columns with 0
                for col in ['Reported', 'Avg', 'Median', 'Percentile (25)', 'Percentile (75)', 'High', 'Low'] + grade_ranges:
                    if col not in df.columns:
                        df[col] = 0
                    df[col] = df[col].fillna(0)

                all_data.append(df)
            except Exception as e:
                print(f"Error processing file {file}: {str(e)}")

        if all_data:
            combined_df = pd.concat(all_data, ignore_index=True)
            professors_data = process_professor_data(combined_df, subjects)

            with open(output_file, 'w') as f:
                json.dump(professors_data, f, indent=4)
            print(f"Processed {term_name} for {campus_name}")
        else:
            print(f"No data found for {term_name} in {campus_name}")

print("Professor data processing completed successfully.")