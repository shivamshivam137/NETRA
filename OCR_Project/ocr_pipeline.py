import cv2
from paddleocr import PaddleOCR


# -----------------------------------
# 1. Load PaddleOCR
# -----------------------------------

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)


# -----------------------------------
# 2. Preprocess image
# -----------------------------------

def preprocess_image(image_path):

    image = cv2.imread(image_path)

    if image is None:
        print("ERROR: Image not found!")
        return None

    print("Image loaded successfully")

    # Resize
    image = cv2.resize(image, (1200, 600))

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Otsu thresholding
    _, threshold = cv2.threshold(
        gray,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    print("Preprocessing completed")

    return threshold


# -----------------------------------
# 3. OCR function
# -----------------------------------

def recognize_plate(image_path):

    processed_image = preprocess_image(image_path)

    if processed_image is None:
        return None

    # Save processed image
    cv2.imwrite(
        "images/plate_ocr_input.png",
        processed_image
    )

    print("Processed image saved")

    # Convert grayscale to 3-channel
    ocr_image = cv2.cvtColor(
        processed_image,
        cv2.COLOR_GRAY2BGR
    )

    print("Starting OCR...")

    # Run OCR
    result = ocr.predict(ocr_image)

    return result


# -----------------------------------
# 4. Test
# -----------------------------------

if __name__ == "__main__":

    image_path = "images/plate_blur.png"

    result = recognize_plate(image_path)

    print("\n==============================")
    print("       OCR RESULT")
    print("==============================")

    if result:

        data = result[0]

        texts = data.get("rec_texts", [])
        scores = data.get("rec_scores", [])

        if texts:

            for text, score in zip(texts, scores):

                print("PLATE NUMBER:", text)
                print("CONFIDENCE:", f"{score * 100:.2f}%")

        else:

            print("No plate number detected.")

    else:

        print("OCR failed.")

    print("==============================")