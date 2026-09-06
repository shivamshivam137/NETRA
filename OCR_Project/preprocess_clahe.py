import cv2

input_path = "images/plate_blur.png"
output_path = "images/plate_clahe.png"

image = cv2.imread(input_path)

if image is None:
    print("ERROR: Image not found!")
    exit()

print("Image loaded successfully")

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

print("Converted to grayscale")

# Apply CLAHE
clahe = cv2.createCLAHE(
    clipLimit=2.0,
    tileGridSize=(8, 8)
)

enhanced = clahe.apply(gray)

print("CLAHE applied")

cv2.imwrite(output_path, enhanced)

print("Saved:", output_path)