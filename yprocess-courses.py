import os
import json
import pandas as pd
import re
from collections import defaultdict

# Grade mapping: letter to percentage bin
grade_map = {
    "A+": "90-100", "A": "85-89", "A-": "80-84", "B+": "76-79", "B": "72-75",
    "B-": "68-71", "C+": "64-67", "C": "60-63", "C-": "55-59", "D": "50-54", "F": "<50"
}
grade_ranges = list(grade_map.values())

# Paths
base_dir = "data/course-data/pre-processed"
output_dir = "data/course-data/post-processed"

# Load subject metadata
with open("data/course-data/subjects-prereqs/UBCV-subjects.json") as f:
    ubcv_subjects = json.load(f)
with open("data/course-data/subjects-prereqs/UBCO-subjects.json") as f:
    ubco_subjects = json.load(f)

def has_honorary_science_credit(subject, course_number):
    course_number = str(course_number)
    if subject in ["GEOS", "GEOB", "BIOC", "CAPS", "PCTH"]:
        return True
    if subject == "PSYC" and course_number in ["348", "448"]:
        return True
    if subject == "PSYC":
        match = re.match(r'^\d+', course_number)
        if match and 60 <= int(match.group()) % 100 <= 89:
            return True
    if subject == "FNH" and course_number in ["350", "351", "450", "451"]:
        return True
    if subject == "MEDG":
        match = re.match(r'^\d+', course_number)
        if match and 410 <= int(match.group()) <= 421:
            return True
    return False

def load_df(path):
    try:
        return pd.read_csv(path, sep="\t", encoding="utf-16").fillna(0)
    except:
        return pd.read_csv(path, sep="\t", encoding="utf-8").fillna(0)

def process_2024(campus, subjects):
    for term in ["2024W", "2024S"]:
        course_path = os.path.join(base_dir, campus, term, "Grade Summary.csv")
        grade_path = os.path.join(base_dir, campus, term, "Grade Summary by Grade.csv")
        if not os.path.exists(course_path) or not os.path.exists(grade_path):
            print(f"[!] Skipping {campus} {term}: missing files")
            continue

        df_course = load_df(course_path)
        df_grade = load_df(grade_path)
        df_grade.columns = df_grade.iloc[0]
        df_grade = df_grade[1:]
        df_grade.columns = df_grade.columns.str.strip()

        for col in grade_map:
            if col in df_grade.columns:
                df_grade[col] = pd.to_numeric(df_grade[col], errors="coerce").fillna(0).astype(int)

        grouped = defaultdict(lambda: {
            "Subject": "", "Code": "", "Name": "", "Faculty": "",
            "AverageSum": 0, "Reported": 0,
            "WeightedMedian": 0, "Percentile25": 0, "Percentile75": 0,
            "Highs": [], "Lows": [],
            "Professors": set(),
            **{g: 0 for g in grade_ranges}
        })

        for _, row in df_course.iterrows():
            code = row["Course"]
            subject, course = code.split()
            title = row["Course Title"]
            key = f"{subject} {course}"

            reported = int(row["Grades Reported"])
            mean = float(row["Mean"])
            median = float(row["Median"])
            p25 = float(row["25%-tile"])
            p75 = float(row["75%-tile"])
            high = float(row["Max"])
            low = float(row["Min"])

            raw_instr = str(row["Instructor(s)"])
            professors = [i.strip() for part in raw_instr.split(",") for i in part.split(";") if i.strip() and i.strip() != "0"]


            g = grouped[key]
            g["Code"] = code
            g["Name"] = title
            g["Reported"] += reported
            g["AverageSum"] += mean * reported
            g["WeightedMedian"] += median * reported
            g["Percentile25"] += p25 * reported
            g["Percentile75"] += p75 * reported
            g["Highs"].append(high)
            g["Lows"].append(low)
            g["Professors"].update(professors)

            subject_info = next((x for x in subjects if x["code"] == subject), None)
            if subject_info:
                g["Subject"] = subject_info["title"]
                faculty = subject_info["faculty_school"]
                if campus == "UBCV" and has_honorary_science_credit(subject, course):
                    faculty += " (Honorary Science Credit)"
                g["Faculty"] = faculty

            grade_match = df_grade[
                (df_grade["Course"] == code) &
                (df_grade["Section"] == row["Section"]) &
                (df_grade["Course Title"] == title)
            ]
            if not grade_match.empty:
                grade_row = grade_match.iloc[0]
                for letter, rng in grade_map.items():
                    g[rng] += int(grade_row.get(letter, 0))

        output = []
        for g in grouped.values():
            total = g["Reported"]
            record = {
                "Subject": g["Subject"],
                "Code": g["Code"],
                "Name": g["Name"],
                "Faculty": g["Faculty"],
                "Average": round(g["AverageSum"] / total, 2) if total else 0,
                "Reported": total,
                "WeightedMedian": round(g["WeightedMedian"] / total, 2) if total else 0,
                "Percentile25": round(g["Percentile25"] / total, 2) if total else 0,
                "Percentile75": round(g["Percentile75"] / total, 2) if total else 0,
                "High": max(g["Highs"]) if g["Highs"] else 0,
                "Low": min(g["Lows"]) if g["Lows"] else 0,
                **{k: g[k] for k in grade_ranges}
            }
            if g["Professors"]:
                record["Professors"] = sorted(g["Professors"])
            output.append(record)

        os.makedirs(os.path.join(output_dir, campus), exist_ok=True)
        with open(os.path.join(output_dir, campus, f"{term}.json"), "w") as f:
            json.dump(output, f, indent=2)

        print(f"✅ Processed {campus} {term}")

for campus, subjects in [("UBCV", ubcv_subjects), ("UBCO", ubco_subjects)]:
    process_2024(campus, subjects)

print("✅ All 2024 data processed.")
