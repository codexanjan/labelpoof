# Dataset and image provenance

## Included assets

Three synthetic product illustrations and three matching synthetic label panels generated from source by `scripts/generate-assets.mjs`. A generic product thumbnail and eleven application screenshots are also included. No remote media was downloaded and no real-brand packaging was represented as an authenticated violation.

Product scenarios:

- Honestly Good Oats: observed declarations, unphotographed batch area and an unreadable date example.
- Mountain Morning Tea: illustrative complete observations and manually marked non-applicable scenarios. These exception labels demonstrate UI behaviour; they are not legally validated conclusions.
- Sunny Crunch Mix: an illustrative human-reviewed absent-price scenario.

Labels use synthetic licence numbers and reserved `example.test` contact addresses. They are not valid licence-verification data.

## OCR fixture

The OCR smoke test creates clean English raster label images with price values of 180 and 200. It verifies extraction, conflicts, persistence and backup/import. Twelve detected declarations on that fixture do not establish real-world precision or recall.

## Future collection plan

Collect original Indian packaging photos with permission/usage rights. Include flat packets, cartons, bottles, reflective wrappers, curved labels, small print, Hindi/English labels, glare, blur, cropped images, missing surfaces and multiple date positions.

Annotate source text, regions, capture surfaces, field status, category applicability and review rationale. Keep the same product/label variant within one dataset split. Measure field precision/recall, region alignment, false adverse findings from poor evidence, applicability errors and rescan-resolution rate, with sample sizes and denominators.

User-uploaded photographs stay in that user's browser and are not added to this repository or a benchmark dataset.
