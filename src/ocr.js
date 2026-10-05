export async function readImages(images, settings, onProgress) {
  const pending = images.filter((image) => image.text === undefined);
  if (!pending.length) return images;
  const { createWorker } = await import("tesseract.js");
  let worker;
  try {
    worker = await createWorker(settings.language || "eng", 1, {
      logger: (message) =>
        onProgress({ stage: message.status, progress: message.progress || 0 }),
    });
    for (const [index, image] of pending.entries()) {
      onProgress({
        stage: `Reading ${image.surface} photo ${index + 1} of ${pending.length}`,
        progress: 0,
      });
      const { data } = await worker.recognize(
        image.blob || image.url,
        {},
        { text: true, blocks: true },
      );
      image.text = data.text;
      image.lines =
        data.blocks?.flatMap((block) =>
          block.paragraphs.flatMap((paragraph) =>
            paragraph.lines.map((line) => ({
              text: line.text,
              confidence: line.confidence,
              bbox: line.bbox,
            })),
          ),
        ) || [];
      image.confidence = data.confidence;
      image.ocrEngine = "Tesseract.js 6";
      image.language = settings.language;
      if (image.quality !== "Unreadable")
        image.quality =
          data.confidence < settings.confidenceThreshold
            ? "Unreadable"
            : "Readable";
      image.qualityReason =
        data.confidence < settings.confidenceThreshold
          ? "Low OCR confidence. This is an uncertainty signal, not a validated blur or glare measurement."
          : "OCR completed; quality still needs human review.";
      onProgress({ stage: `${image.surface} text extracted`, progress: 1 });
    }
    return images;
  } finally {
    await worker?.terminate();
  }
}
