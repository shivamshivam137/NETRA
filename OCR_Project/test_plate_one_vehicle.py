import cv2
from ultralytics import YOLO

VIDEO_PATH = "videos/traffic_short.mp4"
PLATE_MODEL = "yolo/runs/detect/train/weights/best.pt"

OUTPUT = "images/plate_one_vehicle_test.jpg"

# Load models
vehicle_model = YOLO("yolo11n.pt")
plate_model = YOLO(PLATE_MODEL)

# Open video
cap = cv2.VideoCapture(VIDEO_PATH)

# Frame where vehicles are visible
cap.set(cv2.CAP_PROP_POS_FRAMES, 150)

ret, frame = cap.read()

if not ret:
    print("ERROR: Could not read video frame")
    cap.release()
    exit()

# Detect vehicles
vehicle_results = vehicle_model.predict(
    frame,
    conf=0.35,
    classes=[2, 3, 5, 7],
    verbose=False
)

vehicle_number = 0
plate_found = 0

for result in vehicle_results:

    if result.boxes is None:
        continue

    for box in result.boxes:

        vehicle_number += 1

        x1, y1, x2, y2 = (
            box.xyxy[0]
            .cpu()
            .numpy()
            .astype(int)
        )

        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(frame.shape[1], x2)
        y2 = min(frame.shape[0], y2)

        vehicle_crop = frame[y1:y2, x1:x2]

        if vehicle_crop.size == 0:
            continue

        # Focus on lower 60% of vehicle
        crop_height = vehicle_crop.shape[0]

        lower_part = vehicle_crop[
            int(crop_height * 0.40):,
            :
        ]

        # Plate detection
        plate_results = plate_model.predict(
            lower_part,
            conf=0.10,
            verbose=False
        )

        for plate_result in plate_results:

            if plate_result.boxes is None:
                continue

            for plate_box in plate_result.boxes:

                plate_found += 1

                px1, py1, px2, py2 = (
                    plate_box.xyxy[0]
                    .cpu()
                    .numpy()
                    .astype(int)
                )

                # Convert back to original frame
                abs_x1 = x1 + px1
                abs_y1 = y1 + int(crop_height * 0.40) + py1
                abs_x2 = x1 + px2
                abs_y2 = y1 + int(crop_height * 0.40) + py2

                confidence = float(
                    plate_box.conf[0]
                )

                cv2.rectangle(
                    frame,
                    (abs_x1, abs_y1),
                    (abs_x2, abs_y2),
                    (0, 255, 255),
                    3
                )

                cv2.putText(
                    frame,
                    f"PLATE {confidence * 100:.1f}%",
                    (abs_x1, max(30, abs_y1 - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 255),
                    2
                )

        # Draw vehicle box
        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

cap.release()

cv2.imwrite(
    OUTPUT,
    frame
)

print()
print("==============================")
print(" ONE VEHICLE PLATE TEST")
print("==============================")
print(f"Vehicles detected: {vehicle_number}")
print(f"Plate detections: {plate_found}")
print()
print("Output:")
print(OUTPUT)