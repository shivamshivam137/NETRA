import cv2
import os
import re
from ultralytics import YOLO
from paddleocr import PaddleOCR

# ==========================================
# SETTINGS
# ==========================================

VIDEO_PATH = "videos/traffic_short.mp4"
PLATE_MODEL = "yolo/runs/detect/train/weights/best.pt"
OUTPUT_VIDEO = "images/cctv_yolo_ocr_result.mp4"

PLATE_CONFIDENCE = 0.25
OCR_INTERVAL = 5

# ==========================================
# LOAD YOLO
# ==========================================

print("Loading YOLO plate model...")

plate_model = YOLO(PLATE_MODEL)

print("YOLO plate model loaded successfully")

# ==========================================
# LOAD OCR
# ==========================================

print("Loading PaddleOCR...")

ocr = PaddleOCR(
    lang="en",
    device="cpu",
    enable_mkldnn=False
)

print("PaddleOCR loaded successfully")

# ==========================================
# OPEN VIDEO
# ==========================================

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video")
    print(VIDEO_PATH)
    exit()

print("CCTV video opened successfully")

fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print()
print("==============================")
print(" CCTV -> YOLO -> OCR")
print("==============================")

print("FPS:", fps)
print("Resolution:", width, "x", height)
print("Total frames:", total_frames)

# ==========================================
# OUTPUT VIDEO
# ==========================================

os.makedirs("images", exist_ok=True)

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    OUTPUT_VIDEO,
    fourcc,
    fps,
    (width, height)
)

# ==========================================
# VARIABLES
# ==========================================

frame_number = 0
plate_count = 0
ocr_attempts = 0

last_plate_text = ""
last_ocr_confidence = 0.0

# ==========================================
# PROCESS VIDEO
# ==========================================

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    # --------------------------------------
    # YOLO PLATE DETECTION
    # --------------------------------------

    results = plate_model(
        frame,
        conf=PLATE_CONFIDENCE,
        imgsz=640,
        verbose=False
    )

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            confidence = float(box.conf[0])

            x1, y1, x2, y2 = (
                box.xyxy[0]
                .cpu()
                .numpy()
                .astype(int)
            )

            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(width, x2)
            y2 = min(height, y2)

            if x2 <= x1 or y2 <= y1:
                continue

            plate_count += 1

            # --------------------------------------
            # DRAW PLATE BOX
            # --------------------------------------

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            label = f"Plate {confidence * 100:.1f}%"

            cv2.putText(
                frame,
                label,
                (x1, max(y1 - 10, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

            # --------------------------------------
            # OCR EVERY 5 FRAMES
            # --------------------------------------

            if frame_number % OCR_INTERVAL != 0:
                continue

            plate_crop = frame[y1:y2, x1:x2]

            if plate_crop.size == 0:
                continue

            ocr_attempts += 1

            temp_plate = "images/temp_plate.png"

            cv2.imwrite(
                temp_plate,
                plate_crop
            )

            # --------------------------------------
            # RUN OCR
            # --------------------------------------

            try:

                ocr_result = ocr.predict(temp_plate)

                detected_text = ""
                detected_confidence = 0.0

                for res in ocr_result:

                    if not hasattr(res, "json"):
                        continue

                    data = res.json

                    if callable(data):
                        data = data()

                    if not isinstance(data, dict):
                        continue

                    data = data.get("res", data)

                    texts = data.get(
                        "rec_texts",
                        []
                    )

                    scores = data.get(
                        "rec_scores",
                        []
                    )

                    if texts:
                        detected_text = " ".join(
                            str(t) for t in texts
                        )

                    if scores:
                        detected_confidence = max(
                            float(s) for s in scores
                        )

                cleaned = re.sub(
                    r"[^A-Za-z0-9]",
                    "",
                    detected_text
                )

                if len(cleaned) >= 4:

                    last_plate_text = cleaned

                    last_ocr_confidence = (
                        detected_confidence
                    )

                    print(
                        f"Frame {frame_number}: "
                        f"Plate = {cleaned}, "
                        f"OCR = "
                        f"{detected_confidence * 100:.2f}%"
                    )

            except Exception as e:

                print("OCR error:", e)

    # ==========================================
    # SHOW OCR RESULT
    # ==========================================

    if last_plate_text:

        result_text = (
            f"Plate: {last_plate_text} | "
            f"OCR: "
            f"{last_ocr_confidence * 100:.1f}%"
        )

        cv2.putText(
            frame,
            result_text,
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )

    # ==========================================
    # SAVE FRAME
    # ==========================================

    out.write(frame)

    # ==========================================
    # PROGRESS
    # ==========================================

    if frame_number % 50 == 0:

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

# ==========================================
# FINISH
# ==========================================

cap.release()
out.release()

print()
print("==============================")
print(" CCTV -> YOLO -> OCR COMPLETE")
print("==============================")

print("Frames processed:", frame_number)
print("Plate detections:", plate_count)
print("OCR attempts:", ocr_attempts)

print()
print("Output video:")
print(OUTPUT_VIDEO)