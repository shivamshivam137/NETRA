import cv2
from ocr_module import recognize_plate


def process_plate_crop(plate_crop):

    if plate_crop is None:
        print("ERROR: Plate crop is empty.")
        return None

    # Save the plate crop temporarily
    crop_path = "images/yolo_plate_crop.png"
    cv2.imwrite(crop_path, plate_crop)

    # Send saved crop to existing OCR
    result = recognize_plate(crop_path)

    return result


if __name__ == "__main__":

    # Temporary test image
    plate_image = cv2.imread("images/plate_blur.png")

    if plate_image is None:
        print("ERROR: Could not load plate image.")
        exit()

    print()
    print("==============================")
    print("       YOLO → OCR TEST")
    print("==============================")

    result = process_plate_crop(plate_image)

    print()
    print("FINAL OUTPUT:")
    print(result)

    print("==============================")