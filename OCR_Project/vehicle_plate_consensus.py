import os
import re
import pandas as pd
from collections import Counter

# ============================================================
# PATHS
# ============================================================

INPUT_CSV = r"C:\OCR_Project\images\combined_anpr_results\combined_vehicle_plate_results.csv"

OUTPUT_DIR = r"C:\OCR_Project\images\combined_anpr_results"
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "vehicle_plate_consensus.csv")

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# INDIAN NUMBER PLATE VALIDATION
# ============================================================

INDIAN_PLATE_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"
)


def clean_text(text):
    """
    Clean OCR text:
    - Convert to uppercase
    - Remove spaces, hyphens and special characters
    """
    if pd.isna(text):
        return ""

    text = str(text).upper()

    # Remove everything except A-Z and 0-9
    text = re.sub(r"[^A-Z0-9]", "", text)

    return text


# ============================================================
# OCR CHARACTER CORRECTIONS
# ============================================================

def correct_common_ocr_errors(text):
    """
    Correct common OCR mistakes in Indian number plates.

    Important:
    These corrections are conservative.
    """

    text = clean_text(text)

    if not text:
        return ""

    # Common OCR substitutions
    replacements = {
        "O": "0",
        "I": "1",
        "L": "1",
        "Z": "2",
        "S": "5",
        "B": "8",
        "G": "6",
        "T": "7"
    }

    # We don't blindly replace every character because
    # letters are also valid in registration numbers.

    return text


# ============================================================
# INDIAN PLATE CHECK
# ============================================================

def is_indian_plate(text):
    """
    Check whether OCR result resembles an Indian registration plate.
    """

    text = clean_text(text)

    if not text:
        return False

    return bool(INDIAN_PLATE_PATTERN.match(text))


# ============================================================
# PLATE FORMAT SCORE
# ============================================================

def plate_format_score(text):
    """
    Give a score based on how closely the OCR text resembles
    an Indian registration plate.

    Higher = better.
    """

    text = clean_text(text)

    if not text:
        return 0

    score = 0

    # Exact Indian format
    if is_indian_plate(text):
        score += 100

    # Typical minimum length
    if 8 <= len(text) <= 12:
        score += 20

    # Must contain letters
    if any(c.isalpha() for c in text):
        score += 10

    # Must contain numbers
    if any(c.isdigit() for c in text):
        score += 10

    # Starts with two letters
    if len(text) >= 2 and text[:2].isalpha():
        score += 20

    return score


# ============================================================
# FIND BEST PLATE FROM VEHICLE READINGS
# ============================================================

def choose_best_plate(group):
    """
    Select the best OCR result for a vehicle.

    Priority:
    1. Valid Indian plate
    2. OCR confidence
    3. Plate confidence
    4. Frequency
    """

    candidates = []

    for _, row in group.iterrows():

        plate = clean_text(row.get("Plate Number", ""))

        if not plate:
            continue

        ocr_conf = pd.to_numeric(
            row.get("OCR Confidence", 0),
            errors="coerce"
        )

        plate_conf = pd.to_numeric(
            row.get("Plate Confidence", 0),
            errors="coerce"
        )

        if pd.isna(ocr_conf):
            ocr_conf = 0

        if pd.isna(plate_conf):
            plate_conf = 0

        candidates.append({
            "plate": plate,
            "ocr_conf": float(ocr_conf),
            "plate_conf": float(plate_conf),
            "indian": is_indian_plate(plate),
            "format_score": plate_format_score(plate)
        })

    if not candidates:
        return None

    # --------------------------------------------------------
    # Count frequency of OCR readings
    # --------------------------------------------------------

    frequency = Counter(
        item["plate"] for item in candidates
    )

    for item in candidates:
        item["frequency"] = frequency[item["plate"]]

    # --------------------------------------------------------
    # Sort:
    #
    # Valid Indian plate first
    # Then format score
    # Then frequency
    # Then OCR confidence
    # Then plate confidence
    # --------------------------------------------------------

    candidates.sort(
        key=lambda x: (
            x["indian"],
            x["format_score"],
            x["frequency"],
            x["ocr_conf"],
            x["plate_conf"]
        ),
        reverse=True
    )

    return candidates[0]


# ============================================================
# MAIN
# ============================================================

print("=" * 70)
print("VEHICLE + PLATE CONSENSUS ANALYSIS")
print("=" * 70)

print("\nReading combined ANPR CSV...")

if not os.path.exists(INPUT_CSV):
    print("\nERROR:")
    print("Input CSV was not found:")
    print(INPUT_CSV)
    print("\nMake sure vehicle_plate_combined.py was completed first.")
    input("\nPress Enter to exit...")
    raise SystemExit

df = pd.read_csv(INPUT_CSV)

print("\nInput CSV:")
print(INPUT_CSV)

print("\nRows found:", len(df))

print("\nColumns found:")
for col in df.columns:
    print(" -", col)


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "Vehicle ID",
    "Vehicle Type",
    "Vehicle Confidence",
    "Plate Number",
    "Plate Confidence",
    "OCR Confidence"
]

missing = [
    col for col in required_columns
    if col not in df.columns
]

if missing:
    print("\nERROR: Missing columns:")
    for col in missing:
        print(" -", col)

    print("\nPlease check the combined CSV.")
    input("\nPress Enter to exit...")
    raise SystemExit


