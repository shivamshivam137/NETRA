import cv2
import re
from ultralytics import YOLO
from paddleocr import PaddleOCR

# ============================================================
# SETTINGS
# ============================================================

VIDEO_PATH = "videos/traffic_short.mp4"

VEHICLE_MODEL = "yolo11n.pt"
PLATE_MODEL = "yolo/runs/detect/train/weights/best.pt"

OUTPUT_VIDEO = "images/vehicle_plate_ocr_result.mp4"

# Vehicle detection confidence
VEHICLE_CONFIDENCE = 0.35

# Plate detection confidence
PLATE_CONFIDENCE = 0.15

# Run OCR every N frames
OCR_INTERVAL = 5


# ============================================================
# LOAD MODELS
# ============================================================

print("Loading vehicle YOLO model...")
vehicle_model = YOLO(VEHICLE_MODEL)
print("Vehicle YOLO model loaded successfully")

print("Loading plate YOLO model...")
plate_model = YOLO(PLATE_MODEL)
print("Plate YOLO model loaded successfully")

print("Loading PaddleOCR...")

ocr = PaddleOCR(
    lang="en",
    device="cpu",
    enable_mkldnn=False
)

print("PaddleOCR loaded successfully")


# ============================================================
# OPEN VIDEO
# ============================================================

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print("Video opened successfully")

print()
print("==============================")
print(" VEHICLE -> PLATE -> OCR")
print("==============================")
print(f"FPS: {fps}")
print(f"Resolution: {width} x {height}")
print(f"Total frames: {total_frames}")
print()


# ============================================================
# OUTPUT VIDEO
# ============================================================

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    OUTPUT_VIDEO,
    fourcc,
    fps,
    (width, height)
)


# ============================================================
# VEHICLE CLASSES
# COCO:
# 2 = car
# 3 = motorcycle
# 5 = bus
# 7 = truck
# ============================================================

VEHICLE_CLASSES = {
    2: "Car",
    3: "Motorcycle",
    5: "Bus",
    7: "Truck"
}


# ============================================================
# VARIABLES
# ============================================================

frame_number = 0

vehicle_count = 0
plate_count = 0
ocr_attempts = 0

last_plate_text = {}
last_plate_conf = {}


