import os
import re
import pandas as pd
from collections import Counter

# ============================================================
# PATHS
# ============================================================

INPUT_CSV = r"C:\OCR_Project\images\combined_anpr_results\combined_vehicle_plate_results.csv"

OUTPUT_DIR = r"C:\OCR_Project\images\combined_anpr_results"

OUTPUT_CSV = os.path.join(
    OUTPUT_DIR,
    "vehicle_plate_consensus_v2.csv"
)

INDIAN_CSV = os.path.join(
    OUTPUT_DIR,
    "indian_vehicle_plates_v2.csv"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# INDIAN PLATE FORMAT
# ============================================================

INDIAN_PLATE_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"
)


def clean_text(text):

    if pd.isna(text):
        return ""

    text = str(text).upper()

    text = re.sub(
        r"[^A-Z0-9]",
        "",
        text
    )

    return text


def is_valid_indian_plate(text):

    text = clean_text(text)

    if not text:
        return False

    return bool(
        INDIAN_PLATE_PATTERN.fullmatch(text)
    )


# ============================================================
# READ CSV
# ============================================================

print("=" * 70)
print("VEHICLE PLATE CONSENSUS V2")
print("=" * 70)

print("\nReading:")
print(INPUT_CSV)

if not os.path.exists(INPUT_CSV):

    print("\nERROR: Input CSV not found.")
    input("\nPress Enter to exit...")
    raise SystemExit


df = pd.read_csv(INPUT_CSV)

print("\nRows found:", len(df))


# ============================================================
# CLEAN VEHICLE IDs
# ============================================================

df["Vehicle ID"] = df["Vehicle ID"].fillna("")

df["Vehicle ID"] = (
    df["Vehicle ID"]
    .astype(str)
    .str.strip()
)

# Remove blank / Unknown vehicle IDs

df = df[
    (df["Vehicle ID"] != "") &
    (df["Vehicle ID"].str.lower() != "nan") &
    (df["Vehicle ID"].str.lower() != "unknown")
].copy()


print(
    "Rows after removing unknown vehicle IDs:",
    len(df)
)


# ============================================================
# NUMERIC COLUMNS
# ============================================================

for column in [
    "Vehicle Confidence",
    "Plate Confidence",
    "OCR Confidence"
]:

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    ).fillna(0)


# ============================================================
# CLEAN PLATE TEXT
# ============================================================

df["Clean Plate"] = (
    df["Plate Number"]
    .apply(clean_text)
)


# Remove NOTREAD / NOT READ

invalid_reads = {
    "",
    "NOTREAD",
    "NOTREADABLE",
    "UNKNOWN",
    "NONE",
    "NAN"
}

df = df[
    ~df["Clean Plate"].isin(invalid_reads)
].copy()


print(
    "Actual OCR plate readings:",
    len(df)
)


# ============================================================
# PROCESS EACH VEHICLE
# ============================================================

results = []


for vehicle_id, group in df.groupby(
    "Vehicle ID"
):

    # --------------------------------------------------------
    # VEHICLE TYPE
    # --------------------------------------------------------

    vehicle_types = (
        group["Vehicle Type"]
        .dropna()
        .astype(str)
        .tolist()
    )

    if vehicle_types:

        vehicle_type = Counter(
            vehicle_types
        ).most_common(1)[0][0]

    else:

        vehicle_type = "Unknown"


    # --------------------------------------------------------
    # VEHICLE CONFIDENCE
    # --------------------------------------------------------

    vehicle_confidence = group[
        "Vehicle Confidence"
    ].max()


    # --------------------------------------------------------
    # FRAMES
    # --------------------------------------------------------

    if "Frame" in group.columns:

        frames_seen = group[
            "Frame"
        ].nunique()

    else:

        frames_seen = len(group)


    # --------------------------------------------------------
    # VALID INDIAN PLATES
    # --------------------------------------------------------

    group["Indian Valid"] = (
        group["Clean Plate"]
        .apply(is_valid_indian_plate)
    )


    valid_indian = group[
        group["Indian Valid"] == True
    ]


    # --------------------------------------------------------
    # CHOOSE BEST PLATE
    # --------------------------------------------------------

    if len(valid_indian) > 0:

        # Among valid Indian plates,
        # choose highest OCR confidence

        best_row = valid_indian.sort_values(
            by=[
                "OCR Confidence",
                "Plate Confidence"
            ],
            ascending=False
        ).iloc[0]

        plate_number = best_row[
            "Clean Plate"
        ]

        plate_confidence = best_row[
            "Plate Confidence"
        ]

        ocr_confidence = best_row[
            "OCR Confidence"
        ]

        indian_status = "YES"

    else:

        # No valid Indian plate.
        # Keep highest-confidence OCR reading
        # but mark it UNKNOWN.

        best_row = group.sort_values(
            by=[
                "OCR Confidence",
                "Plate Confidence"
            ],
            ascending=False
        ).iloc[0]

        plate_number = best_row[
            "Clean Plate"
        ]

        plate_confidence = best_row[
            "Plate Confidence"
        ]

        ocr_confidence = best_row[
            "OCR Confidence"
        ]

        indian_status = "UNKNOWN"


    # --------------------------------------------------------
    # NUMBER OF PLATE OBSERVATIONS
    # --------------------------------------------------------

    plate_observations = len(group)


    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    results.append({

        "Vehicle ID":
            vehicle_id,

        "Vehicle Type":
            vehicle_type,

        "Vehicle Confidence":
            round(
                vehicle_confidence,
                3
            ),

        "Frames Seen":
            frames_seen,

        "Plate Observations":
            plate_observations,

        "Plate Number":
            plate_number,

        "Plate Confidence":
            round(
                plate_confidence,
                3
            ),

        "OCR Confidence":
            round(
                ocr_confidence,
                3
            ),

        "Indian Plate":
            indian_status
    })


# ============================================================
# CREATE RESULT DATAFRAME
# ============================================================

result_df = pd.DataFrame(
    results
)


# ============================================================
# SORT RESULTS
# ============================================================

result_df = result_df.sort_values(

    by=[
        "Indian Plate",
        "OCR Confidence"
    ],

    ascending=[
        True,
        False
    ]
)


# ============================================================
# SAVE MAIN REPORT
# ============================================================

result_df.to_csv(
    OUTPUT_CSV,
    index=False
)


# ============================================================
# INDIAN PLATES ONLY
# ============================================================

indian_df = result_df[
    result_df["Indian Plate"] == "YES"
].copy()


indian_df.to_csv(
    INDIAN_CSV,
    index=False
)


# ============================================================
# DISPLAY
# ============================================================

print("\n")
print("=" * 70)
print("FINAL CONSENSUS REPORT")
print("=" * 70)

print(
    "\nVehicles with OCR readings:",
    len(result_df)
)

print(
    "Valid Indian plates:",
    len(indian_df)
)

print(
    "Unknown/non-confirmed:",
    len(result_df) - len(indian_df)
)


print("\n")

print(
    result_df.to_string(
        index=False
    )
)


# ============================================================
# INDIAN PLATE SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("CONFIRMED INDIAN PLATES")
print("=" * 70)

if len(indian_df) == 0:

    print("\nNo valid Indian plates found.")

else:

    print(
        indian_df.to_string(
            index=False
        )
    )


# ============================================================
# FILES
# ============================================================

print("\n")
print("=" * 70)
print("FILES CREATED")
print("=" * 70)

print("\nMain report:")
print(OUTPUT_CSV)

print("\nIndian plates:")
print(INDIAN_CSV)

print("\nDONE.")

input("\nPress Enter to exit...")