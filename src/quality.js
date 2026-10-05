export async function qualityHints(blob) {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = Math.min(
    320,
    Math.max(1, Math.round((bmp.height / bmp.width) * 320)),
  );
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  const a = ctx.getImageData(0, 0, c.width, c.height).data;
  let bright = 0,
    dark = 0,
    edges = 0;
  for (let i = 0; i < a.length; i += 4) {
    const v = (a[i] + a[i + 1] + a[i + 2]) / 3;
    if (v > 248) bright++;
    if (v < 30) dark++;
    if (i >= 4) edges += Math.abs(v - (a[i - 4] + a[i - 3] + a[i - 2]) / 3);
  }
  const pixels = a.length / 4;
  const hints = [];
  if (bright / pixels > 0.55)
    hints.push("Large bright areas: inspect for glare or overexposure.");
  if (dark / pixels > 0.55)
    hints.push("Large dark areas: try more even lighting.");
  if (edges / pixels < 3)
    hints.push("Low image detail: move closer and check focus.");
  return {
    hints,
    brightFraction: bright / pixels,
    detailSignal: edges / pixels,
    method: "capture-hints-v1",
    validated: false,
  };
}
