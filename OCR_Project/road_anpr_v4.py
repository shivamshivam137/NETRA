import os
import re
import csv
import cv2
import numpy as np
from ultralytics import YOLO
from paddleocr import PaddleOCR

# ============================================================
# ROAD ANPR V4
# Indian Number Plate Validation + OCR Correction
# ============================================================

INPUT_FOLDER = r"C:\OCR_Project\images"
OUTPUT_FOLDER = r"C:\OCR_Project\images\road_anpr_results_v4"
MODEL_PATH = r"C:\OCR_Project\yolo\runs\detect\train\weights\best.pt"

PLATE_CROP_FOLDER = os.path.join(OUTPUT_FOLDER, "plate_crops")
ENHANCED_FOLDER = os.path.join(OUTPUT_FOLDER, "enhanced_crops")
ANNOTATED_FOLDER = os.path.join(OUTPUT_FOLDER, "annotated_frames")

os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(PLATE_CROP_FOLDER, exist_ok=True)
os.makedirs(ENHANCED_FOLDER, exist_ok=True)
os.makedirs(ANNOTATED_FOLDER, exist_ok=True)


# ============================================================
# LOAD YOLO
# ============================================================

print()
print("Loading YOLO plate model...")

model = YOLO(MODEL_PATH)

print("YOLO plate model loaded.")


# ============================================================
# LOAD PADDLEOCR
# ============================================================

print()
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
# OCR CHARACTER CLEANING
# ============================================================

def clean_text(text):
    """
    Keep only letters and numbers.
    Convert OCR output to uppercase.
    """

    if text is None:
        return ""

    text = str(text).upper()

    text = re.sub(r"[^A-Z0-9]", "", text)

    return text


# ============================================================
# OCR CHARACTER CORRECTION
# ============================================================

def correct_common_ocr_errors(text):
    """
    Correct common OCR mistakes.

    We do NOT blindly replace all characters because
    Indian registration numbers contain both letters and digits.

    Correction is performed according to expected positions.
    """

    text = clean_text(text)

    if len(text) < 6:
        return text

    # --------------------------------------------------------
    # Indian registration structure is approximately:
    #
    # STATE + DISTRICT + SERIES + NUMBER
    #
    # Example:
    # MH03FC0558
    #
    # Positions:
    # 0-1  = letters
    # 2-3  = digits
    # 4+   = series / number
    # --------------------------------------------------------

    chars = list(text)

    # First two characters should normally be letters.
    letter_map = {
        "0": "O",
        "1": "I",
        "2": "Z",
        "5": "S",
        "6": "G",
        "8": "B"
    }

    for i in range(min(2, len(chars))):
        if chars[i] in letter_map:
            chars[i] = letter_map[chars[i]]

    # Characters 2 and 3 should normally be digits.
    digit_map = {
        "O": "0",
        "Q": "0",
        "D": "0",
        "I": "1",
        "L": "1",
        "Z": "2",
        "S": "5",
        "G": "6",
        "T": "7",
        "B": "8"
    }

    if len(chars) >= 4:

        for i in [2, 3]:

            if chars[i] in digit_map:
                chars[i] = digit_map[chars[i]]

    return "".join(chars)


# ============================================================
# INDIAN NUMBER PLATE VALIDATION
# ============================================================

def validate_indian_plate(text):
    """
    Check whether OCR output resembles a standard
    Indian vehicle registration number.

    Examples:

    MH03FC0558
    DL01AB1234
    KA01AB1234
    GJ05XY1234
    """

    text = correct_common_ocr_errors(text)

    if len(text) < 8 or len(text) > 12:
        return False, text

    # Standard state/UT code:
    # 2 letters
    #
    # District:
    # 1-2 digits
    #
    # Series:
    # 1-3 letters
    #
    # Vehicle number:
    # 1-4 digits

    pattern = r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"

    if re.match(pattern, text):
        return True, text

    return False, text


# ============================================================
# ENHANCE PLATE
# ============================================================

def enhance_plate(image):

    if image is None or image.size == 0:
        return None

    # Upscale significantly
    image = cv2.resize(
        image,
        None,
        fx=10,
        fy=10,
        interpolation=cv2.INTER_CUBIC
    )

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Contrast enhancement
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)

    # Noise reduction
    enhanced = cv2.bilateralFilter(
        enhanced,
        9,
        75,
        75
    )

    # Sharpen
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
# OCR FUNCTION
# ============================================================