# ============================================================
# MAIN LOOP
# ============================================================

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    # --------------------------------------------------------
    # VEHICLE DETECTION
    # --------------------------------------------------------

    vehicle_results = vehicle_model.predict(
        frame,
        conf=VEHICLE_CONFIDENCE,
        classes=list(VEHICLE_CLASSES.keys()),
        verbose=False
    )

    current_vehicle_id = 0

    for result in vehicle_results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            current_vehicle_id += 1
            vehicle_count += 1

            # Vehicle coordinates
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)

            # Keep coordinates inside image
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(width, x2)
            y2 = min(height, y2)

            if x2 <= x1 or y2 <= y1:
                continue

            vehicle_conf = float(box.conf[0])
            class_id = int(box.cls[0])

            vehicle_name = VEHICLE_CLASSES.get(
                class_id,
                "Vehicle"
            )

            # ------------------------------------------------
            # DRAW VEHICLE BOX
            # ------------------------------------------------

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            vehicle_label = (
                f"{vehicle_name} "
                f"{vehicle_conf * 100:.1f}%"
            )

            cv2.putText(
                frame,
                vehicle_label,
                (x1, max(25, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                (0, 255, 0),
                2
            )

            # ------------------------------------------------
            # CROP VEHICLE
            # ------------------------------------------------

            vehicle_crop = frame[
                y1:y2,
                x1:x2
            ]

            if vehicle_crop.size == 0:
                continue

            # ------------------------------------------------
            # PLATE DETECTION INSIDE VEHICLE ONLY
            # ------------------------------------------------

            plate_results = plate_model.predict(
                vehicle_crop,
                conf=PLATE_CONFIDENCE,
                verbose=False
            )

            for plate_result in plate_results:

                if plate_result.boxes is None:
                    continue

                for plate_box in plate_result.boxes:

                    plate_confidence = float(
                        plate_box.conf[0]
                    )

                    # ----------------------------------------
                    # PLATE COORDINATES
                    # Relative to vehicle crop
                    # ----------------------------------------

                    px1, py1, px2, py2 = (
                        plate_box.xyxy[0]
                        .cpu()
                        .numpy()
                        .astype(int)
                    )

                    # Convert to original frame coordinates
                    abs_x1 = x1 + px1
                    abs_y1 = y1 + py1
                    abs_x2 = x1 + px2
                    abs_y2 = y1 + py2

                    # Keep inside image
                    abs_x1 = max(0, abs_x1)
                    abs_y1 = max(0, abs_y1)
                    abs_x2 = min(width, abs_x2)
                    abs_y2 = min(height, abs_y2)

                    plate_width = abs_x2 - abs_x1
                    plate_height = abs_y2 - abs_y1

                    if plate_width <= 5 or plate_height <= 5:
                        continue

                    # ----------------------------------------
                    # ASPECT RATIO FILTER
                    # License plates are normally wider
                    # than they are tall.
                    # ----------------------------------------

                    aspect_ratio = (
                        plate_width / plate_height
                    )

                    if aspect_ratio < 1.5:
                        continue

                    if aspect_ratio > 8.0:
                        continue

                    plate_count += 1

                    # ----------------------------------------
                    # DRAW PLATE BOX
                    # ----------------------------------------

                    cv2.rectangle(
                        frame,
                        (abs_x1, abs_y1),
                        (abs_x2, abs_y2),
                        (0, 255, 255),
                        2
                    )

                    plate_label = (
                        f"Plate "
                        f"{plate_confidence * 100:.1f}%"
                    )

                    cv2.putText(
                        frame,
                        plate_label,
                        (
                            abs_x1,
                            max(20, abs_y1 - 5)
                        ),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (0, 255, 255),
                        2
                    )

                    # ----------------------------------------
                    # OCR
                    # ----------------------------------------

                    if frame_number % OCR_INTERVAL != 0:
                        continue

                    plate_crop = frame[
                        abs_y1:abs_y2,
                        abs_x1:abs_x2
                    ]

                    if plate_crop.size == 0:
                        continue

                    # Make plate larger for OCR
                    plate_crop = cv2.resize(
                        plate_crop,
                        None,
                        fx=3,
                        fy=3,
                        interpolation=cv2.INTER_CUBIC
                    )

                    ocr_attempts += 1

                    try:

                        ocr_result = ocr.predict(
                            plate_crop
                        )

                        text_found = False

                        for result_data in ocr_result:

                            data = result_data.json

                            if isinstance(data, str):
                                import json
                                data = json.loads(data)

                            res = data.get("res", {})

                            texts = res.get(
                                "rec_texts",
                                []
                            )

                            scores = res.get(
                                "rec_scores",
                                []
                            )

                            for i, text in enumerate(texts):

                                clean_text = re.sub(
                                    r"[^A-Za-z0-9]",
                                    "",
                                    str(text)
                                ).upper()

                                if len(clean_text) < 4:
                                    continue

                                score = 0

                                if i < len(scores):
                                    score = float(
                                        scores[i]
                                    )

                                # Ignore very low OCR confidence
                                if score < 0.50:
                                    continue

                                last_plate_text[
                                    current_vehicle_id
                                ] = clean_text

                                last_plate_conf[
                                    current_vehicle_id
                                ] = score

                                text_found = True

                                print(
                                    f"Frame {frame_number}: "
                                    f"{vehicle_name} -> "
                                    f"Plate = {clean_text}, "
                                    f"OCR = "
                                    f"{score * 100:.2f}%"
                                )

                                break

                            if text_found:
                                break

                    except Exception as e:

                        print(
                            f"OCR error on frame "
                            f"{frame_number}: {e}"
                        )

                    # ----------------------------------------
                    # SHOW OCR RESULT
                    # ----------------------------------------

                    if current_vehicle_id in last_plate_text:

                        detected_text = last_plate_text[
                            current_vehicle_id
                        ]

                        detected_conf = last_plate_conf[
                            current_vehicle_id
                        ]

                        cv2.putText(
                            frame,
                            (
                                f"{detected_text} "
                                f"{detected_conf * 100:.1f}%"
                            ),
                            (
                                abs_x1,
                                min(
                                    height - 10,
                                    abs_y2 + 22
                                )
                            ),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.65,
                            (0, 255, 255),
                            2
                        )


    # ========================================================
    # PROGRESS
    # ========================================================

    if frame_number % 25 == 0:

        progress = (
            frame_number /
            total_frames *
            100
        )

        print(
            f"Progress: "
            f"{frame_number}/{total_frames} "
            f"({progress:.1f}%)"
        )

    # ========================================================
    # WRITE FRAME
    # ========================================================

    out.write(frame)


# ============================================================
# CLEANUP
# ============================================================

cap.release()
out.release()

print()
print("==============================")
print(" VEHICLE -> PLATE -> OCR COMPLETE")
print("==============================")

print(f"Frames processed: {frame_number}")
print(f"Vehicle detections: {vehicle_count}")
print(f"Plate detections: {plate_count}")
print(f"OCR attempts: {ocr_attempts}")

print()
print("Output video:")
print(OUTPUT_VIDEO)
print()