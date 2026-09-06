import os
import re
import csv
import cv2
import numpy as np
from collections import defaultdict, Counter
from ultralytics import YOLO
from paddleocr import PaddleOCR


# ============================================================
# ROAD ANPR V5
# Vehicle Tracking + Plate Detection + OCR + Plate Memory
# ============================================================

VIDEO_PATH = r"C:\OCR_Project\videos\on road.mp4"

PLATE_MODEL_PATH = r"C:\OCR_Project\yolo\runs\detect\train\weights\best.pt"

OUTPUT_FOLDER = r"C:\OCR_Project\images\road_anpr_results_v5"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

ANNOTATED_FOLDER = os.path.join(
    OUTPUT_FOLDER,
    "annotated_frames"
)

os.makedirs(ANNOTATED_FOLDER, exist_ok=True)

CSV_PATH = os.path.join(
    OUTPUT_FOLDER,
    "vehicle_plate_results.csv"
)


# ============================================================
# SETTINGS
# ============================================================

# Process approximately 2 frames per second
PROCESS_FPS = 2

# Vehicle detector confidence
VEHICLE_CONF = 0.30

# Plate detector confidence
PLATE_CONF = 0.15

# IoU for vehicle tracking
TRACKER_IOU = 0.5


# ============================================================
# LOAD VEHICLE MODEL
# ============================================================

print()
print("=" * 60)
print("Loading vehicle detection/tracking model...")
print("=" * 60)

# YOLO nano model is suitable for CPU testing
vehicle_model = YOLO("yolov8n.pt")

print("Vehicle model loaded.")


# ============================================================
# LOAD CUSTOM PLATE MODEL
# ============================================================

print()
print("=" * 60)
print("Loading custom number plate model...")
print("=" * 60)

plate_model = YOLO(PLATE_MODEL_PATH)

print("Plate model loaded.")


# ============================================================
# LOAD PADDLE OCR
# ============================================================

print()
print("=" * 60)
print("Loading PaddleOCR...")
print("=" * 60)

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False
)

print("PaddleOCR loaded.")


# ============================================================
# INDIAN PLATE FUNCTIONS
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


def correct_ocr(text):

    text = clean_text(text)

    if len(text) < 6:
        return text

    chars = list(text)

    # Expected first two characters = letters
    letter_map = {
        "0": "O",
        "1": "I",
        "2": "Z",
        "5": "S",
        "6": "G",
        "8": "B"
    }

    for i in range(
        min(2, len(chars))
    ):

        if chars[i] in letter_map:
            chars[i] = letter_map[chars[i]]


    # Expected next 1-2 characters = digits
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


def valid_indian_plate(text):

    text = correct_ocr(text)

    if len(text) < 8 or len(text) > 12:
        return False, text

    pattern = r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$"

    if re.match(pattern, text):
        return True, text

    return False, text


# ============================================================
# OCR FUNCTION
# ============================================================

def run_ocr(image):

    output_texts = []

    if image is None:
        return output_texts

    if image.size == 0:
        return output_texts

    try:

        # Make image large enough for OCR
        image = cv2.resize(
            image,
            None,
            fx=10,
            fy=10,
            interpolation=cv2.INTER_CUBIC
        )

        # Make sure BGR
        if len(image.shape) == 2:

            image = cv2.cvtColor(
                image,
                cv2.COLOR_GRAY2BGR
            )

        results = ocr.predict(image)

        for result in results:

            try:

                texts = result["rec_texts"]
                scores = result["rec_scores"]

            except Exception:

                try:

                    texts = result.rec_texts
                    scores = result.rec_scores

                except Exception:

                    continue


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

                    output_texts.append(
                        (
                            text,
                            score
                        )
                    )

    except Exception as e:

        print(
            "OCR error:",
            e
        )

    return output_texts


# ============================================================
# PLATE ENHANCEMENT
# ============================================================

