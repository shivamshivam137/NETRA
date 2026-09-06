import os
import cv2
import csv
import re
from collections import Counter

from ultralytics import YOLO
from paddleocr import PaddleOCR


# ============================================================
# PATHS
# ============================================================

PLATE_MODEL = r"yolo\runs\detect\train\weights\best.pt"
INPUT_FOLDER = r"images"
OUTPUT_FOLDER = r"images\road_anpr_results_v3"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(os.path.join(OUTPUT_FOLDER, "annotated"), exist_ok=True)
os.makedirs(os.path.join(OUTPUT_FOLDER, "plate_crops"), exist_ok=True)
os.makedirs(os.path.join(OUTPUT_FOLDER, "enhanced_crops"), exist_ok=True)


# ============================================================
# LOAD YOLO
# ============================================================

print("\nLoading YOLO plate model...")

plate_model = YOLO(PLATE_MODEL)

print("YOLO plate model loaded.")


# ============================================================
# LOAD PADDLEOCR
# ============================================================

print("\nLoading PaddleOCR...")

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False
)

print("PaddleOCR loaded.")


# ============================================================
# FIND ROAD FRAMES
# ============================================================

frames = sorted([
    f for f in os.listdir(INPUT_FOLDER)
    if f.startswith("road_frame_") and f.endswith(".jpg")
])

print(f"\nFound {len(frames)} road frames.")


if len(frames) == 0:

    print("No road frames found.")

    exit()


# ============================================================
# OCR FUNCTION
# ============================================================

def run_ocr(image):

    results = []

    if image is None:
        return results

    if image.size == 0:
        return results

    try:

        # PaddleOCR expects a 3-channel image
        if len(image.shape) == 2:

            image = cv2.cvtColor(
                image,
                cv2.COLOR_GRAY2BGR
            )

        output = ocr.predict(image)

        for result in output:

            try:

                # IMPORTANT:
                # PaddleOCR 3.x result behaves like a dictionary.
                texts = result["rec_texts"]
                scores = result["rec_scores"]

            except Exception:

                # Fallback
                try:

                    texts = result.rec_texts
                    scores = result.rec_scores

                except Exception as e:

                    print(
                        "Could not read OCR result:",
                        e
                    )

                    continue


            # Make sure both are lists
            if texts is None:
                continue

            if scores is None:
                continue


            for text, score in zip(
                texts,
                scores
            ):

                if text is None:
                    continue

                text = str(text).strip()

                if text == "":
                    continue

                try:
                    score = float(score)

                except:

                    score = 0.0


                results.append(
                    (
                        text,
                        score
                    )
                )


    except Exception as e:

        print(
            "OCR error:",
            str(e)
        )


    return results


# ============================================================
# CLEAN OCR TEXT
# ============================================================

def clean_text(text):

    text = str(text).upper()

    text = re.sub(
        r"[^A-Z0-9]",
        "",
        text
    )

    return text


# ============================================================
# ENHANCE PLATE
# ============================================================

def enhance_plate(crop):

    if crop is None:
        return None

    if crop.size == 0:
        return None


    # --------------------------------------------------------
    # UPSCALE
    # --------------------------------------------------------

    enlarged = cv2.resize(
        crop,
        None,
        fx=10,
        fy=10,
        interpolation=cv2.INTER_CUBIC
    )


    # --------------------------------------------------------
    # GRAYSCALE
    # --------------------------------------------------------

    gray = cv2.cvtColor(
        enlarged,
        cv2.COLOR_BGR2GRAY
    )


    # --------------------------------------------------------
    # CLAHE
    # --------------------------------------------------------

    clahe = cv2.createCLAHE(
        clipLimit=3.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)


    # --------------------------------------------------------
    # DENOISE
    # --------------------------------------------------------

    enhanced = cv2.bilateralFilter(
        enhanced,
        7,
        50,
        50
    )


    # --------------------------------------------------------
    # SHARPEN
    # --------------------------------------------------------

    blur = cv2.GaussianBlur(
        enhanced,
        (0, 0),
        2
    )

    sharpened = cv2.addWeighted(
        enhanced,
        1.7,
        blur,
        -0.7,
        0
    )


    return sharpened


# ============================================================
# PROCESS FRAMES
# ============================================================

all_results = []

plate_id = 0