def run_ocr(image):

    results = []

    if image is None:
        return results

    try:

        # Make sure image has 3 channels
        if len(image.shape) == 2:

            image = cv2.cvtColor(
                image,
                cv2.COLOR_GRAY2BGR
            )

        output = ocr.predict(image)

        for result in output:

            try:

                texts = result["rec_texts"]
                scores = result["rec_scores"]

            except Exception:

                try:
                    texts = result.rec_texts
                    scores = result.rec_scores

                except Exception:
                    continue

            for text, score in zip(texts, scores):

                text = clean_text(text)

                try:
                    score = float(score)
                except:
                    score = 0.0

                if text:

                    results.append(
                        (text, score)
                    )

    except Exception as e:

        print(
            "OCR error:",
            e
        )

    return results


# ============================================================
# FIND ROAD FRAMES
# ============================================================

frames = sorted([
    f for f in os.listdir(INPUT_FOLDER)
    if f.lower().endswith(".jpg")
    and f.startswith("road_frame_")
])

print()
print(
    f"Found {len(frames)} road frames."
)

if len(frames) == 0:

    print(
        "No road frames found."
    )

    raise SystemExit


# ============================================================
# CSV FILE
# ============================================================

csv_path = os.path.join(
    OUTPUT_FOLDER,
    "road_anpr_v4_results.csv"
)

csv_file = open(
    csv_path,
    "w",
    newline="",
    encoding="utf-8"
)

writer = csv.writer(csv_file)

writer.writerow([
    "Frame",
    "Plate_ID",
    "YOLO_Confidence",
    "Raw_OCR",
    "OCR_Confidence",
    "Corrected_OCR",
    "Indian_Plate_Valid"
])


# ============================================================
# PROCESS FRAMES
# ============================================================

total_detections = 0
total_ocr = 0
valid_plates = []

plate_id = 0


