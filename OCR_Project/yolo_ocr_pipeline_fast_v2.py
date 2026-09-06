import os
import glob
import re
import cv2
from ultralytics import YOLO
from paddleocr import PaddleOCR
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = r"C:\OCR_Project"

IMAGE_DIR = os.path.join(BASE_DIR, "images")
YOLO_MODEL = os.path.join(
    BASE_DIR,
    "yolo",
    "runs",
    "detect",
    "train",
    "weights",
    "best.pt"
)

OUTPUT_DIR = os.path.join(
    IMAGE_DIR,
    "yolo_ocr_fast_v2"
)

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
    "yolo_ocr_fast_v2_results.csv"
)


# ============================================================
# CREATE FOLDERS
# ============================================================

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CROP_DIR, exist_ok=True)
os.makedirs(ANNOTATED_DIR, exist_ok=True)


# ============================================================
# LOAD MODELS
# ============================================================

print("=" * 70)
print("LOADING YOLO...")
print("=" * 70)

plate_model = YOLO(YOLO_MODEL)

print("YOLO loaded successfully.")


print()
print("=" * 70)
print("LOADING PADDLEOCR...")
print("=" * 70)

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)

print("PaddleOCR loaded successfully.")


# ============================================================
# INDIAN PLATE VALIDATION
# ============================================================

def clean_text(text):
    if text is None:
        return ""

    text = str(text).upper()

    # Keep only letters and numbers
    text = re.sub(r"[^A-Z0-9]", "", text)

    return text


def is_indian_plate(text):

    text = clean_text(text)

    pattern = r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"

    return bool(re.match(pattern, text))


# ============================================================
# PADDLE OCR RESULT EXTRACTION
# ============================================================

def extract_ocr_results(result):

    texts = []
    confidences = []

    try:

        if result is None:
            return texts, confidences

        # PaddleOCR 3.x result object
        if isinstance(result, list):

            for item in result:

                if hasattr(item, "json"):
                    data = item.json

                    if callable(data):
                        data = data()

                elif isinstance(item, dict):
                    data = item

                else:
                    continue

                if not isinstance(data, dict):
                    continue

                # Common PaddleOCR structure
                res = data.get("res", data)

                if not isinstance(res, dict):
                    continue

                rec_texts = res.get("rec_texts", [])
                rec_scores = res.get("rec_scores", [])

                if rec_texts is None:
                    rec_texts = []

                if rec_scores is None:
                    rec_scores = []

                for i, txt in enumerate(rec_texts):

                    txt = clean_text(txt)

                    if not txt:
                        continue

                    score = 0.0

                    if i < len(rec_scores):
                        try:
                            score = float(rec_scores[i])
                        except:
                            score = 0.0

                    texts.append(txt)
                    confidences.append(score)

        return texts, confidences

    except Exception as e:

        print("OCR parsing error:", e)

        return texts, confidences


# ============================================================
# GET IMAGES
# ============================================================

image_files = sorted(
    glob.glob(
        os.path.join(
            IMAGE_DIR,
            "road_frame_*.jpg"
        )
    )
)

if not image_files:

    print()
    print("ERROR: No road frames found.")
    print(
        "Expected files like: "
        r"C:\OCR_Project\images\road_frame_001.jpg"
    )
    input("Press Enter to exit...")
    raise SystemExit


# ============================================================
# MAIN PROCESSING
# ============================================================

rows = []

frame_count = 0
plate_count = 0
ocr_count = 0
indian_count = 0

print()
print("=" * 70)
print("STARTING FAST YOLO + OCR PIPELINE V2")
print("=" * 70)
print()


