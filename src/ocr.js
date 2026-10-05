export async function readImages(images, settings, onProgress, signal) {
  const pending = images.filter((image) => image.text === undefined);
  if (!pending.length) return images;
  const { createWorker } = await import("tesseract.js");
  if (signal?.aborted)
    throw new DOMException("Processing cancelled", "AbortError");
  let worker;
  let finished = false;
  const abortError = () =>
    new DOMException("Processing cancelled", "AbortError");
  const bounded = (promise) =>
    new Promise((resolve, reject) => {
      const stop = () => {
        cleanup();
        worker?.terminate();
        reject(abortError());
      };
      const timer = setTimeout(() => {
        cleanup();
        finished = true;
        worker?.terminate();
        reject(new Error("OCR timed out. Check your connection and retry."));
      }, 90000);
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", stop);
      };
      if (signal?.aborted) {
        cleanup();
        reject(abortError());
        return;
      }
      signal?.addEventListener("abort", stop, { once: true });
      promise.then(
        (value) => {
          cleanup();
          resolve(value);
        },
        (error) => {
          cleanup();
          reject(error);
        },
      );
    });
  try {
    worker = await bounded(
      createWorker(settings.language || "eng", 1, {
        errorHandler: () => {}, // Worker promises carry failures to the retry UI.
        logger: (message) =>
          onProgress({
            stage: message.status,
            progress: message.progress || 0,
          }),
      }).then((created) => {
        if (signal?.aborted || finished) {
          created.terminate();
          throw abortError();
        }
        worker = created;
        return created;
      }),
    );
    for (const [index, image] of pending.entries()) {
      onProgress({
        stage: `Reading ${image.surface} photo ${index + 1} of ${pending.length}`,
        progress: 0,
      });
      const { data } = await bounded(
        worker.recognize(
          image.blob || image.url,
          {},
          { text: true, blocks: true },
        ),
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
