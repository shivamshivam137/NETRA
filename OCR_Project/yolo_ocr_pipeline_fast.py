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

OUTPUT_DIR = r"C:\OCR_Project\images\yolo_ocr_fast"

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
    "yolo_ocr_fast_results.csv"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CROP_DIR, exist_ok=True)
os.makedirs(ANNOTATED_DIR, exist_ok=True)


# ============================================================
# FAST SETTINGS
# ============================================================

YOLO_CONF = 0.20
YOLO_IOU = 0.45

PADDING = 8

# Smaller = faster
UPSCALE = 4

# Ignore extremely tiny plates
MIN_WIDTH = 20
MIN_HEIGHT = 8


# ============================================================
# INDIAN PLATE FORMAT
# ============================================================

INDIAN_PLATE_PATTERN = re.compile(
    r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"
)


# ============================================================
# CLEAN OCR TEXT
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
        INDIAN_PLATE_PATTERN.fullmatch(text)
    )


# ============================================================
# OCR RESULT PARSER
# ============================================================

def extract_ocr(result):

    best_text = ""
    best_conf = 0.0

    try:

        if not result:
            return "", 0.0

        data = result[0]

        # PaddleOCR 3.x
        if isinstance(data, dict):

            texts = data.get(
                "rec_texts",
                []
            )

            scores = data.get(
                "rec_scores",
                []
            )

            for i, text in enumerate(texts):

                text = clean_text(text)

                if i < len(scores):

                    conf = float(
                        scores[i]
                    )

                else:

                    conf = 0.0

                if (
                    text
                    and conf > best_conf
                ):

                    best_text = text
                    best_conf = conf

            return (
                best_text,
                best_conf
            )

        # Older PaddleOCR format
        if isinstance(data, list):

            for item in data:

                try:

                    if (
                        isinstance(item, list)
                        and len(item) >= 2
                    ):

                        info = item[1]

                        if (
                            isinstance(
                                info,
                                (tuple, list)
                            )
                            and len(info) >= 2
                        ):

                            text = clean_text(
                                info[0]
                            )

                            conf = float(
                                info[1]
                            )

                            if (
                                text
                                and conf > best_conf
                            ):

                                best_text = text
                                best_conf = conf

                except Exception:
                    continue

    except Exception:
        pass

    return (
        best_text,
        best_conf
    )


# ============================================================
# FAST PREPROCESSING
# ============================================================

def prepare_plate(crop):

    enlarged = cv2.resize(
        crop,
        None,
        fx=UPSCALE,
        fy=UPSCALE,
        interpolation=cv2.INTER_CUBIC
    )

    gray = cv2.cvtColor(
        enlarged,
        cv2.COLOR_BGR2GRAY
    )

    # Simple contrast enhancement
    gray = cv2.equalizeHist(
        gray
    )

    return gray


# ============================================================
# START
# ============================================================

print("=" * 70)
print("FAST YOLO + PADDLEOCR NUMBER PLATE PIPELINE")
print("=" * 70)


# ============================================================
# CHECK MODEL
# ============================================================

if not os.path.exists(MODEL_PATH):

    print("\nERROR: YOLO model not found:")
    print(MODEL_PATH)

    input("\nPress Enter to exit...")
    raise SystemExit


print("\nLoading YOLO...")

model = YOLO(
    MODEL_PATH
)

print("YOLO loaded.")


# ============================================================
# LOAD OCR
# ============================================================

print("\nLoading PaddleOCR...")

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)

print("PaddleOCR loaded.")


# ============================================================
# FIND FRAMES
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
    "\nFrames found:",
    len(image_files)
)


if not image_files:

    print(
        "\nERROR: No road frames found."
    )

    input("\nPress Enter to exit...")
    raise SystemExit


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
    "Plate ID",
    "Plate Confidence",
    "OCR Text",
    "OCR Confidence",
    "Indian Plate"
])


# ============================================================
# COUNTERS
# ============================================================

frames_processed = 0
plate_detections = 0
ocr_reads = 0
indian_plates = 0


# ============================================================
# PROCESS
# ============================================================

