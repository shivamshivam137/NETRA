import cv2
import os

VIDEO_PATH = "videos/traffic_short.mp4"
OUTPUT_DIR = "plate_dataset/images"

os.makedirs(OUTPUT_DIR, exist_ok=True)

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video")
    exit()

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Extract 30 evenly spaced frames
frame_numbers = [
    int(i * (total_frames - 1) / 29)
    for i in range(30)
]

saved = 0

for frame_number in frame_numbers:

    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

    ret, frame = cap.read()

    if not ret:
        continue

    filename = os.path.join(
        OUTPUT_DIR,
        f"frame_{saved + 1:02d}.jpg"
    )

    cv2.imwrite(filename, frame)

    saved += 1

cap.release()

print()
print("==============================")
print(" FRAME EXTRACTION COMPLETE")
print("==============================")
print(f"Frames saved: {saved}")
print(f"Location: {OUTPUT_DIR}")