def enhance_plate(crop):

    if crop is None:
        return None

    if crop.size == 0:
        return None

    # Resize
    crop = cv2.resize(
        crop,
        None,
        fx=10,
        fy=10,
        interpolation=cv2.INTER_CUBIC
    )

    # Grayscale
    gray = cv2.cvtColor(
        crop,
        cv2.COLOR_BGR2GRAY
    )

    # CLAHE
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
# OPEN VIDEO
# ============================================================

print()
print("=" * 60)
print("Opening video...")
print("=" * 60)

cap = cv2.VideoCapture(
    VIDEO_PATH
)

if not cap.isOpened():

    print(
        "ERROR: Could not open video."
    )

    raise SystemExit


original_fps = cap.get(
    cv2.CAP_PROP_FPS
)

total_frames = int(
    cap.get(cv2.CAP_PROP_FRAME_COUNT)
)

video_width = int(
    cap.get(cv2.CAP_PROP_FRAME_WIDTH)
)

video_height = int(
    cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
)

duration = (
    total_frames / original_fps
    if original_fps > 0
    else 0
)


print(
    f"Video FPS      : {original_fps:.2f}"
)

print(
    f"Video size     : "
    f"{video_width}x{video_height}"
)

print(
    f"Total frames   : {total_frames}"
)

print(
    f"Duration       : {duration:.2f} seconds"
)

print(
    f"Processing FPS : {PROCESS_FPS}"
)


# ============================================================
# VEHICLE PLATE MEMORY
# ============================================================

# Vehicle ID → list of OCR observations
vehicle_memory = defaultdict(list)

# Vehicle ID → last known best plate
vehicle_best_plate = {}

# Vehicle ID → number of plate observations
vehicle_plate_count = Counter()


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
    "Time",
    "Vehicle_ID",
    "Vehicle_Class",
    "Plate_Text",
    "OCR_Confidence",
    "Plate_Valid",
    "Plate_Observation_Count"
])


# ============================================================
# PROCESS EVERY Nth FRAME
# ============================================================

frame_step = max(
    1,
    int(round(original_fps / PROCESS_FPS))
)

frame_number = 0
processed_frames = 0
total_vehicles = 0
total_plate_detections = 0
total_valid_ocr = 0


print()
print("=" * 60)
print("STARTING ANPR PROCESSING")
print("=" * 60)


