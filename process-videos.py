import cv2
import os
import albumentations as A
import numpy as np

# --- CONFIGURARE ---
INPUT_FOLDER = "videos"  # Unde ai pus Atac_1.mp4, Scut_1.mp4, etc.
OUTPUT_FOLDER = "dataset"      # Unde se va crea structura pentru antrenare
FRAME_INTERVAL = 5             # Luăm un frame la fiecare 5 (previne redundanța)
AUGMENTATIONS_PER_FRAME = 2    # Câte imagini modificate generăm pentru fiecare frame extras

# Definirea augmentărilor (Luminozitate, Contrast, Blur, rotație ușoară)
# NOTĂ: Nu folosim HorizontalFlip dacă semnele depind de orientarea mâinii stângi/drepte
transform = A.Compose([
    A.RandomBrightnessContrast(p=0.5),
    A.ShiftScaleRotate(shift_limit=0.05, scale_limit=0.05, rotate_limit=15, p=0.5),
    A.RGBShift(r_shift_limit=15, g_shift_limit=15, b_shift_limit=15, p=0.3),
    A.Blur(blur_limit=3, p=0.2),
    A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
])

def create_dataset():
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    for filename in os.listdir(INPUT_FOLDER):
        if not filename.endswith(".mp4"):
            continue

        # Extragem numele clasei (ex: "Atac" din "Atac_1.mp4")
        class_name = filename.rsplit('_', 1)[0]
        class_path = os.path.join(OUTPUT_FOLDER, class_name)
        
        if not os.path.exists(class_path):
            os.makedirs(class_path)

        video_path = os.path.join(INPUT_FOLDER, filename)
        cap = cv2.VideoCapture(video_path)
        
        frame_count = 0
        saved_count = 0
        
        print(f"Procesez: {filename} -> Clasa: {class_name}")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % FRAME_INTERVAL == 0:
                # Salvează frame-ul original
                img_name = f"{filename.split('.')[0]}_f{frame_count}.jpg"
                cv2.imwrite(os.path.join(class_path, img_name), frame)
                saved_count += 1

                # Generează augmentări
                for i in range(AUGMENTATIONS_PER_FRAME):
                    augmented = transform(image=frame)["image"]
                    aug_name = f"{filename.split('.')[0]}_f{frame_count}_aug{i}.jpg"
                    cv2.imwrite(os.path.join(class_path, aug_name), augmented)
                    saved_count += 1

            frame_count += 1

        cap.release()
        print(f"Finalizat {filename}: {saved_count} imagini generate.")

if __name__ == "__main__":
    create_dataset()