for image_path in image_files:

    frames_processed += 1

    filename = os.path.basename(
        image_path
    )

    print(
        f"\n[{frames_processed}/"
        f"{len(image_files)}] "
        f"{filename}"
    )


    # --------------------------------------------------------
    # IMAGE
    # --------------------------------------------------------

    image = cv2.imread(
        image_path
    )

    if image is None:
        continue


    annotated = image.copy()


    # --------------------------------------------------------
    # YOLO
    # --------------------------------------------------------

    results = model.predict(
        source=image,
        conf=YOLO_CONF,
        iou=YOLO_IOU,
        verbose=False
    )


    plate_id = 0


    # --------------------------------------------------------
    # DETECTIONS
    # --------------------------------------------------------

    for result in results:

        if result.boxes is None:
            continue


        for box in result.boxes:

            # -----------------------------------------------
            # BOX
            # -----------------------------------------------

            x1, y1, x2, y2 = (
                box.xyxy[0]
                .cpu()
                .numpy()
                .astype(int)
            )


            # -----------------------------------------------
            # CONFIDENCE
            # -----------------------------------------------

            plate_conf = float(
                box.conf[0]
                .cpu()
                .numpy()
            )


            # -----------------------------------------------
            # SIZE
            # -----------------------------------------------

            width = x2 - x1
            height = y2 - y1


            if (
                width < MIN_WIDTH
                or height < MIN_HEIGHT
            ):

                continue


            plate_id += 1
            plate_detections += 1


            # -----------------------------------------------
            # PADDING
            # -----------------------------------------------

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


            # -----------------------------------------------
            # CROP
            # -----------------------------------------------

            crop = image[
                y1:y2,
                x1:x2
            ]


            if crop.size == 0:
                continue


            # -----------------------------------------------
            # SAVE CROP
            # -----------------------------------------------

            crop_name = (
                f"{os.path.splitext(filename)[0]}_"
                f"plate_{plate_id:02d}.jpg"
            )

            crop_path = os.path.join(
                CROP_DIR,
                crop_name
            )

            cv2.imwrite(
                crop_path,
                crop
            )


            # -----------------------------------------------
            # PREPARE OCR IMAGE
            # -----------------------------------------------

            ocr_image = prepare_plate(
                crop
            )


            # -----------------------------------------------
            # ONE OCR PASS
            # -----------------------------------------------

            try:

                ocr_result = ocr.predict(
                    ocr_image
                )

                text, ocr_conf = (
                    extract_ocr(
                        ocr_result
                    )
                )

            except Exception as e:

                print(
                    "OCR error:",
                    e
                )

                text = ""
                ocr_conf = 0.0


            # -----------------------------------------------
            # CLEAN
            # -----------------------------------------------

            text = clean_text(
                text
            )


            if text:
                ocr_reads += 1


            # -----------------------------------------------
            # INDIAN PLATE
            # -----------------------------------------------

            if is_indian_plate(
                text
            ):

                indian = "YES"

                indian_plates += 1

            else:

                indian = "UNKNOWN"


            # -----------------------------------------------
            # PRINT
            # -----------------------------------------------

            print(
                f"  Plate {plate_id}: "
                f"YOLO={plate_conf:.2f} | "
                f"OCR={text or 'NOT READ'} | "
                f"OCR={ocr_conf:.2f} | "
                f"Indian={indian}"
            )


            # -----------------------------------------------
            # CSV
            # -----------------------------------------------

            writer.writerow([
                filename,
                plate_id,
                round(
                    plate_conf,
                    3
                ),
                text or "NOTREAD",
                round(
                    ocr_conf,
                    3
                ),
                indian
            ])


            # -----------------------------------------------
            # DRAW
            # -----------------------------------------------

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )


            label = (
                f"{text or 'NOT READ'} "
                f"Y:{plate_conf:.2f} "
                f"O:{ocr_conf:.2f}"
            )


            cv2.putText(
                annotated,
                label,
                (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )


    # --------------------------------------------------------
    # SAVE ANNOTATED
    # --------------------------------------------------------

    output_frame = os.path.join(
        ANNOTATED_DIR,
        filename
    )

    cv2.imwrite(
        output_frame,
        annotated
    )


# ============================================================
# CLOSE
# ============================================================

csv_file.close()


# ============================================================
# SUMMARY
# ============================================================

print("\n")
print("=" * 70)
print("FAST PIPELINE COMPLETE")
print("=" * 70)

print(
    "\nFrames processed:",
    frames_processed
)

print(
    "Plate detections:",
    plate_detections
)

print(
    "OCR reads:",
    ocr_reads
)

print(
    "Valid Indian plates:",
    indian_plates
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