for frame_number, frame_name in enumerate(
    frames,
    start=1
):

    print()
    print("=" * 60)

    print(
        f"FRAME {frame_number}/{len(frames)} : {frame_name}"
    )

    print("=" * 60)

    image_path = os.path.join(
        INPUT_FOLDER,
        frame_name
    )

    image = cv2.imread(
        image_path
    )

    if image is None:

        print(
            "Could not read frame."
        )

        continue


    # --------------------------------------------------------
    # YOLO DETECTION
    # --------------------------------------------------------

    results = model.predict(
        source=image,
        conf=0.08,
        iou=0.45,
        verbose=False
    )

    annotated = image.copy()

    frame_plate_count = 0


    for result in results:

        if result.boxes is None:
            continue


        boxes = result.boxes.xyxy.cpu().numpy()

        confidences = result.boxes.conf.cpu().numpy()


        for box, confidence in zip(
            boxes,
            confidences
        ):

            x1, y1, x2, y2 = map(
                int,
                box
            )

            confidence = float(
                confidence
            )


            # ------------------------------------------------
            # PADDING
            # ------------------------------------------------

            width = x2 - x1
            height = y2 - y1

            pad_x = int(
                width * 0.35
            )

            pad_y = int(
                height * 0.60
            )


            x1p = max(
                0,
                x1 - pad_x
            )

            y1p = max(
                0,
                y1 - pad_y
            )

            x2p = min(
                image.shape[1],
                x2 + pad_x
            )

            y2p = min(
                image.shape[0],
                y2 + pad_y
            )


            crop = image[
                y1p:y2p,
                x1p:x2p
            ]


            if crop.size == 0:
                continue


            plate_id += 1
            frame_plate_count += 1
            total_detections += 1


            # ------------------------------------------------
            # SAVE ORIGINAL CROP
            # ------------------------------------------------

            crop_name = (
                f"plate_{plate_id:04d}.jpg"
            )

            crop_path = os.path.join(
                PLATE_CROP_FOLDER,
                crop_name
            )

            cv2.imwrite(
                crop_path,
                crop
            )


            # ------------------------------------------------
            # ENHANCE
            # ------------------------------------------------

            enhanced = enhance_plate(
                crop
            )


            if enhanced is None:
                continue


            enhanced_path = os.path.join(
                ENHANCED_FOLDER,
                crop_name
            )

            cv2.imwrite(
                enhanced_path,
                enhanced
            )


            # ------------------------------------------------
            # OCR ORIGINAL
            # ------------------------------------------------

            original_results = run_ocr(
                cv2.resize(
                    crop,
                    None,
                    fx=10,
                    fy=10,
                    interpolation=cv2.INTER_CUBIC
                )
            )


            # ------------------------------------------------
            # OCR ENHANCED
            # ------------------------------------------------

            enhanced_results = run_ocr(
                enhanced
            )


            all_ocr = (
                original_results +
                enhanced_results
            )


            if not all_ocr:

                print(
                    f"Plate {plate_id} detected "
                    f"but OCR found no text."
                )

            else:

                best_raw = None
                best_score = 0.0
                best_corrected = ""
                best_valid = False


                # ------------------------------------------------
                # Examine OCR results
                # ------------------------------------------------

                for raw_text, score in all_ocr:

                    corrected = correct_common_ocr_errors(
                        raw_text
                    )

                    valid, corrected = validate_indian_plate(
                        corrected
                    )


                    if valid:

                        # Give valid Indian plates a strong priority
                        adjusted_score = score + 0.25

                    else:

                        adjusted_score = score


                    if (
                        best_raw is None
                        or adjusted_score > best_score
                    ):

                        best_raw = raw_text
                        best_score = adjusted_score
                        best_corrected = corrected
                        best_valid = valid


                # ------------------------------------------------
                # Save only useful OCR observations
                # ------------------------------------------------

                if best_raw is not None:

                    total_ocr += 1


                    if best_valid:

                        valid_plates.append(
                            (
                                best_corrected,
                                best_score,
                                frame_name,
                                plate_id
                            )
                        )


                        print(
                            f"Plate {plate_id} | "
                            f"YOLO confidence = "
                            f"{confidence:.3f}"
                        )

                        print(
                            f"   OCR = {best_raw} "
                            f"confidence={best_score:.2f}"
                        )

                        print(
                            f"   Corrected = "
                            f"{best_corrected}"
                        )

                        print(
                            "   Indian plate = VALID"
                        )

                    else:

                        print(
                            f"Plate {plate_id} | "
                            f"OCR = {best_raw} "
                            f"confidence={best_score:.2f}"
                        )

                        print(
                            f"   Corrected = "
                            f"{best_corrected}"
                        )

                        print(
                            "   Indian plate = NOT VALID"
                        )


                    writer.writerow([
                        frame_name,
                        plate_id,
                        f"{confidence:.3f}",
                        best_raw,
                        f"{best_score:.2f}",
                        best_corrected,
                        best_valid
                    ])


            # ------------------------------------------------
            # DRAW DETECTION
            # ------------------------------------------------

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )


            cv2.putText(
                annotated,
                f"Plate {plate_id}",
                (x1, max(20, y1 - 5)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )


    print(
        f"Plates detected in frame: "
        f"{frame_plate_count}"
    )


    # --------------------------------------------------------
    # SAVE ANNOTATED FRAME
    # --------------------------------------------------------

    annotated_path = os.path.join(
        ANNOTATED_FOLDER,
        frame_name
    )

    cv2.imwrite(
        annotated_path,
        annotated
    )


csv_file.close()


# ============================================================
# FINAL SUMMARY
# ============================================================

print()
print("=" * 60)
print("ROAD ANPR V4 COMPLETED")
print("=" * 60)

print(
    f"Frames processed : {len(frames)}"
)

print(
    f"Plate detections : {total_detections}"
)

print(
    f"OCR observations : {total_ocr}"
)

print(
    f"Valid Indian plates : {len(valid_plates)}"
)


# ============================================================
# FREQUENT VALID PLATES
# ============================================================

from collections import Counter

plate_counter = Counter(
    plate[0]
    for plate in valid_plates
)


print()
print(
    "Most frequently detected VALID Indian plates:"
)

if plate_counter:

    for plate, count in plate_counter.most_common():

        print(
            f"   {plate} -> "
            f"{count} observations"
        )

else:

    print(
        "   No valid Indian plates found."
    )


# ============================================================
# OUTPUT
# ============================================================

print()
print(
    "CSV file:"
)

print(
    csv_path
)

print()
print(
    "Output folder:"
)

print(
    OUTPUT_FOLDER
)

print()
print(
    "Done."
)