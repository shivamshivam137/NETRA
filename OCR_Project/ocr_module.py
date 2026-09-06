import cv2
import sys
import re
from paddleocr import PaddleOCR


# ==========================================
# 1. PREPROCESSING
# ==========================================

def preprocess_image(image_path):

    image = cv2.imread(image_path)

    if image is None:
        raise FileNotFoundError(
            f"Could not load image: {image_path}"
        )

    print("Image loaded successfully")

    # Resize
    image = cv2.resize(image, (1200, 600))
    print("Image resized")

    # Grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    print("Converted to grayscale")

    # Contrast enhancement
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(gray)
    print("Contrast enhanced")

    # Sharpening
    blurred = cv2.GaussianBlur(
        enhanced,
        (0, 0),
        3
    )

    sharpened = cv2.addWeighted(
        enhanced,
        1.5,
        blurred,
        -0.5,
        0
    )

    print("Image sharpened")

    # Convert back to 3-channel
    # PaddleOCR expects a color image
    processed = cv2.cvtColor(
        sharpened,
        cv2.COLOR_GRAY2BGR
    )

    output_path = "images/plate_processed.png"

    cv2.imwrite(
        output_path,
        processed
    )

    print("Processed image saved:")
    print(output_path)

    return processed


# ==========================================
# 2. INITIALIZE OCR
# ==========================================

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)


# ==========================================
# 3. RECOGNIZE NUMBER PLATE
# ==========================================

def recognize_plate(image_path):

    processed_image = preprocess_image(image_path)

    print("Starting OCR...")

    result = ocr.predict(processed_image)

    plate_number = ""
    confidence = 0.0

    # ======================================
    # Extract text
    # ======================================

    for res in result:

        texts = res.get("rec_texts", [])
        scores = res.get("rec_scores", [])

        for text, score in zip(texts, scores):

            clean_text = re.sub(
                r"[^A-Z0-9]",
                "",
                text.upper()
            )

            # Indian vehicle registration pattern
            pattern = r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$"

            if re.match(pattern, clean_text):

                plate_number = clean_text
                confidence = float(score)

                break

    # ======================================
    # Display result
    # ======================================

    print()
    print("==============================")
    print("         OCR RESULT")
    print("==============================")

    if plate_number:

        print(
            "PLATE NUMBER:",
            plate_number
        )

        print(
            "CONFIDENCE:",
            f"{confidence * 100:.2f}%"
        )

    else:

        print(
            "PLATE NUMBER: Not detected"
        )

    print("==============================")

    return {
        "plate_number": plate_number,
        "confidence": confidence
    }


# ==========================================
# 4. MAIN
# ==========================================

if __name__ == "__main__":

    if len(sys.argv) > 1:

        image_path = sys.argv[1]

    else:

        image_path = "images/plate_blur.png"

    result = recognize_plate(image_path)

    print()
    print("Final result:")
    print(result)