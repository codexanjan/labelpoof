import { mkdir, writeFile } from "node:fs/promises";
import { demoDefinitions } from "../src/demo.js";
await mkdir("public/images", { recursive: true });
const xml = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const palettes = [
  ["#efe8ca", "#3d583e", "❋"],
  ["#dce7dc", "#365f49", "♧"],
  ["#f6dfb5", "#865e32", "✺"],
];
for (const [i, demo] of demoDefinitions().entries()) {
  const [paper, ink, symbol] = palettes[i];
  const label = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900"><rect width="600" height="900" rx="20" fill="${paper}"/><rect x="24" y="24" width="552" height="852" rx="10" fill="none" stroke="${ink}" opacity=".4"/><text x="300" y="74" text-anchor="middle" font-family="sans-serif" fill="${ink}" font-size="15" letter-spacing="4">${xml(demo.brand.toUpperCase())}</text><text x="300" y="132" text-anchor="middle" font-family="Georgia,serif" fill="${ink}" font-size="35">${xml(demo.name)}</text><text x="300" y="175" text-anchor="middle" font-family="sans-serif" fill="${ink}" font-size="14" letter-spacing="2">ILLUSTRATIVE BACK PANEL</text><line x1="45" y1="204" x2="555" y2="204" stroke="${ink}" opacity=".3"/>${demo.text
    .split("\n")
    .map(
      (text, n) =>
        `<text x="45" y="${247 + n * 47}" font-family="sans-serif" fill="${ink}" font-size="${text.length > 45 ? 16 : 19}">${xml(text)}</text>`,
    )
    .join(
      "",
    )}${i === 0 ? `<text x="45" y="760" font-family="sans-serif" fill="${ink}" opacity=".22" font-size="18">Best before: [unreadable printing]</text>` : ""}<text x="300" y="844" text-anchor="middle" font-family="sans-serif" fill="${ink}" opacity=".7" font-size="11" letter-spacing="1">SYNTHETIC DEMO · NOT A REAL PRODUCT OR LICENCE</text></svg>`;
  const pack = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="450" viewBox="0 0 360 450"><defs><linearGradient id="paper"><stop stop-color="${paper}"/><stop offset=".5" stop-color="${paper}"/><stop offset="1" stop-color="${ink}" stop-opacity=".25"/></linearGradient><filter id="shadow"><feDropShadow dx="5" dy="12" stdDeviation="10" flood-opacity=".12"/></filter></defs><ellipse cx="180" cy="415" rx="104" ry="14" fill="${ink}" opacity=".09"/><g filter="url(#shadow)"><path d="M82 50 Q180 32 278 50 L293 390 Q180 413 67 390Z" fill="url(#paper)"/><path d="M82 50 Q180 32 278 50 L279 65 Q180 48 81 65Z" fill="${ink}" opacity=".14"/><path d="M67 376 Q180 398 293 376 L293 390 Q180 413 67 390Z" fill="${ink}" opacity=".14"/></g><text x="180" y="104" text-anchor="middle" font-family="sans-serif" fill="${ink}" font-size="9" letter-spacing="3">${xml(demo.brand.toUpperCase())}</text><text x="180" y="167" text-anchor="middle" font-family="Georgia,serif" fill="${ink}" font-size="${i === 0 ? 34 : 28}">${["honestly.", "mountain", "sunny crunch"][i]}</text><text x="180" y="202" text-anchor="middle" font-family="Georgia,serif" fill="${ink}" font-size="25">${["good oats", "morning tea", "snack mix"][i]}</text><text x="180" y="299" text-anchor="middle" fill="${ink}" opacity=".5" font-size="85">${symbol}</text><text x="180" y="343" text-anchor="middle" font-family="sans-serif" fill="${ink}" font-size="8" letter-spacing="2">${["WHOLEGRAIN ROLLED OATS", "PURE BLACK TEA", "A LITTLE CRUNCH, A LOT OF JOY"][i]}</text><text x="180" y="365" text-anchor="middle" font-family="sans-serif" fill="${ink}" font-size="11">${demo.text.split("\n")[0]}</text><text x="180" y="434" text-anchor="middle" font-family="sans-serif" fill="${ink}" opacity=".7" font-size="7" letter-spacing="1">SYNTHETIC DEMO PACKAGING</text></svg>`;
  await writeFile(`public${demo.image}`, label);
  await writeFile(`public${demo.productImage}`, pack);
}
console.log("Created 3 synthetic product images and 3 matching label panels.");