for frame_number, filename in enumerate(
    frames,
    start=1
):

    print("\n" + "=" * 60)

    print(
        f"FRAME {frame_number}/{len(frames)} : {filename}"
    )

    print("=" * 60)


    image_path = os.path.join(
        INPUT_FOLDER,
        filename
    )


    image = cv2.imread(
        image_path
    )


    if image is None:

        print(
            "Could not read frame."
        )

        continue


    annotated = image.copy()

    height, width = image.shape[:2]


    # ========================================================
    # YOLO PLATE DETECTION
    # ========================================================

    detections = plate_model.predict(
        source=image,
        conf=0.08,
        iou=0.45,
        verbose=False
    )


    frame_plate_count = 0


    for detection_result in detections:

        if detection_result.boxes is None:
            continue


        boxes = (
            detection_result
            .boxes
            .xyxy
            .cpu()
            .numpy()
        )


        confidences = (
            detection_result
            .boxes
            .conf
            .cpu()
            .numpy()
        )


        for box, yolo_conf in zip(
            boxes,
            confidences
        ):

            x1, y1, x2, y2 = map(
                int,
                box
            )


            frame_plate_count += 1

            plate_id += 1


            # =================================================
            # PLATE SIZE
            # =================================================

            plate_width = x2 - x1
            plate_height = y2 - y1


            if plate_width <= 0:
                continue

            if plate_height <= 0:
                continue


            # =================================================
            # PADDING
            # =================================================

            pad_x = int(
                plate_width * 0.35
            )

            pad_y = int(
                plate_height * 0.60
            )


            crop_x1 = max(
                0,
                x1 - pad_x
            )

            crop_y1 = max(
                0,
                y1 - pad_y
            )

            crop_x2 = min(
                width,
                x2 + pad_x
            )

            crop_y2 = min(
                height,
                y2 + pad_y
            )


            # =================================================
            # CROP
            # =================================================

            crop = image[
                crop_y1:crop_y2,
                crop_x1:crop_x2
            ]


            if crop.size == 0:
                continue


            # =================================================
            # SAVE ORIGINAL CROP
            # =================================================

            crop_name = (
                f"plate_{plate_id:04d}.jpg"
            )


            crop_path = os.path.join(
                OUTPUT_FOLDER,
                "plate_crops",
                crop_name
            )


            cv2.imwrite(
                crop_path,
                crop
            )


            # =================================================
            # ENHANCE
            # =================================================

            enhanced = enhance_plate(
                crop
            )


            if enhanced is None:
                continue


            enhanced_name = (
                f"enhanced_{plate_id:04d}.jpg"
            )


            enhanced_path = os.path.join(
                OUTPUT_FOLDER,
                "enhanced_crops",
                enhanced_name
            )


            cv2.imwrite(
                enhanced_path,
                enhanced
            )


            # =================================================
            # OCR ORIGINAL
            # =================================================

            original_results = run_ocr(
                crop
            )


            # =================================================
            # OCR ENHANCED
            # =================================================

            enhanced_results = run_ocr(
                enhanced
            )


            # =================================================
            # COMBINE
            # =================================================

            combined = []


            for text, score in original_results:

                cleaned = clean_text(
                    text
                )


                if len(cleaned) >= 2:

                    combined.append(
                        (
                            "original",
                            cleaned,
                            score
                        )
                    )


            for text, score in enhanced_results:

                cleaned = clean_text(
                    text
                )


                if len(cleaned) >= 2:

                    combined.append(
                        (
                            "enhanced",
                            cleaned,
                            score
                        )
                    )


            # =================================================
            # PRINT OCR
            # =================================================

            if combined:

                print(
                    f"Plate {plate_id} | "
                    f"YOLO confidence = "
                    f"{float(yolo_conf):.3f}"
                )


                for method, text, score in combined:

                    print(
                        f"   OCR [{method}] "
                        f"{text} "
                        f"confidence={score:.2f}"
                    )


                    all_results.append([
                        frame_number,
                        filename,
                        plate_id,
                        float(yolo_conf),
                        method,
                        text,
                        float(score),
                        crop_name
                    ])


            else:

                print(
                    f"Plate {plate_id} "
                    f"detected but OCR "
                    f"found no text."
                )


            # =================================================
            # DRAW BOX
            # =================================================

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )


            label = (
                f"PLATE "
                f"{float(yolo_conf):.2f}"
            )


            cv2.putText(
                annotated,
                label,
                (
                    x1,
                    max(20, y1 - 8)
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )


    print(
        f"Plates detected in frame: "
        f"{frame_plate_count}"
    )


    # ========================================================
    # SAVE ANNOTATED FRAME
    # ========================================================

    annotated_path = os.path.join(
        OUTPUT_FOLDER,
        "annotated",
        filename
    )


    cv2.imwrite(
        annotated_path,
        annotated
    )


# ============================================================
# SAVE OCR RESULTS
# ============================================================

csv_path = os.path.join(
    OUTPUT_FOLDER,
    "ocr_results.csv"
)


with open(
    csv_path,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.writer(f)


    writer.writerow([
        "Frame",
        "Filename",
        "Plate_ID",
        "YOLO_Confidence",
        "OCR_Method",
        "Plate_Text",
        "OCR_Confidence",
        "Crop_File"
    ])


    writer.writerows(
        all_results
    )


# ============================================================
# CREATE SUMMARY
# ============================================================

valid = []


for row in all_results:

    text = row[5]

    confidence = row[6]


    if (
        len(text) >= 3
        and confidence >= 0.50
    ):

        valid.append(
            text
        )


counter = Counter(
    valid
)


summary_path = os.path.join(
    OUTPUT_FOLDER,
    "plate_summary.csv"
)


with open(
    summary_path,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.writer(f)


    writer.writerow([
        "Plate_Number",
        "Occurrences"
    ])


    for plate, count in counter.most_common():

        writer.writerow([
            plate,
            count
        ])


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n")

print("=" * 60)

print(
    "ROAD ANPR V3 COMPLETED"
)

print("=" * 60)


print(
    f"Frames processed : {len(frames)}"
)


print(
    f"Plate detections : {plate_id}"
)


print(
    f"OCR observations : {len(all_results)}"
)


print(
    "\nMost frequently detected plates:"
)


if counter:

    for plate, count in counter.most_common(15):

        print(
            f"   {plate} -> "
            f"{count} observations"
        )

else:

    print(
        "   No readable plates found."
    )


print("\nOutput folder:")

print(
    os.path.abspath(
        OUTPUT_FOLDER
    )
)


print("\nDone.")