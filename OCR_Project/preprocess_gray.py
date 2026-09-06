import cv2

input_path = "images/plate_blur.png"
output_path = "images/plate_gray.png"

image = cv2.imread(input_path)

if image is None:
    print("ERROR: Image not found!")
    exit()

print("Image loaded successfully")

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

print("Converted to grayscale")

cv2.imwrite(output_path, gray)

print("Saved:", output_path)