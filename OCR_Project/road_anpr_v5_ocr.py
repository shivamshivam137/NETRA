import os
import re
import csv
import cv2
import numpy as np
from ultralytics import YOLO
from paddleocr import PaddleOCR

# ============================================================
# PATHS
# ============================================================

BASE_DIR = r"C:\OCR_Project"

MODEL_PATH = os.path.join(
    BASE_DIR,
    "yolo",
    "runs",
    "detect",
    "train",
    "weights",
    "best.pt"
)

INPUT_DIR = os.path.join(BASE_DIR, "images")

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "images",
    "road_anpr_results_v5_fast"
)

CROP_DIR = os.path.join(
    OUTPUT_DIR,
    "plate_crops"
)

ENHANCED_DIR = os.path.join(
    OUTPUT_DIR,
    "enhanced_crops"
)

ANNOTATED_DIR = os.path.join(
    OUTPUT_DIR,
    "annotated_frames"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CROP_DIR, exist_ok=True)
os.makedirs(ENHANCED_DIR, exist_ok=True)
os.makedirs(ANNOTATED_DIR, exist_ok=True)

CSV_PATH = os.path.join(
    OUTPUT_DIR,
    "road_anpr_v5_fast_results.csv"
)

# ============================================================
# LOAD YOLO
# ============================================================

print("Loading YOLO...")

model = YOLO(MODEL_PATH)

print("YOLO loaded.")

# ============================================================
# LOAD PADDLE OCR
# ============================================================

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
# INDIAN PLATE PATTERN
# ============================================================

INDIAN_PLATE_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"
)

# ============================================================
# CLEAN TEXT
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
# CHECK INDIAN PLATE
# ============================================================

def is_valid_plate(text):

    if not text:
        return False

    return bool(
        INDIAN_PLATE_PATTERN.fullmatch(text)
    )


# ============================================================
# PLATE CROP WITH PADDING
# ============================================================

def get_plate_crop(frame, box):

    h, w = frame.shape[:2]

    x1, y1, x2, y2 = box

    pw = x2 - x1
    ph = y2 - y1

    # Horizontal padding
    pad_x = int(pw * 0.30)

    # Vertical padding
    pad_y = int(ph * 0.45)

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
# CREATE ONLY 2 OCR VERSIONS
# ============================================================

def make_ocr_images(crop):

    if crop is None or crop.size == 0:
        return []

    # --------------------------------------------------------
    # Version 1: enlarged original
    # --------------------------------------------------------

    enlarged = cv2.resize(
        crop,
        None,
        fx=6,
        fy=6,
        interpolation=cv2.INTER_CUBIC
    )

    # --------------------------------------------------------
    # Version 2: grayscale + CLAHE + sharpen
    # --------------------------------------------------------

    gray = cv2.cvtColor(
        enlarged,
        cv2.COLOR_BGR2GRAY
    )

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)

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

    enhanced = cv2.cvtColor(
        enhanced,
        cv2.COLOR_GRAY2BGR
    )

    return [
        ("original", enlarged),
        ("enhanced", enhanced)
    ]


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

        result = ocr.predict(image)

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

            text = clean_text(text)

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
# GET BEST OCR
# ============================================================

def get_best_result(crop):

    versions = make_ocr_images(
        crop
    )

    all_results = []

    for version_name, image in versions:

        results = run_ocr(
            image
        )

        for text, confidence in results:

            valid = is_valid_plate(
                text
            )

            all_results.append({
                "text": text,
                "confidence": confidence,
                "version": version_name,
                "valid": valid,
                "image": image
            })

    if not all_results:

        return None

    # First preference:
    # valid Indian plate + highest confidence

    valid_results = [
        x for x in all_results
        if x["valid"]
    ]

    if valid_results:

        valid_results.sort(
            key=lambda x: x["confidence"],
            reverse=True
        )

        return valid_results[0]

    # Otherwise highest OCR confidence

    all_results.sort(
        key=lambda x: x["confidence"],
        reverse=True
    )

    return all_results[0]


