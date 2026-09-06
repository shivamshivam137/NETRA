import os
import re
import csv
import cv2
import numpy as np
from ultralytics import YOLO
from paddleocr import PaddleOCR

# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = r"C:\OCR_Project"

# Vehicle model
VEHICLE_MODEL = os.path.join(
    BASE_DIR,
    "yolo11n.pt"
)

# Your trained number-plate model
PLATE_MODEL = os.path.join(
    BASE_DIR,
    "yolo",
    "runs",
    "detect",
    "train",
    "weights",
    "best.pt"
)

# Road frames
INPUT_DIR = os.path.join(
    BASE_DIR,
    "images"
)

# Output
OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "images",
    "combined_anpr_results"
)

ANNOTATED_DIR = os.path.join(
    OUTPUT_DIR,
    "annotated_frames"
)

PLATE_CROP_DIR = os.path.join(
    OUTPUT_DIR,
    "plate_crops"
)

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

os.makedirs(
    ANNOTATED_DIR,
    exist_ok=True
)

os.makedirs(
    PLATE_CROP_DIR,
    exist_ok=True
)

CSV_PATH = os.path.join(
    OUTPUT_DIR,
    "combined_vehicle_plate_results.csv"
)

# ============================================================
# VEHICLE CLASSES - COCO
# ============================================================

VEHICLE_CLASSES = {
    2: "Car",
    3: "Motorcycle",
    5: "Bus",
    7: "Truck"
}

# ============================================================
# INDIAN NUMBER PLATE PATTERN
# ============================================================

INDIAN_PLATE_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"
)

# ============================================================
# LOAD MODELS
# ============================================================

print()
print("=" * 60)
print("LOADING MODELS")
print("=" * 60)

print("Loading vehicle YOLO...")

vehicle_model = YOLO(
    VEHICLE_MODEL
)

print("Vehicle YOLO loaded.")

print("Loading number-plate YOLO...")

plate_model = YOLO(
    PLATE_MODEL
)

print("Number-plate YOLO loaded.")

print("Loading PaddleOCR...")

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False
)

print("PaddleOCR loaded.")

# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text):

    if text is None:
        return ""

    text = str(text).upper()

    text = re.sub(
        r"[^A-Z0-9]",
        "",
        text
    )

    return text


# ============================================================
# INDIAN PLATE CHECK
# ============================================================

def is_indian_plate(text):

    text = clean_text(text)

    if not text:
        return False

    return bool(
        INDIAN_PLATE_PATTERN.fullmatch(
            text
        )
    )


# ============================================================
# OCR
# ============================================================

def run_ocr(image):

    try:

        if image is None:
            return []

        if len(image.shape) == 2:

            image = cv2.cvtColor(
                image,
                cv2.COLOR_GRAY2BGR
            )

        result = ocr.predict(
            image
        )

        if not result:
            return []

        data = result[0]

        try:

            texts = data["rec_texts"]
            scores = data["rec_scores"]

        except Exception:

            try:

                texts = data.rec_texts
                scores = data.rec_scores

            except Exception:

                return []

        output = []

        for text, score in zip(
            texts,
            scores
        ):

            text = clean_text(
                text
            )

            try:
                score = float(score)
            except:
                score = 0.0

            if text:

                output.append(
                    (
                        text,
                        score
                    )
                )

        return output

    except Exception as e:

        print(
            "OCR error:",
            e
        )

        return []


# ============================================================
# PLATE CROP
# ============================================================

def get_plate_crop(
    frame,
    x1,
    y1,
    x2,
    y2
):

    h, w = frame.shape[:2]

    plate_w = x2 - x1
    plate_h = y2 - y1

    # Small padding around plate
    pad_x = int(
        plate_w * 0.30
    )

    pad_y = int(
        plate_h * 0.40
    )

    x1 = max(
        0,
        x1 - pad_x
    )

    y1 = max(
        0,
        y1 - pad_y
    )

    x2 = min(
        w,
        x2 + pad_x
    )

    y2 = min(
        h,
        y2 + pad_y
    )

    crop = frame[
        y1:y2,
        x1:x2
    ]

    return crop


# ============================================================
# ENHANCE PLATE
# ============================================================

def enhance_plate(crop):

    if crop is None or crop.size == 0:
        return None

    # Upscale
    enlarged = cv2.resize(
        crop,
        None,
        fx=6,
        fy=6,
        interpolation=cv2.INTER_CUBIC
    )

    # Grayscale
    gray = cv2.cvtColor(
        enlarged,
        cv2.COLOR_BGR2GRAY
    )

    # CLAHE
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(
        gray
    )

    # Light sharpening
    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ])

    enhanced = cv2.filter2D(
        enhanced,
        -1,
        kernel
    )

    # Convert back to BGR
    enhanced = cv2.cvtColor(
        enhanced,
        cv2.COLOR_GRAY2BGR
    )

    return enhanced


# ============================================================
# OCR BEST RESULT
# ============================================================

