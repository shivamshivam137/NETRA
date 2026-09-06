from ultralytics import YOLO
from paddleocr import PaddleOCR
import cv2
import os
import glob
from collections import Counter

# =========================
# MODELS
# =========================

plate_model = YOLO("yolo/runs/detect/train/weights/best.pt")

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)

# =========================
# INPUT / OUTPUT
# =========================

input_folder = "images"
output_folder = "images/final_anpr"

os.makedirs(output_folder, exist_ok=True)

files = sorted(
    glob.glob("images/traffic_frame_*.jpg")
)

print("Total frames:", len(files))
print("Starting final ANPR demo...")
print("=" * 60)

# =========================
# PROCESS FRAMES
# =========================

for frame_no, file in enumerate(files, start=1):

    frame = cv2.imread(file)

    if frame is None:
        continue

    results = plate_model(
        frame,
        conf=0.25,
        verbose=False
    )

    result = results[0]

    for box in result.boxes:

        # Plate coordinates
        x1, y1, x2, y2 = map(
            int,
            box.xyxy[0]
        )

        detection_conf = float(
            box.conf[0]
        )

        # Make sure coordinates are valid
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(frame.shape[1], x2)
        y2 = min(frame.shape[0], y2)

        plate = frame[y1:y2, x1:x2]

        if plate.size == 0:
            continue

        # =========================
        # OCR
        # =========================

        ocr_result = ocr.predict(plate)

        text = ""
        ocr_conf = 0.0

        if ocr_result:

            for res in ocr_result:

                data = res.json

                if not data:
                    continue

                result_data = data.get("res", {})

                texts = result_data.get(
                    "rec_texts", []
                )

                scores = result_data.get(
                    "rec_scores", []
                )

                if texts:

                    text = "".join(
                        texts
                    ).replace(" ", "").upper()

                    if scores:
                        ocr_conf = max(
                            scores
                        )

        # =========================
        # DRAW BOX
        # =========================

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            3
        )

        if text:

            label = f"{text} | OCR {ocr_conf*100:.1f}%"

        else:

            label = "Plate detected"

        # Label background
        (tw, th), _ = cv2.getTextSize(
            label,
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            2
        )

        cv2.rectangle(
            frame,
            (x1, max(0, y1 - th - 12)),
            (x1 + tw + 10, y1),
            (0, 255, 0),
            -1
        )

        cv2.putText(
            frame,
            label,
            (x1 + 5, y1 - 7),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 0),
            2
        )

    # =========================
    # FRAME INFORMATION
    # =========================

    cv2.putText(
        frame,
        "AI ANPR | YOLO + PaddleOCR",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 255, 255),
        2
    )

    # Save annotated frame
    output_file = os.path.join(
        output_folder,
        f"anpr_{frame_no:03d}.jpg"
    )

    cv2.imwrite(
        output_file,
        frame
    )

    print(
        f"Processed {frame_no}/{len(files)}"
    )

print("=" * 60)
print("FINAL ANPR DEMO COMPLETED")
print("Output folder:")
print(output_folder)