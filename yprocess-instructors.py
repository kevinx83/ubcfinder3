import os
import json
import pandas as pd
from collections import defaultdict

base_path = "data/course-data/pre-processed"
output_path = "data/instructor-data"

# Target final output grade buckets
grade_ranges = ['<50', '50-54', '55-59', '60-63', '64-67', '68-71', '72-75', '76-79', '80-84', '85-89', '90-100']

# Letter grade to % range mapping
letter_to_range = {
    'A+': '90-100', 'A': '85-89', 'A-': '80-84',
    'B+': '76-79', 'B': '72-75', 'B-': '68-71',
    'C+': '64-67', 'C': '60-63', 'C-': '55-59',
    'D': '50-54', 'F': '<50'
}

# Load subject metadata
with open("data/course-data/subjects-prereqs/UBCV-subjects.json") as f:
    ubcv_subjects = json.load(f)
with open("data/course-data/subjects-prereqs/UBCO-subjects.json") as f:
    ubco_subjects = json.load(f)

subject_lookup = {
    "UBCV": {s["code"]: s for s in ubcv_subjects},
    "UBCO": {s["code"]: s for s in ubco_subjects}
}

def get_faculty(subject, campus):
    return subject_lookup[campus].get(subject, {}).get("faculty_school", "Unknown Faculty")

def get_subject_title(subject, campus):
    return subject_lookup[campus].get(subject, {}).get("title", subject)

def safe_read_tsv(path):
    try:
        return pd.read_csv(path, sep="\t", encoding="utf-16").fillna(0)
    except:
        return pd.read_csv(path, sep="\t", encoding="utf-8").fillna(0)

def combine_course_sections(sections):
    total = sum(s['reported'] for s in sections)
    if total == 0:
        return None
    out = {
        "section": ", ".join(sorted(set(s["section"] for s in sections))),
        "reported": total,
        "title": sections[0]["title"],
        "average": round(sum(s["average"] * s["reported"] for s in sections) / total, 2),
        "median": round(sum(s["median"] * s["reported"] for s in sections) / total, 2),
        "percentile25": round(sum(s["percentile25"] * s["reported"] for s in sections) / total, 2),
        "percentile75": round(sum(s["percentile75"] * s["reported"] for s in sections) / total, 2),
        "high": max(s["high"] for s in sections),
        "low": min(s["low"] for s in sections)
    }
    for r in grade_ranges:
        out[r] = sum(s[r] for s in sections)
    return out

def process_term(campus, term):
    folder = os.path.join(base_path, campus, term)
    if not os.path.exists(folder):
        return

    df_main = safe_read_tsv(os.path.join(folder, "Grade Summary.csv"))
    df_dist = safe_read_tsv(os.path.join(folder, "Grade Summary by Grade.csv"))
    df_dist.columns = df_dist.iloc[0]
    df_dist = df_dist[1:].copy()
    df_dist.columns = df_dist.columns.str.strip()

    instructors = defaultdict(lambda: {
        "name": "",
        "faculties": set(),
        "courses": defaultdict(list)
    })

    for _, row in df_main.iterrows():
        subject = row["Course"].split()[0]
        course = row["Course"]
        title = row["Course Title"]
        reported = int(row["Grades Reported"])
        average = float(row["Mean"])
        median = float(row["Median"])
        p25 = float(row["25%-tile"])
        p75 = float(row["75%-tile"])
        high = float(row["Max"])
        low = float(row["Min"])
        section = row["Section"]
        course_code = course.strip()

        # Match grade distribution
        dist_row = df_dist[
            (df_dist["Course"].astype(str).str.strip() == course.strip()) &
            (df_dist["Section"].astype(str).str.strip() == str(section).strip()) &
            (df_dist["Course Title"].str.strip() == title.strip())
        ]

        dist = {r: 0 for r in grade_ranges}
        if not dist_row.empty:
            dist_src = dist_row.iloc[0]
            for letter, target_range in letter_to_range.items():
                count = dist_src.get(letter, 0)
                try:
                    dist[target_range] += int(count)
                except:
                    pass

        section_data = {
            "subject": get_subject_title(subject, campus),
            "code": course_code,
            "section": str(section),
            "title": title,
            "reported": reported,
            "average": average,
            "median": median,
            "percentile25": p25,
            "percentile75": p75,
            "high": int(high),
            "low": int(low),
            **dist
        }

        profs = str(row["Instructor(s)"]).split(",")
        for prof in profs:
            prof = prof.strip()
            if not prof or prof == "0":
                continue

            instructors[prof]["name"] = prof
            instructors[prof]["faculties"].add(get_faculty(subject, campus))
            instructors[prof]["courses"][course_code].append(section_data)

    output = []
    for name, info in instructors.items():
        combined = []
        for ccode, sections in info["courses"].items():
            comb = combine_course_sections(sections)
            if comb:
                comb["code"] = ccode
                comb["subject"] = sections[0]["subject"]
                combined.append(comb)
        total_students = sum(c["reported"] for c in combined)
        if total_students == 0:
            continue
        weighted_avg = round(sum(c["average"] * c["reported"] for c in combined) / total_students, 2)
        output.append({
            "name": name,
            "faculties": sorted(info["faculties"]),
            "courses": sorted(combined, key=lambda x: x["code"]),
            "totalStudents": total_students,
            "overallAverage": weighted_avg,
            "numberOfCourses": len(combined)
        })

    os.makedirs(os.path.join(output_path, campus), exist_ok=True)
    with open(os.path.join(output_path, campus, f"{term}.json"), "w", encoding="utf-8") as f:
        json.dump(sorted(output, key=lambda x: x["name"]), f, indent=2)

    print(f"✅ {campus} {term} processed.")

# Run
for campus in ["UBCV", "UBCO"]:
    for term in ["2024W", "2024S"]:
        process_term(campus, term)

print("✅ All instructor data processed.")
