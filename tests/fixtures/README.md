# Synthetic OCR fixtures

label-180.png and label-200.png are generated clean English food-label fixtures with differing MRP values. Product text, contact details and licence numbers are synthetic. They contain no customer photographs or personal data. tests/ocr-browser.mjs independently generates equivalent images in ignored work/ for real OCR checks.

These fixtures make button and batch tests runnable on a fresh repository download. Extraction results on these clean labels are functional checks and must not be advertised as real-package accuracy.
