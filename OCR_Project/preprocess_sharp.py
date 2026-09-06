import cv2

input_path = "images/plate_blur.png"
output_path = "images/plate_sharp.png"

image = cv2.imread(input_path)

if image is None:
    print("ERROR: Image not found!")
    exit()

print("Image loaded successfully")

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

print("Converted to grayscale")

# Apply mild sharpening
blur = cv2.GaussianBlur(gray, (0, 0), 3)

sharpened = cv2.addWeighted(
    gray,
    1.3,
    blur,
    -0.3,
    0
)

print("Sharpening applied")

cv2.imwrite(output_path, sharpened)

print("Saved:", output_path)