def get_best_ocr(
    crop
):

    if crop is None or crop.size == 0:
        return "", 0.0

    results = []

    # Original enlarged
    original = cv2.resize(
        crop,
        None,
        fx=6,
        fy=6,
        interpolation=cv2.INTER_CUBIC
    )

    original_results = run_ocr(
        original
    )

    for text, score in original_results:

        results.append(
            (
                text,
                score
            )
        )

    # Enhanced
    enhanced = enhance_plate(
        crop
    )

    if enhanced is not None:

        enhanced_results = run_ocr(
            enhanced
        )

        for text, score in enhanced_results:

            results.append(
                (
                    text,
                    score
                )
            )

    if not results:

        return "", 0.0

    # Prefer valid Indian plate
    valid_results = [
        r for r in results
        if is_indian_plate(r[0])
    ]

    if valid_results:

        valid_results.sort(
            key=lambda x: x[1],
            reverse=True
        )

        return valid_results[0]

    # Otherwise highest confidence
    results.sort(
        key=lambda x: x[1],
        reverse=True
    )

    return results[0]


# ============================================================
# CENTER POINT
# ============================================================

def center_of_box(
    x1,
    y1,
    x2,
    y2
):

    return (
        (x1 + x2) / 2,
        (y1 + y2) / 2
    )


# ============================================================
# CHECK WHETHER PLATE BELONGS TO VEHICLE
# ============================================================

def plate_vehicle_match(
    plate_box,
    vehicle_box
):

    px1, py1, px2, py2 = plate_box

    vx1, vy1, vx2, vy2 = vehicle_box

    pcx, pcy = center_of_box(
        px1,
        py1,
        px2,
        py2
    )

    # Check plate center inside vehicle
    if (
        vx1 <= pcx <= vx2
        and
        vy1 <= pcy <= vy2
    ):
        return True

    # Otherwise calculate distance
    vcx, vcy = center_of_box(
        vx1,
        vy1,
        vx2,
        vy2
    )

    vehicle_width = max(
        1,
        vx2 - vx1
    )

    vehicle_height = max(
        1,
        vy2 - vy1
    )

    dx = abs(
        pcx - vcx
    ) / vehicle_width

    dy = abs(
        pcy - vcy
    ) / vehicle_height

    # Allow plate near vehicle
    if dx < 0.60 and dy < 0.60:
        return True

    return False


# ============================================================
# FIND ROAD FRAMES
# ============================================================

frames = sorted([
    f
    for f in os.listdir(
        INPUT_DIR
    )
    if f.lower().endswith(".jpg")
    and f.startswith("road_frame_")
])

print()
print(
    "Road frames found:",
    len(frames)
)

# ============================================================
# CSV
# ============================================================

csv_file = open(
    CSV_PATH,
    "w",
    newline="",
    encoding="utf-8"
)

writer = csv.writer(
    csv_file
)

writer.writerow([
    "Frame",
    "Vehicle ID",
    "Vehicle Type",
    "Vehicle Confidence",
    "Plate Number",
    "Plate Confidence",
    "OCR Confidence",
    "Indian Plate"
])

# ============================================================
# PROCESS FRAMES
# ============================================================

unique_vehicle_ids = set()

total_vehicle_detections = 0
total_plate_detections = 0
total_ocr_reads = 0
indian_plates = 0