while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    # Process only selected frames
    if frame_number % frame_step != 0:
        continue

    processed_frames += 1

    current_time = (
        frame_number / original_fps
        if original_fps > 0
        else 0
    )

    print()
    print("-" * 60)

    print(
        f"Frame {frame_number} | "
        f"Time {current_time:.1f}s"
    )

    # ========================================================
    # VEHICLE TRACKING
    # ========================================================

    vehicle_results = vehicle_model.track(
        source=frame,
        persist=True,
        conf=VEHICLE_CONF,
        iou=TRACKER_IOU,
        classes=[2, 3, 5, 7],
        verbose=False
    )


    annotated = frame.copy()


    # ========================================================
    # PROCESS VEHICLES
    # ========================================================

    current_vehicle_ids = set()

    for result in vehicle_results:

        if result.boxes is None:
            continue

        boxes = result.boxes.xyxy.cpu().numpy()

        classes = result.boxes.cls.cpu().numpy()

        if result.boxes.id is not None:

            ids = result.boxes.id.cpu().numpy().astype(int)

        else:

            ids = np.arange(
                len(boxes)
            )


        for box, cls, vehicle_id in zip(
            boxes,
            classes,
            ids
        ):

            x1, y1, x2, y2 = map(
                int,
                box
            )

            vehicle_id = int(
                vehicle_id
            )

            current_vehicle_ids.add(
                vehicle_id
            )

            total_vehicles += 1

            vehicle_class = int(
                cls
            )


            # ------------------------------------------------
            # DRAW VEHICLE
            # ------------------------------------------------

            cv2.rectangle(
                annotated,
                (x1, y1),
                (x2, y2),
                (255, 0, 0),
                2
            )

            cv2.putText(
                annotated,
                f"Vehicle ID: {vehicle_id}",
                (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 0, 0),
                2
            )


    # ========================================================
    # FULL FRAME PLATE DETECTION
    # ========================================================

    plate_results = plate_model.predict(
        source=frame,
        conf=PLATE_CONF,
        iou=0.45,
        verbose=False
    )


    plate_detections = []


    for result in plate_results:

        if result.boxes is None:
            continue

        boxes = result.boxes.xyxy.cpu().numpy()

        confidences = result.boxes.conf.cpu().numpy()


        for box, confidence in zip(
            boxes,
            confidences
        ):

            px1, py1, px2, py2 = map(
                int,
                box
            )

            confidence = float(
                confidence
            )

            plate_detections.append(
                (
                    px1,
                    py1,
                    px2,
                    py2,
                    confidence
                )
            )


    total_plate_detections += len(
        plate_detections
    )


    # ========================================================
    # ASSOCIATE PLATE WITH VEHICLE
    # ========================================================

    for (
        px1,
        py1,
        px2,
        py2,
        plate_confidence
    ) in plate_detections:

        plate_center_x = (
            px1 + px2
        ) / 2

        plate_center_y = (
            py1 + py2
        ) / 2


        best_vehicle = None
        best_distance = float("inf")


        # Find vehicle containing plate center
        for result in vehicle_results:

            if result.boxes is None:
                continue

            boxes = result.boxes.xyxy.cpu().numpy()

            if result.boxes.id is not None:

                ids = result.boxes.id.cpu().numpy().astype(int)

            else:

                continue


            for vehicle_box, vehicle_id in zip(
                boxes,
                ids
            ):

                vx1, vy1, vx2, vy2 = map(
                    int,
                    vehicle_box
                )

                vehicle_id = int(
                    vehicle_id
                )


                if (
                    vx1 <= plate_center_x <= vx2
                    and
                    vy1 <= plate_center_y <= vy2
                ):

                    # Distance to vehicle center
                    vehicle_center_x = (
                        vx1 + vx2
                    ) / 2

                    vehicle_center_y = (
                        vy1 + vy2
                    ) / 2

                    distance = (
                        (plate_center_x - vehicle_center_x) ** 2
                        +
                        (plate_center_y - vehicle_center_y) ** 2
                    ) ** 0.5


                    if distance < best_distance:

                        best_distance = distance

                        best_vehicle = vehicle_id


        # ----------------------------------------------------
        # No vehicle association
        # ----------------------------------------------------

        if best_vehicle is None:

            print(
                "Plate detected but "
                "no vehicle association."
            )

            continue


        # ====================================================
        # PLATE CROP
        # ====================================================

        width = px2 - px1
        height = py2 - py1

        pad_x = int(
            width * 0.35
        )

        pad_y = int(
            height * 0.60
        )


        cx1 = max(
            0,
            px1 - pad_x
        )

        cy1 = max(
            0,
            py1 - pad_y
        )

        cx2 = min(
            frame.shape[1],
            px2 + pad_x
        )

        cy2 = min(
            frame.shape[0],
            py2 + pad_y
        )


        crop = frame[
            cy1:cy2,
            cx1:cx2
        ]


        if crop.size == 0:
            continue


        # ====================================================
        # OCR ORIGINAL
        # ====================================================

        original_ocr = run_ocr(
            crop
        )


        # ====================================================
        # OCR ENHANCED
        # ====================================================

        enhanced = enhance_plate(
            crop
        )

        enhanced_ocr = run_ocr(
            enhanced
        )


        all_results = (
            original_ocr +
            enhanced_ocr
        )


        if not all_results:

            print(
                f"Vehicle {best_vehicle}: "
                "plate detected but OCR "
                "found no text."
            )

            continue


        # ====================================================
        # SELECT BEST OCR RESULT
        # ====================================================

        best_text = ""
        best_score = 0.0
        best_valid = False


        for raw_text, score in all_results:

            corrected = correct_ocr(
                raw_text
            )

            valid, corrected = valid_indian_plate(
                corrected
            )


            # Valid Indian plate gets priority
            adjusted_score = (
                score + 0.30
                if valid
                else score
            )


            if adjusted_score > best_score:

                best_score = adjusted_score

                best_text = corrected

                best_valid = valid


        if not best_text:
            continue


        # ====================================================
        # STORE PLATE IN VEHICLE MEMORY
        # ====================================================

        vehicle_memory[
            best_vehicle
        ].append(
            (
                best_text,
                best_score,
                best_valid
            )
        )


        vehicle_plate_count[
            best_vehicle
        ] += 1


        # ====================================================
        # FIND BEST PLATE FOR VEHICLE
        # ====================================================

        observations = vehicle_memory[
            best_vehicle
        ]


        valid_observations = [
            item
            for item in observations
            if item[2]
        ]


        if valid_observations:

            # Vote by plate frequency
            counter = Counter(
                item[0]
                for item in valid_observations
            )

            most_common = (
                counter.most_common(1)[0][0]
            )

            vehicle_best_plate[
                best_vehicle
            ] = most_common

            total_valid_ocr += 1

        else:

            vehicle_best_plate[
                best_vehicle
            ] = best_text


        final_plate = vehicle_best_plate[
            best_vehicle
        ]


        print(
            f"Vehicle {best_vehicle} | "
            f"Plate: {final_plate} | "
            f"OCR: {best_score:.2f} | "
            f"Valid: {best_valid}"
        )


        # ====================================================
        # DRAW PLATE
        # ====================================================

        cv2.rectangle(
            annotated,
            (px1, py1),
            (px2, py2),
            (0, 255, 0),
            2
        )


        label = (
            f"ID {best_vehicle}: "
            f"{final_plate}"
        )


        cv2.putText(
            annotated,
            label,
            (px1, max(20, py1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 0),
            2
        )


        # ====================================================
        # CSV
        # ====================================================

        writer.writerow([
            frame_number,
            f"{current_time:.2f}",
            best_vehicle,
            vehicle_class,
            final_plate,
            f"{best_score:.2f}",
            best_valid,
            vehicle_plate_count[
                best_vehicle
            ]
        ])


    # ========================================================
    # SAVE ANNOTATED FRAME
    # ========================================================

    output_name = (
        f"frame_{frame_number:05d}.jpg"
    )

    output_path = os.path.join(
        ANNOTATED_FOLDER,
        output_name
    )

    cv2.imwrite(
        output_path,
        annotated
    )


# ============================================================
# CLOSE
# ============================================================

cap.release()
csv_file.close()


# ============================================================
# FINAL SUMMARY
# ============================================================

print()
print("=" * 60)
print("ROAD ANPR V5 COMPLETED")
print("=" * 60)

print(
    f"Frames processed        : "
    f"{processed_frames}"
)

print(
    f"Vehicle observations    : "
    f"{total_vehicles}"
)

print(
    f"Plate detections        : "
    f"{total_plate_detections}"
)

print(
    f"Valid OCR observations  : "
    f"{total_valid_ocr}"
)


print()
print(
    "FINAL VEHICLE → PLATE RESULTS"
)

print("-" * 60)


if vehicle_best_plate:

    for vehicle_id in sorted(
        vehicle_best_plate
    ):

        plate = vehicle_best_plate[
            vehicle_id
        ]

        observations = vehicle_plate_count[
            vehicle_id
        ]

        print(
            f"Vehicle ID {vehicle_id:3d} "
            f"→ {plate} "
            f"({observations} observations)"
        )

else:

    print(
        "No vehicle/plate results found."
    )


print()
print(
    "CSV:"
)

print(
    CSV_PATH
)

print()
print(
    "Annotated frames:"
)

print(
    ANNOTATED_FOLDER
)

print()
print(
    "Done."
)