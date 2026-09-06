import os
import csv
import re

BASE_DIR = r"C:\OCR_Project"

INPUT_CSV = os.path.join(
    BASE_DIR,
    "images",
    "road_anpr_results_v4",
    "road_anpr_v4_results.csv"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "images",
    "vehicle_summary"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)

OUTPUT_CSV = os.path.join(
    OUTPUT_DIR,
    "vehicle_summary.csv"
)

INDIAN_PLATE_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"
)


def clean_text(text):
    if not text:
        return ""

    return re.sub(
        r"[^A-Z0-9]",
        "",
        str(text).upper()
    )


def is_indian_plate(plate):
    plate = clean_text(plate)

    if not plate:
        return "NO"

    if INDIAN_PLATE_PATTERN.fullmatch(plate):
        return "YES"

    return "NO"


if not os.path.exists(INPUT_CSV):
    print()
    print("ERROR: V4 CSV file not found:")
    print(INPUT_CSV)
    print()
    input("Press Enter to exit...")
    exit()


records = []

with open(
    INPUT_CSV,
    "r",
    encoding="utf-8-sig"
) as file:

    reader = csv.DictReader(file)

    for row in reader:
        records.append(row)


print()
print("=" * 60)
print("VEHICLE SUMMARY")
print("=" * 60)
print()

indian_count = 0

with open(
    OUTPUT_CSV,
    "w",
    newline="",
    encoding="utf-8"
) as output_file:

    writer = csv.writer(output_file)

    writer.writerow([
        "Vehicle ID",
        "Plate Number",
        "YOLO Confidence",
        "OCR Confidence",
        "Indian Plate"
    ])

    for index, row in enumerate(records, start=1):

        vehicle_id = f"Vehicle_{index:03d}"

        plate = clean_text(
            row.get("ocr_text", "")
        )

        yolo_conf = row.get(
            "yolo_confidence",
            ""
        )

        ocr_conf = row.get(
            "ocr_confidence",
            ""
        )

        indian = is_indian_plate(plate)

        if indian == "YES":
            indian_count += 1

        if not plate:
            plate = "NOT READ"

        writer.writerow([
            vehicle_id,
            plate,
            yolo_conf,
            ocr_conf,
            indian
        ])

        print(
            f"{vehicle_id} | "
            f"Plate: {plate} | "
            f"YOLO: {yolo_conf} | "
            f"OCR: {ocr_conf} | "
            f"Indian: {indian}"
        )


print()
print("=" * 60)
print("FINAL RESULT")
print("=" * 60)

print(
    "Total detected records :",
    len(records)
)

print(
    "Indian plates detected :",
    indian_count
)

print(
    "Non-Indian / unreadable:",
    len(records) - indian_count
)

print()
print("CSV saved at:")
print(OUTPUT_CSV)

print()
print("DONE.")