import cv2
from ultralytics import YOLO

VIDEO_PATH = "videos/traffic_short.mp4"
PLATE_MODEL = "yolo/runs/detect/train/weights/best.pt"
OUTPUT_VIDEO = "images/plate_model_test.mp4"

CONFIDENCE = 0.10

print("Loading plate model...")
model = YOLO(PLATE_MODEL)
print("Plate model loaded successfully")

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    OUTPUT_VIDEO,
    fourcc,
    fps,
    (width, height)
)

frame_number = 0
detections = 0

print("Testing plate detector directly on full video...")
print()

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_number += 1

    results = model.predict(
        frame,
        conf=CONFIDENCE,
        verbose=False
    )

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            detections += 1

            x1, y1, x2, y2 = (
                box.xyxy[0]
                .cpu()
                .numpy()
                .astype(int)
            )

            conf = float(box.conf[0])

            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 255),
                2
            )

            cv2.putText(
                frame,
                f"PLATE {conf * 100:.1f}%",
                (x1, max(25, y1 - 5)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 255),
                2
            )

    if frame_number % 25 == 0:

        print(
            f"Processed {frame_number} frames | "
            f"Detections: {detections}"
        )

    out.write(frame)

cap.release()
out.release()

print()
print("==============================")
print(" PLATE MODEL TEST COMPLETE")
print("==============================")
print(f"Frames processed: {frame_number}")
print(f"Plate detections: {detections}")
print()
print("Output:")
print(OUTPUT_VIDEO)