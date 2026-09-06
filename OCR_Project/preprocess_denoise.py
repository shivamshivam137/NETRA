import cv2

input_path = "images/plate_blur.png"
output_path = "images/plate_denoise.png"

image = cv2.imread(input_path)

if image is None:
    print("ERROR: Image not found!")
    exit()

print("Image loaded successfully")

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

print("Converted to grayscale")

# Apply mild Gaussian denoising
denoised = cv2.GaussianBlur(gray, (3, 3), 0)

print("Denoising applied")

cv2.imwrite(output_path, denoised)

print("Saved:", output_path)