for image_path in image_files:

    frame_count += 1

    filename = os.path.basename(image_path)

    image = cv2.imread(image_path)

    if image is None:
        print(f"[{frame_count}/{len(image_files)}] Could not read {filename}")
        continue

    annotated = image.copy()

    # --------------------------------------------------------
    # YOLO NUMBER PLATE DETECTION
    # --------------------------------------------------------

    results = plate_model.predict(
        source=image,
        conf=0.20,
        iou=0.45,
        verbose=False
    )

    frame_plate_index = 0

    for result in results:

        boxes = result.boxes

        if boxes is None:
            continue

        for box in boxes:

            frame_plate_index += 1
            plate_count += 1

            xyxy = box.xyxy[0].cpu().numpy()

            x1, y1, x2, y2 = map(int, xyxy)

            y1 = max(0, y1 - 8)
            y2 = min(image.shape[0], y2 + 8)

            x1 = max(0, x1 - 8)
            x2 = min(image.shape[1], x2 + 8)

            crop = image[y1:y2, x1:x2]

            if crop.size == 0:
                continue

            # ------------------------------------------------
            # SAVE PLATE CROP
            # ------------------------------------------------

            crop_name = (
                f"{os.path.splitext(filename)[0]}"
                f"_plate_{frame_plate_index}.jpg"
            )

            crop_path = os.path.join(
                CROP_DIR,
                crop_name
            )

            cv2.imwrite(crop_path, crop)

            # ------------------------------------------------
            # MAKE OCR IMAGE
            # ------------------------------------------------

            h, w = crop.shape[:2]

            if w < 20 or h < 8:
                print(
                    f"[{frame_count}/{len(image_files)}] "
                    f"Plate too small: {filename}"
                )
                continue

            # Resize
            scale = 4

            ocr_image = cv2.resize(
                crop,
                None,
                fx=scale,
                fy=scale,
                interpolation=cv2.INTER_CUBIC
            )

            # Slight grayscale enhancement
            gray = cv2.cvtColor(
                ocr_image,
                cv2.COLOR_BGR2GRAY
            )

            gray = cv2.equalizeHist(gray)

            # Convert back to BGR because PaddleOCR handles
            # standard image input reliably
            ocr_image = cv2.cvtColor(
                gray,
                cv2.COLOR_GRAY2BGR
            )

            # ------------------------------------------------
            # OCR
            # ------------------------------------------------

            try:

                ocr_result = ocr.predict(
                    ocr_image
                )

                texts, confidences = extract_ocr_results(
                    ocr_result
                )

            except Exception as e:

                print(
                    f"OCR error on {filename}: {e}"
                )

                texts = []
                confidences = []

            # ------------------------------------------------
            # SELECT BEST OCR RESULT
            # ------------------------------------------------

            best_text = ""
            best_conf = 0.0

            if texts:

                ocr_count += 1

                for text, conf in zip(
                    texts,
                    confidences
                ):

                    if conf > best_conf:

                        best_text = text
                        best_conf = conf

            # ------------------------------------------------
            # INDIAN PLATE CHECK
            # ------------------------------------------------

            indian = False

            if best_text:

                indian = is_indian_plate(
                    best_text
                )

                if indian:
                    indian_count += 1

            # ------------------------------------------------
            # YOLO CONFIDENCE
            # ------------------------------------------------

            try:
                plate_conf = float(
                    box.conf[0].cpu().numpy()
                )
            except:
                plate_conf = 0.0

            # ------------------------------------------------
            # PRINT RESULT
            # ------------------------------------------------

            if best_text:

                print(
                    f"[{frame_count}/{len(image_files)}] "
                    f"{filename} | "
                    f"Plate: {best_text} | "
                    f"OCR: {best_conf:.3f} | "
                    f"YOLO: {plate_conf:.3f} | "
                    f"Indian: {'YES' if indian else 'NO'}"
                )

            else:

                print(
                    f"[{frame_count}/{len(image_files)}] "
                    f"{filename} | "
                    f"Plate detected | "
                    f"OCR: NO READ | "
                    f"YOLO: {plate_conf:.3f}"
                )

            # ------------------------------------------------
            # SAVE CSV ROW
            # ------------------------------------------------

            rows.append({
                "Frame": filename,
                "Plate ID": frame_plate_index,
                "Plate Number": best_text if best_text else "NOT READ",
                "OCR Confidence": round(best_conf, 4),
                "YOLO Plate Confidence": round(
                    plate_conf,
                    4
                ),
                "Indian Plate": "YES" if indian else "UNKNOWN",
                "Crop Path": crop_path
            })

            # ------------------------------------------------
            # DRAW RESULT
            # ------------------------------------------------

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            label = (
                best_text
                if best_text
                else "OCR: NOT READ"
            )

            cv2.putText(
                annotated,
                label,
                (x1, max(25, y1 - 8)),
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
# SAVE CSV
# ============================================================

df = pd.DataFrame(rows)

df.to_csv(
    CSV_PATH,
    index=False
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print()
print("=" * 70)
print("FAST PIPELINE V2 COMPLETE")
print("=" * 70)

print()
print(f"Frames processed : {frame_count}")
print(f"Plate detections : {plate_count}")
print(f"OCR reads        : {ocr_count}")
print(f"Valid Indian plates: {indian_count}")

print()
print("CSV:")
print(CSV_PATH)

print()
print("Plate crops:")
print(CROP_DIR)

print()
print("Annotated frames:")
print(ANNOTATED_DIR)

print()
print("=" * 70)
print("DONE")
print("=" * 70)

input()