import cv2
import os
import csv
import re
from collections import defaultdict

from ultralytics import YOLO
from paddleocr import PaddleOCR


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = r"C:\OCR_Project"

FRAME_DIR = os.path.join(BASE_DIR, "images")
OUTPUT_DIR = os.path.join(FRAME_DIR, "tracking_anpr")
PLATE_CROP_DIR = os.path.join(OUTPUT_DIR, "plate_crops")

VEHICLE_MODEL_PATH = os.path.join(
    BASE_DIR,
    "yolo",
    "yolo11n.pt"
)

PLATE_MODEL_PATH = os.path.join(
    BASE_DIR,
    "yolo",
    "runs",
    "detect",
    "train",
    "weights",
    "best.pt"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PLATE_CROP_DIR, exist_ok=True)


# ============================================================
# SETTINGS
# ============================================================

VEHICLE_CONF = 0.35
PLATE_CONF = 0.25

OCR_MIN_CONF = 0.60

MIN_PLATE_LENGTH = 4
MAX_PLATE_LENGTH = 12

# Minimum number of observations before we strongly
# trust a plate.
MIN_VOTES = 2

# Maximum number of stored observations per vehicle.
MAX_HISTORY = 20


# ============================================================
# OBVIOUS NON-PLATE WORDS
# ============================================================

REJECT_WORDS = {
    "VEHICLE",
    "HICLE",
    "CAR",
    "TRUCK",
    "BUS",
    "MOTOR",
    "MOTORCYCLE",
    "LICENSE",
    "PLATE",
    "NUMBER",
    "SUBSCRIBE",
    "SUBSCRIBER",
    "SUBSCRIVIR",
    "LIVE",
    "EMDIRETO",
    "DIRECT",
    "CHANNEL",
    "YOUTUBE",
    "VIDEO",
    "ROAD",
    "TRAFFIC",
}


# ============================================================
# LOAD MODELS
# ============================================================

print("\nLoading vehicle detection model...")
vehicle_model = YOLO(VEHICLE_MODEL_PATH)

print("Loading number plate model...")
plate_model = YOLO(PLATE_MODEL_PATH)

print("Loading PaddleOCR...")
ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)

print("All models loaded successfully.\n")


# ============================================================
# FIND FRAMES
# ============================================================

frame_files = []

for filename in os.listdir(FRAME_DIR):

    if filename.lower().endswith(
        (".jpg", ".jpeg", ".png")
    ):

        if filename.startswith("traffic_frame_"):
            frame_files.append(filename)

frame_files.sort()


print("FRAMES FOUND:", len(frame_files))

if len(frame_files) == 0:

    print("\nERROR: No traffic frames found.")
    print("Expected frames inside:")
    print(FRAME_DIR)

    exit()


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text):

    text = str(text).upper()

    # Remove spaces and symbols
    text = re.sub(
        r"[^A-Z0-9]",
        "",
        text
    )

    return text


# ============================================================
# CHECK WHETHER OCR RESULT LOOKS LIKE A PLATE
# ============================================================

def looks_like_plate(text):

    if not text:
        return False

    text = clean_text(text)

    # Length
    if len(text) < MIN_PLATE_LENGTH:
        return False

    if len(text) > MAX_PLATE_LENGTH:
        return False

    # Reject obvious words
    if text in REJECT_WORDS:
        return False

    # Reject strings containing obvious words
    for word in REJECT_WORDS:

        if len(word) >= 5 and word in text:
            return False

    # Must contain letters
    has_letter = any(
        c.isalpha()
        for c in text
    )

    # Must contain numbers
    has_number = any(
        c.isdigit()
        for c in text
    )

    if not has_letter:
        return False

    if not has_number:
        return False

    return True


# ============================================================
# EXTRACT PADDLEOCR RESULTS
# ============================================================

def extract_ocr_results(result):

    candidates = []

    try:

        data = result.json

        if callable(data):
            data = data()

        if isinstance(data, list):
            data = data[0]

        if isinstance(data, dict):

            res = data.get(
                "res",
                data
            )

            texts = res.get(
                "rec_texts",
                []
            )

            scores = res.get(
                "rec_scores",
                []
            )

            for text, score in zip(
                texts,
                scores
            ):

                text = clean_text(text)

                try:
                    score = float(score)
                except:
                    score = 0.0

                candidates.append(
                    (
                        text,
                        score
                    )
                )

    except Exception:
        pass

    return candidates


# ============================================================
# OCR
# ============================================================

