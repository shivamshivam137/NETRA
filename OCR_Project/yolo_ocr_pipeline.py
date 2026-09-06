import os
import re
import csv
import cv2
from ultralytics import YOLO
from paddleocr import PaddleOCR


# ============================================================
# PATHS
# ============================================================

IMAGE_DIR = r"C:\OCR_Project\images"

MODEL_PATH = r"C:\OCR_Project\yolo\runs\detect\train\weights\best.pt"

OUTPUT_DIR = r"C:\OCR_Project\images\yolo_ocr_results"

CROP_DIR = os.path.join(
    OUTPUT_DIR,
    "plate_crops"
)

ANNOTATED_DIR = os.path.join(
    OUTPUT_DIR,
    "annotated_frames"
)

CSV_PATH = os.path.join(
    OUTPUT_DIR,
    "yolo_ocr_results.csv"
)


# ============================================================
# SETTINGS
# ============================================================

# YOLO confidence for number-plate detection
YOLO_CONF = 0.15

# YOLO NMS IoU
YOLO_IOU = 0.45

# Extra pixels around detected plate
PADDING = 10

# Upscale factor for OCR
UPSCALE = 6


# ============================================================
# CREATE OUTPUT FOLDERS
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

os.makedirs(
    CROP_DIR,
    exist_ok=True
)

os.makedirs(
    ANNOTATED_DIR,
    exist_ok=True
)


# ============================================================
# INDIAN NUMBER PLATE REGEX
# ============================================================

INDIAN_PLATE_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"
)


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_ocr_text(text):

    if text is None:
        return ""

    text = str(text).upper()

    # Remove spaces and special characters
    text = re.sub(
        r"[^A-Z0-9]",
        "",
        text
    )

    return text


# ============================================================
# INDIAN PLATE VALIDATION
# ============================================================

def is_indian_plate(text):

    text = clean_ocr_text(text)

    if not text:
        return False

    return bool(
        INDIAN_PLATE_PATTERN.fullmatch(text)
    )


# ============================================================
# OCR CHARACTER NORMALIZATION
# ============================================================

def normalize_plate(text):

    text = clean_ocr_text(text)

    if not text:
        return ""

    return text


# ============================================================
# PREPROCESSING
# ============================================================

def preprocess_plate(crop):

    # Resize first
    enlarged = cv2.resize(
        crop,
        None,
        fx=UPSCALE,
        fy=UPSCALE,
        interpolation=cv2.INTER_CUBIC
    )

    # Convert to grayscale
    gray = cv2.cvtColor(
        enlarged,
        cv2.COLOR_BGR2GRAY
    )

    # CLAHE contrast enhancement
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(
        gray
    )

    # Mild sharpening
    blurred = cv2.GaussianBlur(
        enhanced,
        (0, 0),
        3
    )

    sharpened = cv2.addWeighted(
        enhanced,
        1.5,
        blurred,
        -0.5,
        0
    )

    return enlarged, sharpened


# ============================================================
# OCR RESULT EXTRACTION
# ============================================================

def extract_ocr_result(result):

    best_text = ""
    best_confidence = 0.0

    try:

        # PaddleOCR 3.x result structure
        if not result:
            return "", 0.0

        data = result[0]

        # New PaddleOCR structure
        if isinstance(data, dict):

            rec_texts = data.get(
                "rec_texts",
                []
            )

            rec_scores = data.get(
                "rec_scores",
                []
            )

            if rec_texts:

                for i, text in enumerate(
                    rec_texts
                ):

                    text = clean_ocr_text(
                        text
                    )

                    if i < len(rec_scores):

                        confidence = float(
                            rec_scores[i]
                        )

                    else:

                        confidence = 0.0

                    if (
                        text
                        and confidence >
                        best_confidence
                    ):

                        best_text = text

                        best_confidence = (
                            confidence
                        )

                return (
                    best_text,
                    best_confidence
                )


        # Older PaddleOCR structure
        if isinstance(data, list):

            for item in data:

                try:

                    if (
                        isinstance(item, list)
                        and len(item) >= 2
                    ):

                        text_info = item[1]

                        if (
                            isinstance(
                                text_info,
                                tuple
                            )
                            or isinstance(
                                text_info,
                                list
                            )
                        ):

                            text = clean_ocr_text(
                                text_info[0]
                            )

                            confidence = float(
                                text_info[1]
                            )

                            if (
                                text
                                and confidence >
                                best_confidence
                            ):

                                best_text = text

                                best_confidence = (
                                    confidence
                                )

                except Exception:
                    continue

    except Exception as e:

        print(
            "OCR parsing warning:",
            e
        )

    return (
        best_text,
        best_confidence
    )