# ============================================================
# REMOVE EMPTY VEHICLE IDs
# ============================================================

df["Vehicle ID"] = df["Vehicle ID"].astype(str)

df = df[
    (df["Vehicle ID"].notna()) &
    (df["Vehicle ID"].str.strip() != "") &
    (df["Vehicle ID"].str.lower() != "nan")
].copy()


# ============================================================
# NUMERIC CONVERSION
# ============================================================

df["Vehicle Confidence"] = pd.to_numeric(
    df["Vehicle Confidence"],
    errors="coerce"
).fillna(0)

df["Plate Confidence"] = pd.to_numeric(
    df["Plate Confidence"],
    errors="coerce"
).fillna(0)

df["OCR Confidence"] = pd.to_numeric(
    df["OCR Confidence"],
    errors="coerce"
).fillna(0)


# ============================================================
# PROCESS EACH VEHICLE
# ============================================================

results = []

vehicle_ids = df["Vehicle ID"].unique()

print("\nUnique vehicle IDs found:", len(vehicle_ids))

print("\nBuilding consensus results...")


for vehicle_id in vehicle_ids:

    group = df[df["Vehicle ID"] == vehicle_id].copy()

    # --------------------------------------------------------
    # Vehicle type
    # --------------------------------------------------------

    vehicle_types = (
        group["Vehicle Type"]
        .dropna()
        .astype(str)
        .tolist()
    )

    if vehicle_types:
        vehicle_type = Counter(vehicle_types).most_common(1)[0][0]
    else:
        vehicle_type = "Unknown"

    # --------------------------------------------------------
    # Best vehicle confidence
    # --------------------------------------------------------

    vehicle_confidence = group["Vehicle Confidence"].max()

    # --------------------------------------------------------
    # Number of observations
    # --------------------------------------------------------

    observations = len(group)

    # --------------------------------------------------------
    # Number of frames if available
    # --------------------------------------------------------

    if "Frame" in group.columns:
        frames_seen = group["Frame"].nunique()
    elif "Frame Number" in group.columns:
        frames_seen = group["Frame Number"].nunique()
    else:
        frames_seen = observations

    # --------------------------------------------------------
    # Best plate
    # --------------------------------------------------------

    best = choose_best_plate(group)

    if best is None:

        plate_number = "NOT READ"
        plate_confidence = 0
        ocr_confidence = 0
        indian_plate = "UNKNOWN"
        plate_observations = 0

    else:

        plate_number = best["plate"]
        plate_confidence = best["plate_conf"]
        ocr_confidence = best["ocr_conf"]
        plate_observations = best["frequency"]

        if best["indian"]:
            indian_plate = "YES"
        else:
            # Do not call weak/invalid OCR confidently non-Indian
            if ocr_confidence >= 0.80:
                indian_plate = "NO"
            else:
                indian_plate = "UNKNOWN"

    # --------------------------------------------------------
    # Add result
    # --------------------------------------------------------

    results.append({
        "Vehicle ID": vehicle_id,
        "Vehicle Type": vehicle_type,
        "Vehicle Confidence": round(vehicle_confidence, 3),
        "Frames Seen": frames_seen,
        "Plate Observations": plate_observations,
        "Plate Number": plate_number,
        "Plate Confidence": round(plate_confidence, 3),
        "OCR Confidence": round(ocr_confidence, 3),
        "Indian Plate": indian_plate
    })


# ============================================================
# CREATE FINAL DATAFRAME
# ============================================================

result_df = pd.DataFrame(results)


# ============================================================
# SORT
# ============================================================

result_df = result_df.sort_values(
    by=[
        "Indian Plate",
        "OCR Confidence",
        "Vehicle Confidence"
    ],
    ascending=[
        False,
        False,
        False
    ]
)


# ============================================================
# SAVE CSV
# ============================================================

result_df.to_csv(
    OUTPUT_CSV,
    index=False
)


# ============================================================
# DISPLAY RESULTS
# ============================================================

print("\n" + "=" * 70)
print("CONSENSUS RESULTS")
print("=" * 70)

print("\nTotal vehicle IDs:", len(result_df))

print(
    "Vehicles with readable plates:",
    (result_df["Plate Number"] != "NOT READ").sum()
)

print(
    "Vehicles with valid Indian plates:",
    (result_df["Indian Plate"] == "YES").sum()
)

print(
    "Vehicles marked UNKNOWN:",
    (result_df["Indian Plate"] == "UNKNOWN").sum()
)

print(
    "Vehicles marked NO:",
    (result_df["Indian Plate"] == "NO").sum()
)


# ============================================================
# PRINT TABLE
# ============================================================

print("\nFINAL VEHICLE REPORT:\n")

print(
    result_df.to_string(index=False)
)


# ============================================================
# SAVE INDIAN PLATES ONLY
# ============================================================

indian_df = result_df[
    result_df["Indian Plate"] == "YES"
].copy()

indian_output = os.path.join(
    OUTPUT_DIR,
    "indian_vehicle_plates.csv"
)

indian_df.to_csv(
    indian_output,
    index=False
)


# ============================================================
# DONE
# ============================================================

print("\n" + "=" * 70)
print("FILES CREATED")
print("=" * 70)

print("\nMain report:")
print(OUTPUT_CSV)

print("\nIndian plates only:")
print(indian_output)

print("\nDONE.")

input("\nPress Enter to exit...")