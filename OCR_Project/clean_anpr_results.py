import pandas as pd
import os

# Input CSV
input_file = r"C:\OCR_Project\images\combined_anpr_results\combined_vehicle_plate_results.csv"

# Output CSV
output_file = r"C:\OCR_Project\images\combined_anpr_results\final_vehicle_report.csv"

# Read CSV
df = pd.read_csv(input_file)

# Keep only required columns
df = df[
    [
        "Vehicle ID",
        "Vehicle Type",
        "Vehicle Confidence",
        "Plate Number",
        "Plate Confidence",
        "OCR Confidence",
        "Indian Plate"
    ]
]

# Remove rows where vehicle is unknown
df = df[
    df["Vehicle ID"].notna()
]

df = df[
    df["Vehicle ID"] != "Unknown"
]

# Remove unreadable plates
df = df[
    df["Plate Number"].notna()
]

df = df[
    df["Plate Number"] != "NOT READ"
]

# Sort by vehicle ID
df = df.sort_values(
    by="Vehicle ID"
)

# Remove duplicate vehicle + plate observations
df = df.drop_duplicates(
    subset=[
        "Vehicle ID",
        "Plate Number"
    ]
)

# Save
df.to_csv(
    output_file,
    index=False
)

print()
print("=" * 60)
print("FINAL ANPR REPORT CREATED")
print("=" * 60)

print()
print("Vehicles with readable plates:", len(df))

print()
print("Final report:")
print(output_file)

print()
print(df.to_string(index=False))

print()
print("DONE.")