def run_ocr(plate_crop):

    if plate_crop is None:
        return None, 0.0

    if plate_crop.size == 0:
        return None, 0.0

    # --------------------------------------------------------
    # Resize plate
    # --------------------------------------------------------

    enlarged = cv2.resize(
        plate_crop,
        None,
        fx=4,
        fy=4,
        interpolation=cv2.INTER_CUBIC
    )

    # --------------------------------------------------------
    # Grayscale
    # --------------------------------------------------------

    gray = cv2.cvtColor(
        enlarged,
        cv2.COLOR_BGR2GRAY
    )

    # --------------------------------------------------------
    # Contrast
    # --------------------------------------------------------

    gray = cv2.equalizeHist(gray)

    # --------------------------------------------------------
    # Sharpen
    # --------------------------------------------------------

    blur = cv2.GaussianBlur(
        gray,
        (3, 3),
        0
    )

    sharpened = cv2.addWeighted(
        gray,
        1.5,
        blur,
        -0.5,
        0
    )

    processed = cv2.cvtColor(
        sharpened,
        cv2.COLOR_GRAY2BGR
    )

    try:

        result = ocr.predict(
            processed
        )

        best_text = None
        best_score = 0.0

        for res in result:

            candidates = extract_ocr_results(
                res
            )

            for text, score in candidates:

                if score < OCR_MIN_CONF:
                    continue

                if not looks_like_plate(text):
                    continue

                if score > best_score:

                    best_text = text
                    best_score = score

        return (
            best_text,
            best_score
        )

    except Exception as e:

        print(
            "OCR error:",
            e
        )

        return None, 0.0


# ============================================================
# PLATE → VEHICLE ASSOCIATION
# ============================================================

def plate_belongs_to_vehicle(
    plate_box,
    vehicle_box
):

    px1, py1, px2, py2 = plate_box

    vx1, vy1, vx2, vy2 = vehicle_box

    # Plate center
    pcx = (
        px1 + px2
    ) / 2

    pcy = (
        py1 + py2
    ) / 2

    vw = vx2 - vx1
    vh = vy2 - vy1

    if vw <= 0 or vh <= 0:
        return False

    relative_x = (
        pcx - vx1
    ) / vw

    relative_y = (
        pcy - vy1
    ) / vh

    # Allow small tolerance
    if relative_x < -0.15:
        return False

    if relative_x > 1.15:
        return False

    if relative_y < -0.15:
        return False

    if relative_y > 1.15:
        return False

    return True


def find_best_vehicle_for_plate(
    plate_box,
    vehicles
):

    px1, py1, px2, py2 = plate_box

    pcx = (
        px1 + px2
    ) / 2

    pcy = (
        py1 + py2
    ) / 2

    best_vehicle = None
    best_distance = float("inf")

    for vehicle_id, vehicle_box in vehicles.items():

        if not plate_belongs_to_vehicle(
            plate_box,
            vehicle_box
        ):
            continue

        vx1, vy1, vx2, vy2 = vehicle_box

        vcx = (
            vx1 + vx2
        ) / 2

        vcy = (
            vy1 + vy2
        ) / 2

        distance = (
            (pcx - vcx) ** 2 +
            (pcy - vcy) ** 2
        ) ** 0.5

        if distance < best_distance:

            best_distance = distance
            best_vehicle = vehicle_id

    return best_vehicle


# ============================================================
# PLATE MEMORY
# ============================================================

# vehicle_id:
#
# {
#     plate_text: [
#         confidence1,
#         confidence2,
#         ...
#     ]
# }

plate_memory = defaultdict(
    lambda: defaultdict(list)
)


# Best remembered plate
best_memory = {}


# ============================================================
# DETAILED CSV DATA
# ============================================================

csv_rows = []


# ============================================================
# PROCESS FRAMES
# ============================================================

print("\nSTARTING ANPR PROCESSING\n")