# ============================================================
# START
# ============================================================

print("=" * 70)
print("YOLO + PADDLEOCR NUMBER PLATE PIPELINE")
print("=" * 70)


# ============================================================
# CHECK MODEL
# ============================================================

print("\nChecking YOLO model...")

if not os.path.exists(MODEL_PATH):

    print("\nERROR: YOLO model not found:")
    print(MODEL_PATH)

    input("\nPress Enter to exit...")
    raise SystemExit

print("YOLO model found.")


# ============================================================
# LOAD YOLO
# ============================================================

print("\nLoading YOLO plate detector...")

model = YOLO(
    MODEL_PATH
)

print("YOLO loaded successfully.")

print("\nYOLO classes:")

print(
    model.names
)


# ============================================================
# LOAD PADDLEOCR
# ============================================================

print("\nLoading PaddleOCR...")

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)

print("PaddleOCR loaded successfully.")


# ============================================================
# FIND ROAD FRAMES
# ============================================================

image_files = []

for filename in sorted(
    os.listdir(IMAGE_DIR)
):

    if (
        filename.startswith(
            "road_frame_"
        )
        and filename.lower().endswith(
            (".jpg", ".jpeg", ".png")
        )
    ):

        image_files.append(
            os.path.join(
                IMAGE_DIR,
                filename
            )
        )


print(
    "\nRoad frames found:",
    len(image_files)
)


if len(image_files) == 0:

    print(
        "\nERROR: No road frames found."
    )

    print(
        "Expected files like:"
    )

    print(
        r"C:\OCR_Project\images\road_frame_001.jpg"
    )

    input("\nPress Enter to exit...")
    raise SystemExit


# ============================================================
# CSV HEADER
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
    "Plate ID",
    "Plate Confidence",
    "OCR Text",
    "OCR Confidence",
    "Indian Plate"
])


# ============================================================
# PROCESS FRAMES
# ============================================================

total_frames = 0
total_detections = 0
total_ocr = 0
total_indian = 0


