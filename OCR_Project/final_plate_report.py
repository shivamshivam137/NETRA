import pandas as pd
import re

# ============================================================
# FILE PATHS
# ============================================================

INPUT_CSV = r"C:\OCR_Project\images\road_anpr_results_v4\road_anpr_v4_results.csv"

OUTPUT_CSV = r"C:\OCR_Project\images\road_anpr_results_v4\final_plate_report.csv"


# ============================================================
# CLEAN OCR TEXT
# ============================================================

def clean_text(text):

    if pd.isna(text):
        return ""

    text = str(text).upper()

    # Remove spaces, symbols and special characters
    text = re.sub(r"[^A-Z0-9]", "", text)

    return text


# ============================================================
# INDIAN NUMBER PLATE VALIDATION
# ============================================================

def is_indian_plate(text):

    text = clean_text(text)

    # Indian vehicle registration format
    #
    # Example:
    # MH03FC0558
    # MH04GZ8916
    # HR26EA917
    # MH00RES675
    #
    pattern = r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"

    return bool(re.match(pattern, text))


# ============================================================
# LOAD V4 CSV
# ============================================================

print("=" * 70)
print("FINAL NUMBER PLATE REPORT")
print("=" * 70)

print()
print("Loading V4 results...")

try:

    df = pd.read_csv(INPUT_CSV)

except Exception as e:

    print()
    print("ERROR: Could not open the V4 CSV.")
    print(e)

    input("\nPress Enter to exit...")
    raise SystemExit


print()
print("Total OCR records found:", len(df))


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "YOLO_Confidence",
    "Raw_OCR",
    "OCR_Confidence",
    "Corrected_OCR",
    "Indian_Plate_Valid"
]

missing_columns = []

for column in required_columns:

    if column not in df.columns:

        missing_columns.append(column)


if missing_columns:

    print()
    print("ERROR: Missing columns:")

    for column in missing_columns:
        print(" -", column)

    print()
    print("Available columns:")

    for column in df.columns:
        print(" -", column)

    input("\nPress Enter to exit...")
    raise SystemExit


# ============================================================
# CREATE FINAL REPORT
# ============================================================

final_rows = []


for _, row in df.iterrows():

    # --------------------------------------------------------
    # GET OCR TEXT
    # --------------------------------------------------------

    plate = clean_text(
        row["Corrected_OCR"]
    )

    # If corrected OCR is empty,
    # use Raw OCR instead

    if not plate:

        plate = clean_text(
            row["Raw_OCR"]
        )


    # --------------------------------------------------------
    # GET YOLO PLATE CONFIDENCE
    # --------------------------------------------------------

    try:

        yolo_conf = float(
            row["YOLO_Confidence"]
        )

    except:

        yolo_conf = 0.0


    # --------------------------------------------------------
    # GET OCR CONFIDENCE
    # --------------------------------------------------------

    try:

        ocr_conf = float(
            row["OCR_Confidence"]
        )

    except:

        ocr_conf = 0.0


    # --------------------------------------------------------
    # FIX CONFIDENCE VALUES
    # --------------------------------------------------------

    # PaddleOCR confidence should normally be
    # between 0 and 1.
    #
    # If the value is already a percentage
    # such as 92, convert it to 0.92.

    if ocr_conf > 1:

        ocr_conf = ocr_conf / 100


    if yolo_conf > 1:

        yolo_conf = yolo_conf / 100


    # Make absolutely sure values stay between 0 and 1

    ocr_conf = min(
        max(
            ocr_conf,
            0.0
        ),
        1.0
    )


    yolo_conf = min(
        max(
            yolo_conf,
            0.0
        ),
        1.0
    )


    # --------------------------------------------------------
    # INDIAN PLATE CHECK
    # --------------------------------------------------------

    # First use the validation result from V4

    indian_value = str(
        row["Indian_Plate_Valid"]
    ).upper()


    if indian_value in [
        "TRUE",
        "YES",
        "1"
    ]:

        indian = "YES"


    elif indian_value in [
        "FALSE",
        "NO",
        "0"
    ]:

        indian = "NO"


    else:

        # If V4 does not have a valid value,
        # check the plate format ourselves.

        if plate and is_indian_plate(plate):

            indian = "YES"

        elif plate:

            indian = "NO"

        else:

            indian = "UNKNOWN"


    # --------------------------------------------------------
    # HANDLE UNREADABLE PLATES
    # --------------------------------------------------------

    if plate in [
        "",
        "NOTREAD",
        "NOTREAD",
        "UNKNOWN",
        "NONE",
        "NAN"
    ]:

        plate = "NOT READ"

        indian = "UNKNOWN"


    # --------------------------------------------------------
    # CONVERT TO PERCENTAGE
    # --------------------------------------------------------

    plate_confidence_percent = round(
        yolo_conf * 100,
        1
    )

    ocr_confidence_percent = round(
        ocr_conf * 100,
        1
    )


    # --------------------------------------------------------
    # SAVE ROW
    # --------------------------------------------------------

    final_rows.append({

        "Number Plate":
            plate,

        "Plate Detection Confidence":
            plate_confidence_percent,

        "OCR Confidence":
            ocr_confidence_percent,

        "Indian Plate":
            indian

    })


# ============================================================
# CREATE DATAFRAME
# ============================================================

final_df = pd.DataFrame(
    final_rows
)


# ============================================================
# REMOVE NOT READ ROWS
# ============================================================

# Keep readable plates only for the final clean report

final_df = final_df[
    final_df["Number Plate"] != "NOT READ"
].copy()


# ============================================================
# REMOVE DUPLICATE PLATES
# ============================================================

final_df = final_df.drop_duplicates(
    subset=["Number Plate"]
)


# ============================================================
# SORT BY PLATE CONFIDENCE
# ============================================================

final_df = final_df.sort_values(
    by="Plate Detection Confidence",
    ascending=False
)


# ============================================================
# SAVE FINAL CSV
# ============================================================

final_df.to_csv(
    OUTPUT_CSV,
    index=False
)


# ============================================================
# DISPLAY FINAL RESULT
# ============================================================

print()
print("=" * 70)
print("FINAL RESULT")
print("=" * 70)

print()

if len(final_df) == 0:

    print("No readable number plates found.")

else:

    print(
        final_df.to_string(
            index=False
        )
    )


# ============================================================
# SUMMARY
# ============================================================

indian_count = len(
    final_df[
        final_df["Indian Plate"] == "YES"
    ]
)


not_indian_count = len(
    final_df[
        final_df["Indian Plate"] == "NO"
    ]
)


unknown_count = len(
    final_df[
        final_df["Indian Plate"] == "UNKNOWN"
    ]
)


print()
print("=" * 70)

print(
    "Total unique readable plates:",
    len(final_df)
)

print(
    "Indian plates:",
    indian_count
)

print(
    "Not Indian:",
    not_indian_count
)

print(
    "Unknown:",
    unknown_count
)

print()
print("Final CSV saved to:")

print(
    OUTPUT_CSV
)

print("=" * 70)

input("\nPress Enter to exit...")