for frame_number, filename in enumerate(
    frame_files,
    start=1
):

    frame_path = os.path.join(
        FRAME_DIR,
        filename
    )

    frame = cv2.imread(
        frame_path
    )

    if frame is None:
        continue


    # ========================================================
    # VEHICLE TRACKING
    # ========================================================

    vehicle_result = vehicle_model.track(
        frame,
        persist=True,
        tracker="bytetrack.yaml",
        classes=[2, 3, 5, 7],
        conf=VEHICLE_CONF,
        verbose=False
    )[0]


    vehicles = {}


    if (
        vehicle_result.boxes is not None
        and vehicle_result.boxes.id is not None
    ):

        boxes = (
            vehicle_result
            .boxes
            .xyxy
            .cpu()
            .numpy()
        )

        ids = (
            vehicle_result
            .boxes
            .id
            .cpu()
            .numpy()
        )


        for box, vehicle_id in zip(
            boxes,
            ids
        ):

            vehicle_id = int(
                vehicle_id
            )

            x1, y1, x2, y2 = map(
                int,
                box
            )

            vehicles[
                vehicle_id
            ] = (
                x1,
                y1,
                x2,
                y2
            )


    # ========================================================
    # NUMBER PLATE DETECTION
    # ========================================================

    plate_result = plate_model(
        frame,
        conf=PLATE_CONF,
        verbose=False
    )[0]


    plates = []


    if plate_result.boxes is not None:

        for box, confidence in zip(
            plate_result.boxes.xyxy.cpu().numpy(),
            plate_result.boxes.conf.cpu().numpy()
        ):

            x1, y1, x2, y2 = map(
                int,
                box
            )

            plates.append(
                (
                    x1,
                    y1,
                    x2,
                    y2,
                    float(confidence)
                )
            )


    # ========================================================
    # VEHICLES WITH LIVE PLATE
    # ========================================================

    live_vehicle_ids = set()


    # ========================================================
    # PROCESS EACH PLATE
    # ========================================================

    for plate_index, (
        px1,
        py1,
        px2,
        py2,
        plate_detection_conf
    ) in enumerate(plates):


        vehicle_id = find_best_vehicle_for_plate(
            (
                px1,
                py1,
                px2,
                py2
            ),
            vehicles
        )


        if vehicle_id is None:
            continue


        # ----------------------------------------------------
        # Image boundaries
        # ----------------------------------------------------

        h, w = frame.shape[:2]

        px1 = max(
            0,
            px1
        )

        py1 = max(
            0,
            py1
        )

        px2 = min(
            w,
            px2
        )

        py2 = min(
            h,
            py2
        )


        if px2 <= px1:
            continue

        if py2 <= py1:
            continue


        plate_crop = frame[
            py1:py2,
            px1:px2
        ]


        # ----------------------------------------------------
        # Save crop
        # ----------------------------------------------------

        crop_name = (
            f"frame_{frame_number:04d}"
            f"_vehicle_{vehicle_id}"
            f"_plate_{plate_index}.jpg"
        )


        crop_path = os.path.join(
            PLATE_CROP_DIR,
            crop_name
        )


        cv2.imwrite(
            crop_path,
            plate_crop
        )


        # ----------------------------------------------------
        # OCR
        # ----------------------------------------------------

        plate_text, ocr_conf = run_ocr(
            plate_crop
        )


        # ----------------------------------------------------
        # Valid OCR
        # ----------------------------------------------------

        if plate_text is not None:

            live_vehicle_ids.add(
                vehicle_id
            )


            # Add observation to memory
            plate_memory[
                vehicle_id
            ][plate_text].append(
                ocr_conf
            )


            # Keep history manageable
            if len(
                plate_memory[
                    vehicle_id
                ][plate_text]
            ) > MAX_HISTORY:

                plate_memory[
                    vehicle_id
                ][plate_text] = (
                    plate_memory[
                        vehicle_id
                    ][plate_text][-MAX_HISTORY:]
                )


            # ------------------------------------------------
            # Calculate score for every candidate
            # ------------------------------------------------

            candidates = []


            for candidate_plate, scores in (
                plate_memory[
                    vehicle_id
                ].items()
            ):

                count = len(
                    scores
                )

                average_conf = (
                    sum(scores)
                    / count
                )


                # Consensus score
                #
                # More observations +
                # higher confidence =
                # stronger candidate

                consensus_score = (
                    average_conf
                    *
                    (
                        1
                        +
                        min(
                            count,
                            5
                        ) * 0.15
                    )
                )


                candidates.append(
                    (
                        candidate_plate,
                        average_conf,
                        count,
                        consensus_score
                    )
                )


            if candidates:

                candidates.sort(
                    key=lambda x: x[3],
                    reverse=True
                )


                best_plate = candidates[0]


                best_memory[
                    vehicle_id
                ] = {

                    "plate":
                        best_plate[0],

                    "confidence":
                        best_plate[1],

                    "count":
                        best_plate[2],

                    "consensus":
                        best_plate[3]
                }


            # ------------------------------------------------
            # Draw live result
            # ------------------------------------------------

            vx1, vy1, vx2, vy2 = vehicles[
                vehicle_id
            ]


            cv2.rectangle(
                frame,
                (vx1, vy1),
                (vx2, vy2),
                (255, 255, 255),
                2
            )


            cv2.rectangle(
                frame,
                (px1, py1),
                (px2, py2),
                (255, 255, 255),
                2
            )


            label = (
                f"ID {vehicle_id} | "
                f"{plate_text} | "
                f"{ocr_conf * 100:.1f}% | "
                f"LIVE"
            )


            cv2.putText(
                frame,
                label,
                (
                    vx1,
                    max(
                        25,
                        vy1 - 10
                    )
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 255, 255),
                2
            )


            csv_rows.append([
                frame_number,
                vehicle_id,
                plate_text,
                round(
                    ocr_conf * 100,
                    2
                ),
                "LIVE"
            ])


    # ========================================================
    # DRAW VEHICLES WITH REMEMBERED PLATES
    # ========================================================

    for vehicle_id, vehicle_box in vehicles.items():

        vx1, vy1, vx2, vy2 = vehicle_box


        memory = best_memory.get(
            vehicle_id
        )


        # ----------------------------------------------------
        # If a plate was remembered
        # ----------------------------------------------------

        if memory is not None:

            plate = memory[
                "plate"
            ]

            confidence = memory[
                "confidence"
            ]

            count = memory[
                "count"
            ]


            # If current frame did not produce
            # a valid live OCR result,
            # use remembered plate.

            if vehicle_id not in live_vehicle_ids:

                status = "REMEMBERED"


                cv2.rectangle(
                    frame,
                    (vx1, vy1),
                    (vx2, vy2),
                    (255, 255, 255),
                    2
                )


                label = (
                    f"ID {vehicle_id} | "
                    f"{plate} | "
                    f"{confidence * 100:.1f}% | "
                    f"REMEMBERED"
                )


                cv2.putText(
                    frame,
                    label,
                    (
                        vx1,
                        max(
                            25,
                            vy1 - 10
                        )
                    ),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    (255, 255, 255),
                    2
                )


                csv_rows.append([
                    frame_number,
                    vehicle_id,
                    plate,
                    round(
                        confidence * 100,
                        2
                    ),
                    "REMEMBERED"
                ])


        else:

            # ------------------------------------------------
            # No plate found yet
            # ------------------------------------------------

            cv2.rectangle(
                frame,
                (vx1, vy1),
                (vx2, vy2),
                (255, 255, 255),
                2
            )


            label = (
                f"ID {vehicle_id} | "
                f"Plate: SEARCHING"
            )


            cv2.putText(
                frame,
                label,
                (
                    vx1,
                    max(
                        25,
                        vy1 - 10
                    )
                ),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 255, 255),
                2
            )


    # ========================================================
    # SAVE ANNOTATED FRAME
    # ========================================================

    output_name = (
        f"anpr_{frame_number:04d}.jpg"
    )


    output_path = os.path.join(
        OUTPUT_DIR,
        output_name
    )


    cv2.imwrite(
        output_path,
        frame
    )


    # ========================================================
    # PROGRESS
    # ========================================================

    if (
        frame_number == 1
        or frame_number % 10 == 0
        or frame_number == len(frame_files)
    ):

        print(
            f"Processing frame "
            f"{frame_number}/{len(frame_files)} "
            f"| Vehicles: {len(vehicles)} "
            f"| Plates: {len(plates)}"
        )


