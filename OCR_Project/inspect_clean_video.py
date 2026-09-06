import cv2
import os

video_path = "videos/clean_cctv.mp4"
output_path = "images/clean_cctv_test.jpg"

cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("ERROR: Could not open video.")
    exit()

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

print("Video opened successfully")
print("Total frames:", total_frames)
print("FPS:", fps)
print("Resolution:", width, "x", height)

# Take a frame from around the middle
frame_number = total_frames // 2
cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)

ret, frame = cap.read()

if not ret:
    print("ERROR: Could not read frame.")
    cap.release()
    exit()

cv2.imwrite(output_path, frame)

print("Test frame saved to:")
print(output_path)

cap.release()