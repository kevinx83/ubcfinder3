import pandas as pd
import glob
import os
import json
import re

# Paths
root_folder = "course-data/pre-processed"
output_root = "course-data/post-processed"
ubcv_folder = os.path.join(root_folder, "UBCV")
ubco_folder = os.path.join(root_folder, "UBCO")

# Load faculty data for both Vancouver and Okanagan campuses
with open("course-data/subjects-prereqs/UBCV-subjects.json") as f:
    vancouver_subjects = json.load(f)

with open("course-data/subjects-prereqs/UBCO-subjects.json") as f:
    okanagan_subjects = json.load(f)

# Grade ranges for distribution
grade_ranges = ['<50', '50-54', '55-59', '60-63', '64-67', '68-71', '72-75', '76-79', '80-84', '85-89', '90-100']

# Function to check if a course has honorary science credit (only for UBCV)
def has_honorary_science_credit(subject, course_number):
    # Convert course_number to string if it's not already
    course_number = str(course_number)
    
    # All GEOS courses
    if subject == "GEOS" or subject == "GEOB":
        return True
        
    # PSYC 348 and 448
    if subject == "PSYC" and (course_number == "348" or course_number == "448"):
        return True
        
    # Any PSYC course that ends in 60 to 89
    if subject == "PSYC":
        # Extract the last two digits of the course number
        match = re.match(r'^\d+', course_number)
        if match:
            course_num = int(match.group())
            last_two_digits = course_num % 100
            if 60 <= last_two_digits <= 89:
                return True
    
    # FNH courses
    if subject == "FNH" and course_number in ["350", "351", "450", "451"]:
        return True
        
    # All BIOC, CAPS, and PCTH courses
    if subject in ["BIOC", "CAPS", "PCTH"]:
        return True
        
    # MEDG courses between 410 to 421
    if subject == "MEDG":
        match = re.match(r'^\d+', course_number)
        if match:
            course_num = int(match.group())
            if 410 <= course_num <= 421:
                return True
                
    return False

# Process each campus
for campus_folder, subjects, output_campus_folder in [
    (ubcv_folder, vancouver_subjects, os.path.join(output_root, "UBCV")),
    (ubco_folder, okanagan_subjects, os.path.join(output_root, "UBCO"))
]:
    term_folders = [f.path for f in os.scandir(campus_folder) if f.is_dir()]
    
    # Ensure the output directory exists
    os.makedirs(output_campus_folder, exist_ok=True)

    for term_folder in term_folders:
        term_name = os.path.basename(term_folder)
        output_file = os.path.join(output_campus_folder, f"{term_name}.json")
        
        all_courses = []
        csv_files = glob.glob(f"{term_folder}/*.csv")
        data = []

        for file in csv_files:
            # Read the CSV data
            df = pd.read_csv(file)
            df.columns = df.columns.str.strip()

            # Initialize missing columns
            for col in ['Reported', 'Avg', 'Median', 'Percentile (25)', 'Percentile (75)', 'High', 'Low'] + grade_ranges:
                if col not in df.columns:
                    df[col] = 0

            # Fill NaN values
            for col in ['Reported', 'Avg', 'Median', 'Percentile (25)', 'Percentile (75)', 'High', 'Low'] + grade_ranges:
                df[col] = df[col].fillna(0)

            data.append(df)

        if not data:
            continue

        df_all = pd.concat(data, ignore_index=True)

        # Calculate weighted values for each course
        df_all['WeightedGrade'] = df_all['Avg'] * df_all['Reported']
        df_all['WeightedMedian'] = df_all['Median'] * df_all['Reported']
        df_all['WeightedP25'] = df_all['Percentile (25)'] * df_all['Reported']
        df_all['WeightedP75'] = df_all['Percentile (75)'] * df_all['Reported']

        # Group by Subject and Course
        final_grouped = df_all.groupby(['Subject', 'Course'], as_index=False).agg(
            title=('Title', 'first'),
            professors=('Professor', lambda x: list(x.dropna().unique())),
            reported=('Reported', 'sum'),
            weighted_sum=('WeightedGrade', 'sum'),
            weighted_median_sum=('WeightedMedian', 'sum'),
            weighted_p25_sum=('WeightedP25', 'sum'),
            weighted_p75_sum=('WeightedP75', 'sum'),
            high=('High', 'max'),
            low=('Low', 'min'),
            **{range_: (range_, 'sum') for range_ in grade_ranges}
        )

        # Calculate weighted statistics with full precision
        final_grouped['avg'] = final_grouped['weighted_sum'] / final_grouped['reported']
        final_grouped['weighted_median'] = final_grouped['weighted_median_sum'] / final_grouped['reported']
        final_grouped['weighted_p25'] = final_grouped['weighted_p25_sum'] / final_grouped['reported']
        final_grouped['weighted_p75'] = final_grouped['weighted_p75_sum'] / final_grouped['reported']

        # Add faculty and campus data
        for idx, row in final_grouped.iterrows():
            subject_code = row['Subject']
            course_number = row['Course']
            subject_info = next((item for item in subjects if item["code"] == subject_code), None)
            
            if subject_info:
                faculty = subject_info["faculty_school"]
                
                # Check if the course has honorary science credit - ONLY for UBCV courses
                if "UBCV" in output_campus_folder and has_honorary_science_credit(subject_code, course_number):
                    faculty = f"{faculty} (Honorary Science Credit)"

                course_data = {
                    "Subject": subject_info["title"],
                    "Code": f"{row['Subject']} {row['Course']}",
                    "Name": row['title'],
                    "Faculty": faculty,
                    "Average": round(row['avg'], 2),
                    "Reported": int(row['reported']),
                    "WeightedMedian": round(row['weighted_median'], 2),
                    "Percentile25": round(row['weighted_p25'], 2),
                    "Percentile75": round(row['weighted_p75'], 2),
                    "High": int(row['high']),
                    "Low": int(row['low']),
                    **{range_: int(row[range_]) for range_ in grade_ranges},
                    "Professors": row['professors']
                }

                all_courses.append(course_data)

        # Save the results
        with open(output_file, 'w') as f:
            json.dump(all_courses, f, indent=4)
            
        # Print session processing message
        campus_name = "UBCV" if "UBCV" in output_campus_folder else "UBCO"
        print(f"Processed {campus_name} {term_name}")

print("Data processed and saved successfully.")