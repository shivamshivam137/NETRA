import cv2
from ultralytics import YOLO

# ============================================================
# SETTINGS
# ============================================================

VIDEO_PATH = "videos/traffic_short.mp4"

VEHICLE_MODEL = "yolo11n.pt"

OUTPUT_VIDEO = "images/vehicle_crops_inspection.mp4"

CONFIDENCE = 0.35

# ============================================================
# LOAD VEHICLE MODEL
# ============================================================

print("Loading vehicle YOLO model...")

model = YOLO(VEHICLE_MODEL)

print("Vehicle YOLO model loaded successfully")

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
print(f"FPS: {fps}")
print(f"Resolution: {width} x {height}")
print(f"Total frames: {total_frames}")

# ============================================================
# OUTPUT
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
# ============================================================

VEHICLE_CLASSES = {
    2: "Car",
    3: "Motorcycle",
    5: "Bus",
    7: "Truck"
}

# ============================================================
# PROCESS VIDEO
# ============================================================

frame_number = 0

while True:

    ret, frame = cap.read()