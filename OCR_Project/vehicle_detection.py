import os
import cv2
import csv
from ultralytics import YOLO

# ============================================================
# PATHS
# ============================================================

BASE_DIR = r"C:\OCR_Project"

MODEL_PATH = os.path.join(
    BASE_DIR,
    "yolo11n.pt"
)

INPUT_DIR = os.path.join(
    BASE_DIR,
    "images"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "images",
    "vehicle_detection_results"
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

ANNOTATED_DIR = os.path.join(
    OUTPUT_DIR,
    "annotated_frames"
)

os.makedirs(
    ANNOTATED_DIR,
    exist_ok=True
)

CSV_PATH = os.path.join(
    OUTPUT_DIR,
    "vehicle_detections.csv"
)

# ============================================================
# VEHICLE CLASSES
# ============================================================

VEHICLE_CLASSES = {
    2: "Car",
    3: "Motorcycle",
    5: "Bus",
    7: "Truck"
}

# ============================================================
# LOAD MODEL
# ============================================================

print("Loading vehicle YOLO model...")

model = YOLO(MODEL_PATH)

print("Vehicle YOLO loaded.")

# ============================================================
# FRAMES
# ============================================================

frames = sorted([
    f
    for f in os.listdir(INPUT_DIR)
    if f.lower().endswith(".jpg")
    and f.startswith("road_frame_")
])

print()
print("Road frames found:", len(frames))
print()

# ============================================================
# CSV
# ============================================================

csv_file = open(
    CSV_PATH,
    "w",
    newline="",
    encoding="utf-8"
)

writer = csv.writer(csv_file)

writer.writerow([
    "Frame",
    "Vehicle ID",
    "Vehicle Type",
    "Confidence",
    "X1",
    "Y1",
    "X2",
    "Y2"
])

# ============================================================
# PROCESS FRAMES
# ============================================================

total_detections = 0
vehicle_ids = set()

for frame_number, frame_name in enumerate(
    frames,
    start=1
):

    frame_path = os.path.join(
        INPUT_DIR,
        frame_name
    )

    frame = cv2.imread(
        frame_path
    )

    if frame is None:
        continue

    # --------------------------------------------------------
    # YOLO TRACKING
    # --------------------------------------------------------

    results = model.track(
        source=frame,
        persist=True,
        conf=0.35,
        iou=0.45,
        classes=list(VEHICLE_CLASSES.keys()),
        verbose=False
    )

    annotated = frame.copy()

    for result in results:

        if result.boxes is None:
            continue

        boxes = result.boxes

        for i in range(len(boxes)):

            class_id = int(
                boxes.cls[i]
            )

            if class_id not in VEHICLE_CLASSES:
                continue

            confidence = float(
                boxes.conf[i]
            )

            x1, y1, x2, y2 = map(
                int,
                boxes.xyxy[i].tolist()
            )

            # ------------------------------------------------
            # VEHICLE ID
            # ------------------------------------------------

            if boxes.id is not None:

                vehicle_id = int(
                    boxes.id[i]
                )

            else:

                vehicle_id = total_detections + 1

            vehicle_ids.add(
                vehicle_id
            )

            total_detections += 1

            vehicle_type = VEHICLE_CLASSES[
                class_id
            ]

            # ------------------------------------------------
            # CSV
            # ------------------------------------------------

            writer.writerow([
                frame_name,
                f"Vehicle_{vehicle_id:03d}",
                vehicle_type,
                f"{confidence:.3f}",
                x1,
                y1,
                x2,
                y2
            ])

            # ------------------------------------------------
            # DRAW BOX
            # ------------------------------------------------

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            label = (
                f"Vehicle_{vehicle_id:03d} "
                f"{vehicle_type} "
                f"{confidence:.2f}"
            )

            cv2.putText(
                annotated,
                label,
                (
                    x1,
                    max(25, y1 - 8)
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 255, 0),
                2
            )

    # --------------------------------------------------------
    # SAVE FRAME
    # --------------------------------------------------------

    output_path = os.path.join(
        ANNOTATED_DIR,
        frame_name
    )

    cv2.imwrite(
        output_path,
        annotated
    )

    print(
        f"[{frame_number}/{len(frames)}] "
        f"{frame_name} processed"
    )

csv_file.close()

# ============================================================
# SUMMARY
# ============================================================

print()
print("=" * 60)
print("VEHICLE DETECTION COMPLETE")
print("=" * 60)

print(
    "Frames processed       :",
    len(frames)
)

print(
    "Total vehicle detections:",
    total_detections
)

print(
    "Unique vehicle IDs      :",
    len(vehicle_ids)
)

print()
print("Vehicle types:")

# Read CSV again to count types
type_counts = {}

with open(
    CSV_PATH,
    "r",
    encoding="utf-8"
) as file:

    reader = csv.DictReader(file)

    for row in reader:

        vehicle_type = row["Vehicle Type"]

        type_counts[vehicle_type] = (
            type_counts.get(
                vehicle_type,
                0
            ) + 1
        )

for vehicle_type, count in type_counts.items():

    print(
        f"  {vehicle_type}: {count}"
    )

print()
print("CSV:")
print(CSV_PATH)

print()
print("Annotated frames:")
print(ANNOTATED_DIR)

print()
print("DONE.")