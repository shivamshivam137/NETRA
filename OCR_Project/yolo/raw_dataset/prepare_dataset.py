import os
import shutil
import random

BASE_DIR = r"C:\OCR_Project\yolo\raw_dataset"

SOURCE_FOLDERS = ["vid-1", "vid-2", "vid-3"]

TRAIN_IMAGE_DIR = os.path.join(BASE_DIR, "images", "train")
VAL_IMAGE_DIR = os.path.join(BASE_DIR, "images", "val")

TRAIN_LABEL_DIR = os.path.join(BASE_DIR, "labels", "train")
VAL_LABEL_DIR = os.path.join(BASE_DIR, "labels", "val")

for folder in [
    TRAIN_IMAGE_DIR,
    VAL_IMAGE_DIR,
    TRAIN_LABEL_DIR,
    VAL_LABEL_DIR
]:
    os.makedirs(folder, exist_ok=True)

pairs = []

for source in SOURCE_FOLDERS:

    source_path = os.path.join(BASE_DIR, source)

    for file in os.listdir(source_path):

        if file.lower().endswith((".jpg", ".jpeg", ".png")):

            image_path = os.path.join(source_path, file)

            label_file = os.path.splitext(file)[0] + ".txt"
            label_path = os.path.join(source_path, label_file)

            if os.path.exists(label_path):
                pairs.append((image_path, label_path))

print("Total image-label pairs:", len(pairs))

random.seed(42)
random.shuffle(pairs)

split_index = int(len(pairs) * 0.7)

train_pairs = pairs[:split_index]
val_pairs = pairs[split_index:]

print("Training:", len(train_pairs))
print("Validation:", len(val_pairs))

def copy_pairs(pairs, image_dest, label_dest):

    for image_path, label_path in pairs:

        shutil.copy2(
            image_path,
            os.path.join(image_dest, os.path.basename(image_path))
        )

        shutil.copy2(
            label_path,
            os.path.join(label_dest, os.path.basename(label_path))
        )

copy_pairs(
    train_pairs,
    TRAIN_IMAGE_DIR,
    TRAIN_LABEL_DIR
)

copy_pairs(
    val_pairs,
    VAL_IMAGE_DIR,
    VAL_LABEL_DIR
)

print()
print("Dataset preparation completed!")