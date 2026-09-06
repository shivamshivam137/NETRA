import cv2

input_path = "images/plate_blur.png"
output_path = "images/plate_preprocessed.png"

image = cv2.imread(input_path)

if image is None:
    print("ERROR: Image not found!")
    exit()

print("Original image loaded successfully")

# Resize to a maximum width of 1200 pixels
height, width = image.shape[:2]

max_width = 1200

if width > max_width:
    scale = max_width / width
    new_width = int(width * scale)
    new_height = int(height * scale)

    resized = cv2.resize(
        image,
        (new_width, new_height),
        interpolation=cv2.INTER_CUBIC
    )
else:
    resized = image

print("Step 1: Image resized")

# Convert to grayscale
gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

print("Step 2: Converted to grayscale")

# CLAHE contrast enhancement
clahe = cv2.createCLAHE(
    clipLimit=2.0,
    tileGridSize=(8, 8)
)

enhanced = clahe.apply(gray)

print("Step 3: Contrast enhanced")

# Mild sharpening
blur = cv2.GaussianBlur(enhanced, (0, 0), 3)

sharpened = cv2.addWeighted(
    enhanced,
    1.3,
    blur,
    -0.3,
    0
)

print("Step 4: Image sharpened")

cv2.imwrite(output_path, sharpened)

print("Preprocessing completed!")
print("Saved as:", output_path)