from paddleocr import PaddleOCR

ocr = PaddleOCR(
    lang="en",
    enable_mkldnn=False
)

result = ocr.predict("images/plate_threshold.png")

for res in result:
    res.print()