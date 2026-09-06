import cv2
from ultralytics import YOLO

VIDEO_PATH = "videos/traffic_short.mp4"
MODEL_PATH = "yolo11n.pt"

OUTPUT = "images/one_frame_inspection.jpg"

model = YOLO(MODEL_PATH)

cap = cv2.VideoCapture(VIDEO_PATH)

# Jump to frame 150
cap.set(cv2.CAP_PROP_POS_FRAMES, 150)

ret, frame = cap.read()

if not ret:
    print("ERROR: Could not read frame")
    cap.release()
    exit()

results = model.predict(
    frame,
    conf=0.35,
    classes=[2, 3, 5, 7],
    verbose=False
)

for result in results:

    if result.boxes is None:
        continue

    for box in result.boxes:

        x1, y1, x2, y2 = (
            box.xyxy[0]
            .cpu()
            .numpy()
            .astype(int)
        )

        conf = float(box.conf[0])
        cls = int(box.cls[0])

        names = {
            2: "Car",
            3: "Motorcycle",
            5: "Bus",
            7: "Truck"
        }

        label = f"{names.get(cls, 'Vehicle')} {conf*100:.1f}%"

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            3
        )

        cv2.putText(
            frame,
            label,
            (x1, max(30, y1 - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )

cap.release()

cv2.imwrite(OUTPUT, frame)

print()
print("ONE FRAME INSPECTION COMPLETE")
print("Saved to:")
print(OUTPUT)