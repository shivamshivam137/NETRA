import cv2

input_path = "images/plate_blur.png"
output_path = "images/plate_threshold.png"

image = cv2.imread(input_path)

if image is None:
    print("ERROR: Image not found!")
    exit()

print("Image loaded successfully")

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

print("Converted to grayscale")

# Apply Otsu thresholding
_, threshold = cv2.threshold(
    gray,
    0,
    255,
    cv2.THRESH_BINARY + cv2.THRESH_OTSU
)

print("Otsu thresholding applied")

cv2.imwrite(output_path, threshold)

print("Saved:", output_path)