for image_path in image_files:

    total_frames += 1

    filename = os.path.basename(
        image_path
    )

    frame_name = os.path.splitext(
        filename
    )[0]

    print(
        f"\nProcessing {total_frames}/"
        f"{len(image_files)}: "
        f"{filename}"
    )


    # --------------------------------------------------------
    # LOAD IMAGE
    # --------------------------------------------------------

    image = cv2.imread(
        image_path
    )

    if image is None:

        print(
            "Could not read image."
        )

        continue


    annotated = image.copy()


    # --------------------------------------------------------
    # YOLO PLATE DETECTION
    # --------------------------------------------------------

    results = model.predict(
        source=image,
        conf=YOLO_CONF,
        iou=YOLO_IOU,
        verbose=False
    )


    plate_counter = 0


    # --------------------------------------------------------
    # PROCESS DETECTIONS
    # --------------------------------------------------------

    for result in results:

        if result.boxes is None:
            continue

        boxes = result.boxes

        for box in boxes:

            plate_counter += 1

            total_detections += 1


            # ------------------------------------------------
            # BOUNDING BOX
            # ------------------------------------------------

            x1, y1, x2, y2 = (
                box.xyxy[0]
                .cpu()
                .numpy()
                .astype(int)
            )


            # ------------------------------------------------
            # CONFIDENCE
            # ------------------------------------------------

            plate_confidence = float(
                box.conf[0]
                .cpu()
                .numpy()
            )


            # ------------------------------------------------
            # PADDING
            # ------------------------------------------------

            h, w = image.shape[:2]

            x1 = max(
                0,
                x1 - PADDING
            )

            y1 = max(
                0,
                y1 - PADDING
            )

            x2 = min(
                w,
                x2 + PADDING
            )

            y2 = min(
                h,
                y2 + PADDING
            )


            # ------------------------------------------------
            # CROP PLATE
            # ------------------------------------------------

            crop = image[
                y1:y2,
                x1:x2
            ]


            if crop.size == 0:

                continue


            # ------------------------------------------------
            # SAVE ORIGINAL CROP
            # ------------------------------------------------

            crop_filename = (
                f"{frame_name}_"
                f"plate_{plate_counter:02d}.jpg"
            )

            crop_path = os.path.join(
                CROP_DIR,
                crop_filename
            )

            cv2.imwrite(
                crop_path,
                crop
            )


            # ------------------------------------------------
            # PREPROCESS
            # ------------------------------------------------

            enlarged, enhanced = (
                preprocess_plate(
                    crop
                )
            )


            # ------------------------------------------------
            # OCR PASS 1
            # ORIGINAL ENLARGED
            # ------------------------------------------------

            try:

                ocr_result_1 = ocr.predict(
                    enlarged
                )

                text1, conf1 = (
                    extract_ocr_result(
                        ocr_result_1
                    )
                )

            except Exception as e:

                print(
                    "OCR pass 1 error:",
                    e
                )

                text1 = ""
                conf1 = 0.0


            # ------------------------------------------------
            # OCR PASS 2
            # ENHANCED
            # ------------------------------------------------

            try:

                ocr_result_2 = ocr.predict(
                    enhanced
                )

                text2, conf2 = (
                    extract_ocr_result(
                        ocr_result_2
                    )
                )

            except Exception as e:

                print(
                    "OCR pass 2 error:",
                    e
                )

                text2 = ""
                conf2 = 0.0


            # ------------------------------------------------
            # CHOOSE BEST OCR RESULT
            # ------------------------------------------------

            candidates = []

            if text1:

                candidates.append(
                    (
                        text1,
                        conf1
                    )
                )

            if text2:

                candidates.append(
                    (
                        text2,
                        conf2
                    )
                )


            if candidates:

                # Prefer valid Indian plate
                valid_candidates = [
                    item
                    for item in candidates
                    if is_indian_plate(
                        item[0]
                    )
                ]


                if valid_candidates:

                    best_text, ocr_confidence = (
                        max(
                            valid_candidates,
                            key=lambda x: x[1]
                        )
                    )

                else:

                    best_text, ocr_confidence = (
                        max(
                            candidates,
                            key=lambda x: x[1]
                        )
                    )

                total_ocr += 1

            else:

                best_text = ""

                ocr_confidence = 0.0


            # ------------------------------------------------
            # CLEAN OCR
            # ------------------------------------------------

            best_text = normalize_plate(
                best_text
            )


            # ------------------------------------------------
            # INDIAN VALIDATION
            # ------------------------------------------------

            if is_indian_plate(
                best_text
            ):

                indian_plate = "YES"

                total_indian += 1

            elif (
                best_text
                and ocr_confidence >= 0.80
            ):

                indian_plate = "UNKNOWN"

            else:

                indian_plate = "UNKNOWN"


            # ------------------------------------------------
            # PRINT OCR RESULT
            # ------------------------------------------------

            print(
                f"  Plate {plate_counter}: "
                f"YOLO={plate_confidence:.3f} | "
                f"OCR={best_text or 'NOT READ'} | "
                f"OCR Conf={ocr_confidence:.3f} | "
                f"Indian={indian_plate}"
            )


            # ------------------------------------------------
            # SAVE CSV
            # ------------------------------------------------

            writer.writerow([
                filename,
                plate_counter,
                round(
                    plate_confidence,
                    3
                ),
                best_text or "NOTREAD",
                round(
                    ocr_confidence,
                    3
                ),
                indian_plate
            ])


            # ------------------------------------------------
            # DRAW BOX
            # ------------------------------------------------

            label = (
                f"{best_text or 'NOT READ'} "
                f"YOLO:{plate_confidence:.2f} "
                f"OCR:{ocr_confidence:.2f}"
            )


            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )


            cv2.putText(
                annotated,
                label,
                (x1, max(25, y1 - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 255, 0),
                2
            )


    # --------------------------------------------------------
    # SAVE ANNOTATED FRAME
    # --------------------------------------------------------

    annotated_path = os.path.join(
        ANNOTATED_DIR,
        filename
    )

    cv2.imwrite(
        annotated_path,
        annotated
    )


# ============================================================
# CLOSE CSV
# ============================================================

csv_file.close()


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("FINAL RESULTS")
print("=" * 70)

print(
    "\nFrames processed:",
    total_frames
)

print(
    "Plate detections:",
    total_detections
)

print(
    "OCR observations:",
    total_ocr
)

print(
    "Valid Indian plates:",
    total_indian
)

print("\nCSV:")
print(
    CSV_PATH
)

print("\nPlate crops:")
print(
    CROP_DIR
)

print("\nAnnotated frames:")
print(
    ANNOTATED_DIR
)

print("\nDONE.")

input("\nPress Enter to exit...")