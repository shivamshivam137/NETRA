import cv2

VIDEO_PATH = "videos/cctv.mp4"

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("Could not open CCTV video")
    exit()

print("CCTV video opened successfully")

frame_count = 0

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame_count += 1

    # Save every 30th frame
    if frame_count % 30 == 0:

        filename = f"images/cctv_frame_{frame_count}.jpg"

        cv2.imwrite(filename, frame)

        print("Saved:", filename)

cap.release()

print("Total frames read:", frame_count)