# ============================================================
# FIND ROAD FRAMES
# ============================================================

frames = sorted([
    f
    for f in os.listdir(INPUT_DIR)
    if f.lower().endswith(".jpg")
    and f.startswith("road_frame_")
])

print()
print(
    "Road frames found:",
    len(frames)
)
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

writer = csv.writer(
    csv_file
)

writer.writerow([
    "frame",
    "plate_id",
    "yolo_confidence",
    "x1",
    "y1",
    "x2",
    "y2",
    "ocr_text",
    "ocr_confidence",
    "ocr_version",
    "valid_indian_plate"
])

# ============================================================
# PROCESS
# ============================================================

plate_id = 0

total_frames = 0
total_detections = 0
total_ocr = 0
valid_plates = 0

for frame_name in frames:

    frame_path = os.path.join(
        INPUT_DIR,
        frame_name
    )

    frame = cv2.imread(
        frame_path
    )

    if frame is None:
        continue

    total_frames += 1

    # --------------------------------------------------------
    # YOLO
    # --------------------------------------------------------

    results = model.predict(
        source=frame,
        conf=0.15,
        iou=0.45,
        verbose=False
    )

    annotated = frame.copy()

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            yolo_conf = float(
                box.conf[0]
            )

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0].tolist()
            )

            x1 = max(
                0,
                x1
            )

            y1 = max(
                0,
                y1
            )

            x2 = min(
                frame.shape[1],
                x2
            )

            y2 = min(
                frame.shape[0],
                y2
            )

            if x2 <= x1 or y2 <= y1:
                continue

            total_detections += 1

            plate_id += 1

            # ------------------------------------------------
            # CROP
            # ------------------------------------------------

            crop = get_plate_crop(
                frame,
                (x1, y1, x2, y2)
            )

            if crop is None or crop.size == 0:
                continue

            crop_path = os.path.join(
                CROP_DIR,
                f"plate_{plate_id:04d}.jpg"
            )

            cv2.imwrite(
                crop_path,
                crop
            )

            # ------------------------------------------------
            # OCR
            # ------------------------------------------------

            best = get_best_result(
                crop
            )

            text = ""
            ocr_conf = 0.0
            version = ""
            valid = False

            if best:

                text = best["text"]
                ocr_conf = best["confidence"]
                version = best["version"]
                valid = best["valid"]

                total_ocr += 1

                if valid:
                    valid_plates += 1

                # Save enhanced image
                enhanced_path = os.path.join(
                    ENHANCED_DIR,
                    f"plate_{plate_id:04d}_{version}.jpg"
                )

                cv2.imwrite(
                    enhanced_path,
                    best["image"]
                )

                writer.writerow([
                    frame_name,
                    plate_id,
                    f"{yolo_conf:.4f}",
                    x1,
                    y1,
                    x2,
                    y2,
                    text,
                    f"{ocr_conf:.4f}",
                    version,
                    valid
                ])

            # ------------------------------------------------
            # DRAW
            # ------------------------------------------------

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            label = (
                f"Plate {yolo_conf:.2f}"
            )

            if text:

                label += (
                    f" | {text}"
                    f" ({ocr_conf:.2f})"
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

    output_frame = os.path.join(
        ANNOTATED_DIR,
        frame_name
    )

    cv2.imwrite(
        output_frame,
        annotated
    )

    print(
        f"[{total_frames}/{len(frames)}] "
        f"{frame_name} processed"
    )


csv_file.close()

# ============================================================
# SUMMARY
# ============================================================

print()
print("=" * 60)
print("FAST V5 OCR COMPLETE")
print("=" * 60)

print(
    "Frames processed    :",
    total_frames
)

print(
    "Plate detections    :",
    total_detections
)

print(
    "OCR observations    :",
    total_ocr
)

print(
    "Valid Indian plates :",
    valid_plates
)

print()
print(
    "CSV:",
    CSV_PATH
)

print()
print(
    "Output:",
    OUTPUT_DIR
)

print()
print("DONE.")