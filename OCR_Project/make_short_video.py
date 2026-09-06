import cv2

input_video = "videos/traffic_cctv.mp4"
output_video = "videos/traffic_short.mp4"

cap = cv2.VideoCapture(input_video)

fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# 10 seconds
max_frames = int(fps * 10)

fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    output_video,
    fourcc,
    fps,
    (width, height)
)

frame_count = 0

while frame_count < max_frames:

    ret, frame = cap.read()

    if not ret:
        break

    out.write(frame)
    frame_count += 1

cap.release()
out.release()

print("Short CCTV video created successfully!")
print("Frames:", frame_count)
print("Output:", output_video)