# ============================================================
# SAVE DETAILED CSV
# ============================================================

csv_path = os.path.join(
    OUTPUT_DIR,
    "anpr_results.csv"
)


with open(
    csv_path,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.writer(
        file
    )

    writer.writerow([
        "Frame",
        "Vehicle_ID",
        "Plate_Number",
        "Confidence",
        "Status"
    ])

    writer.writerows(
        csv_rows
    )


# ============================================================
# FINAL CLEAN CSV
# ============================================================

final_csv_path = os.path.join(
    OUTPUT_DIR,
    "final_plates.csv"
)


final_rows = []


for vehicle_id in sorted(
    best_memory.keys()
):

    memory = best_memory[
        vehicle_id
    ]


    final_rows.append([
        vehicle_id,
        memory["plate"],
        round(
            memory["confidence"] * 100,
            2
        ),
        "REMEMBERED"
    ])


with open(
    final_csv_path,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.writer(
        file
    )

    writer.writerow([
        "Vehicle_ID",
        "Plate_Number",
        "Confidence",
        "Status"
    ])

    writer.writerows(
        final_rows
    )


# ============================================================
# FINAL TERMINAL OUTPUT
# ============================================================

print("\n")
print("=" * 70)
print("PROCESSING COMPLETE")
print("=" * 70)


print("\nFINAL REMEMBERED PLATES\n")


print(
    f"{'Vehicle ID':<15}"
    f"{'Plate Number':<20}"
    f"{'Confidence':<15}"
    f"{'Status'}"
)


print("-" * 70)


for row in final_rows:

    vehicle_id = row[0]
    plate = row[1]
    confidence = row[2]
    status = row[3]


    print(
        f"{vehicle_id:<15}"
        f"{plate:<20}"
        f"{confidence:<14.2f}% "
        f"{status}"
    )


print("\nOUTPUT LOCATIONS:")


print(
    "Annotated frames:",
    OUTPUT_DIR
)


print(
    "Plate crops:",
    PLATE_CROP_DIR
)


print(
    "Detailed CSV:",
    csv_path
)


print(
    "Final CSV:",
    final_csv_path
)


print("\nDONE!")