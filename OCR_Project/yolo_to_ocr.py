import sys
from ocr_pipeline import recognize_plate


# Get image path from command line
if len(sys.argv) < 2:
    print("ERROR: Please provide an image path")
    print("Example:")
    print("python yolo_to_ocr.py images/plate_blur.png")
    sys.exit()

image_path = sys.argv[1]

print("\n==============================")
print("       YOLO → OCR")
print("==============================")

print("Input image:", image_path)

result = recognize_plate(image_path)

if result:

    data = result[0]

    texts = data.get("rec_texts", [])
    scores = data.get("rec_scores", [])

    if texts:

        for text, score in zip(texts, scores):

            print("\nPLATE NUMBER:", text)
            print("CONFIDENCE:", f"{score * 100:.2f}%")

    else:

        print("No plate detected by OCR.")

else:

    print("OCR failed.")

print("==============================")