for frame_number, frame_name in enumerate(
    frames,
    start=1
):

    print()
    print(
        f"[{frame_number}/{len(frames)}] "
        f"Processing {frame_name}"
    )

    frame_path = os.path.join(
        INPUT_DIR,
        frame_name
    )

    frame = cv2.imread(
        frame_path
    )

    if frame is None:

        print(
            "Could not read frame."
        )

        continue

    annotated = frame.copy()

    # ========================================================
    # VEHICLE TRACKING
    # ========================================================

    vehicle_results = vehicle_model.track(
        source=frame,
        persist=True,
        conf=0.35,
        iou=0.45,
        classes=list(
            VEHICLE_CLASSES.keys()
        ),
        verbose=False
    )

    vehicles = []

    for result in vehicle_results:

        if result.boxes is None:
            continue

        boxes = result.boxes

        for i in range(
            len(boxes)
        ):

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

            # Get tracker ID
            if boxes.id is not None:

                vehicle_id = int(
                    boxes.id[i]
                )

            else:

                vehicle_id = (
                    total_vehicle_detections
                    + 1
                )

            vehicle_type = VEHICLE_CLASSES[
                class_id
            ]

            unique_vehicle_ids.add(
                vehicle_id
            )

            total_vehicle_detections += 1

            vehicles.append({
                "id": vehicle_id,
                "type": vehicle_type,
                "confidence": confidence,
                "box": (
                    x1,
                    y1,
                    x2,
                    y2
                )
            })

    # ========================================================
    # NUMBER PLATE YOLO
    # ========================================================

    plate_results = plate_model.predict(
        source=frame,
        conf=0.15,
        iou=0.45,
        verbose=False
    )

    plates = []

    for result in plate_results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            plate_confidence = float(
                box.conf[0]
            )

            px1, py1, px2, py2 = map(
                int,
                box.xyxy[0].tolist()
            )

            plates.append({
                "confidence": plate_confidence,
                "box": (
                    px1,
                    py1,
                    px2,
                    py2
                )
            })

            total_plate_detections += 1

    # ========================================================
    # MATCH PLATES TO VEHICLES
    # ========================================================

    for plate_index, plate in enumerate(
        plates,
        start=1
    ):

        pbox = plate["box"]

        px1, py1, px2, py2 = pbox

        # Find matching vehicle
        matched_vehicle = None

        for vehicle in vehicles:

            if plate_vehicle_match(
                pbox,
                vehicle["box"]
            ):

                matched_vehicle = vehicle
                break

        # If no vehicle match
        if matched_vehicle is None:

            vehicle_id_text = "Unknown"

            vehicle_type = "Unknown"

            vehicle_confidence = 0.0

        else:

            vehicle_id_text = (
                f"Vehicle_{matched_vehicle['id']:03d}"
            )

            vehicle_type = (
                matched_vehicle["type"]
            )

            vehicle_confidence = (
                matched_vehicle["confidence"]
            )

        # ====================================================
        # CROP PLATE
        # ====================================================

        crop = get_plate_crop(
            frame,
            px1,
            py1,
            px2,
            py2
        )

        if crop is None or crop.size == 0:
            continue

        crop_filename = (
            f"{frame_name[:-4]}"
            f"_plate_{plate_index:02d}.jpg"
        )

        crop_path = os.path.join(
            PLATE_CROP_DIR,
            crop_filename
        )

        cv2.imwrite(
            crop_path,
            crop
        )

        # ====================================================
        # OCR
        # ====================================================

        plate_text, ocr_confidence = get_best_ocr(
            crop
        )

        total_ocr_reads += (
            1 if plate_text else 0
        )

        indian = (
            "YES"
            if is_indian_plate(
                plate_text
            )
            else (
                "NO"
                if plate_text
                else "UNKNOWN"
            )
        )

        if indian == "YES":
            indian_plates += 1

        if not plate_text:
            plate_text = "NOT READ"

        # ====================================================
        # SAVE CSV
        # ====================================================

        writer.writerow([
            frame_name,
            vehicle_id_text,
            vehicle_type,
            f"{vehicle_confidence:.3f}",
            plate_text,
            f"{plate['confidence']:.3f}",
            f"{ocr_confidence:.3f}",
            indian
        ])

        # ====================================================
        # DRAW PLATE
        # ====================================================

        cv2.rectangle(
            annotated,
            (px1, py1),
            (px2, py2),
            (0, 0, 255),
            2
        )

        # ====================================================
        # DRAW VEHICLE
        # ====================================================

        if matched_vehicle is not None:

            vx1, vy1, vx2, vy2 = (
                matched_vehicle["box"]
            )

            cv2.rectangle(
                annotated,
                (vx1, vy1),
                (vx2, vy2),
                (0, 255, 0),
                2
            )

            vehicle_label = (
                f"Vehicle_{matched_vehicle['id']:03d} "
                f"{vehicle_type} "
                f"{vehicle_confidence:.2f}"
            )

            cv2.putText(
                annotated,
                vehicle_label,
                (
                    vx1,
                    max(
                        25,
                        vy1 - 8
                    )
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 255, 0),
                2
            )

        # ====================================================
        # PLATE LABEL
        # ====================================================

        plate_label = (
            f"{plate_text} "
            f"OCR:{ocr_confidence:.2f} "
            f"{indian}"
        )

        cv2.putText(
            annotated,
            plate_label,
            (
                px1,
                min(
                    frame.shape[0] - 10,
                    py2 + 20
                )
            ),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.50,
            (0, 0, 255),
            2
        )

    # ========================================================
    # SAVE ANNOTATED FRAME
    # ========================================================

    output_path = os.path.join(
        ANNOTATED_DIR,
        frame_name
    )

    cv2.imwrite(
        output_path,
        annotated
    )

# ============================================================
# CLOSE CSV
# ============================================================

csv_file.close()

# ============================================================
# FINAL SUMMARY
# ============================================================

print()
print("=" * 60)
print("COMBINED VEHICLE + PLATE + OCR COMPLETE")
print("=" * 60)

print(
    "Frames processed       :",
    len(frames)
)

print(
    "Vehicle detections     :",
    total_vehicle_detections
)

print(
    "Unique vehicle IDs     :",
    len(unique_vehicle_ids)
)

print(
    "Plate detections       :",
    total_plate_detections
)

print(
    "OCR reads              :",
    total_ocr_reads
)

print(
    "Indian plates detected:",
    indian_plates
)

print()
print("CSV:")
print(CSV_PATH)

print()
print("Annotated frames:")
print(ANNOTATED_DIR)

print()
print("Plate crops:")
print(PLATE_CROP_DIR)

print()
print("DONE.")