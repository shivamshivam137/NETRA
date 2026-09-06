from ultralytics import YOLO
import cv2
import os

# Load your trained YOLO model
model = YOLO("yolo/runs/detect/train/weights/best.pt")

VIDEO_PATH = "videos/cctv.mp4"

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("Could not open CCTV video")
    exit()

print("CCTV video opened successfully")
print("Starting YOLO detection...")

frame_count = 0
detections = 0

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_count += 1

    # Process every 30th frame
    if frame_count % 30 != 0:
        continue

    results = model(frame, conf=0.25, verbose=False)

    for result in results:

        boxes = result.boxes

        if boxes is not None and len(boxes) > 0:

            detections += len(boxes)

            print(
                f"Frame {frame_count}: "
                f"{len(boxes)} number plate(s) detected"
            )

            # Save YOLO annotated frame
            annotated = result.plot()

            output_path = (
                f"images/cctv_yolo_{frame_count}.jpg"
            )

            cv2.imwrite(output_path, annotated)

            print("Saved:", output_path)

cap.release()

print()
print("==============================")
print("CCTV → YOLO COMPLETE")
print("==============================")
print("Frames processed:", frame_count)
print("Total plates detected:", detections)