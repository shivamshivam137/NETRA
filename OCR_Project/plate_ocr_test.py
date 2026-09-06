from ultralytics import YOLO
from paddleocr import PaddleOCR
import glob
import cv2
import os

# Load YOLO license plate model
plate_model = YOLO("yolo/runs/detect/train/weights/best.pt")

# Load PaddleOCR
ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)

# Get extracted traffic frames
files = glob.glob("images/traffic_frame_*.jpg")

print("Total frames:", len(files))
print("=" * 60)

for file in files[:20]:

    frame = cv2.imread(file)

    if frame is None:
        continue

    # Detect number plates
    results = plate_model(
        frame,
        conf=0.25,
        verbose=False
    )

    result = results[0]

    if len(result.boxes) == 0:
        continue

    for i, box in enumerate(result.boxes):

        x1, y1, x2, y2 = map(int, box.xyxy[0])

        # Crop license plate
        plate = frame[y1:y2, x1:x2]

        if plate.size == 0:
            continue

        # Save plate crop
        os.makedirs("images/plate_crops", exist_ok=True)

        crop_name = (
            f"images/plate_crops/"
            f"{os.path.basename(file)[:-4]}_plate_{i}.jpg"
        )

        cv2.imwrite(crop_name, plate)

        # OCR
        ocr_result = ocr.predict(plate)

        print("\nFrame:", os.path.basename(file))
        print("Plate crop:", crop_name)

        # Display OCR result
        if ocr_result:

            for res in ocr_result:

                data = res.json

                if data:
                    print("OCR:", data)

print("\n" + "=" * 60)
print("OCR TEST COMPLETED")
print("Plate crops saved in: images/plate_crops")