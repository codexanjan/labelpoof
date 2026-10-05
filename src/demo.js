import { assess, RULE_PACK, PIPELINE } from "./rules.js";
import { saveAssessment, get } from "./storage.js";
const demos = [
  {
    id: "demo-oats",
    name: "Honestly Good Oats",
    brand: "Earth & Grain",
    category: "Cereals & grains",
    image: "/images/oats-label.svg",
    productImage: "/images/oats-pack.svg",
    text: "Net Wt. 400 g\nMRP: Rs. 180.00\nManufactured by Demo Foods, Pune 411001\nFSSAI: 12345678901234\nIngredients: 100% wholegrain oats\nConsumer care: care@example.test\nNutrition information: Energy 380 kcal per 100 g\nContains: oats\nCountry of origin: India\nStore in a cool and dry place",
  },
  {
    id: "demo-tea",
    name: "Mountain Morning Tea",
    brand: "Hill & Kettle",
    category: "Tea & beverages",
    image: "/images/tea-label.svg",
    productImage: "/images/tea-pack.svg",
    text: "Net Wt. 250 g\nMRP: Rs. 240.00\nManufactured by Demo Tea Co, Darjeeling 734101\nFSSAI: 23456789012345\nBatch no: TEA2601\nBest before: 31 December 2027\nIngredients: Black tea\nConsumer care: hello@example.test\nCountry of origin: India\nStore in a cool dry place",
  },
  {
    id: "demo-snack",
    name: "Sunny Crunch Mix",
    brand: "Little Harvest",
    category: "Snacks & mixes",
    image: "/images/snack-label.svg",
    productImage: "/images/snack-pack.svg",
    text: "Net Wt. 150 g\nManufactured by Demo Snacks, Mumbai 400001\nFSSAI: 34567890123456\nBatch no: SN2601\nBest before: 30 June 2027\nIngredients: Peanuts, chickpeas, salt\nConsumer care: snacks@example.test\nNutrition information: Energy 480 kcal per 100 g\nContains: peanuts\nCountry of origin: India\nStore in a cool dry place",
  },
];
export async function seedDemos() {
  for (let n = 0; n < demos.length; n++) {
    const demo = demos[n];
    if (await get("scans", demo.id)) continue;
    const at = new Date(Date.now() - n * 86400000).toISOString();
    const image = {
      id: `${demo.id}-back`,
      scanId: demo.id,
      surface: "Back",
      fixture: demo.image,
      width: 600,
      height: 900,
      quality: "Readable",
      text: demo.text,
      confidence: null,
      demo: true,
      createdAt: at,
      lines: demo.text
        .split("\n")
        .map((text, i) => ({
          text,
          confidence: null,
          bbox: { x0: 45, y0: 225 + i * 47, x1: 555, y1: 253 + i * 47 },
        })),
    };
    const findings = assess([image]);
    if (demo.id === "demo-oats")
      Object.assign(
        findings.find((f) => f.key === "date"),
        { status: "unreadable", imageId: image.id },
      );
    if (demo.id === "demo-tea")
      for (const key of ["nutrition", "allergen"])
        Object.assign(
          findings.find((f) => f.key === key),
          {
            status: "not_applicable",
            applicability: "does_not_apply",
            humanConfirmed: true,
            reviewNote:
              "Synthetic scenario for the review workflow. Actual category exceptions have not been legally validated.",
          },
        );
    if (demo.id === "demo-snack")
      Object.assign(
        findings.find((f) => f.key === "price"),
        {
          status: "missing",
          applicability: "applies",
          humanConfirmed: true,
          coverageConfirmed: true,
          coverageImageIds: [image.id],
          imageId: image.id,
          reviewNote:
            "Synthetic complete-panel scenario: no retail price is included in the illustrative label. Not an allegation against a real product.",
        },
      );
    const scan = {
      id: demo.id,
      name: demo.name,
      brand: demo.brand,
      category: demo.category,
      origin: "Domestic",
      demo: true,
      productImage: demo.productImage,
      createdAt: at,
      updatedAt: at,
      latestAssessmentId: `${demo.id}-v1`,
    };
    const assessment = {
      id: `${demo.id}-v1`,
      scanId: demo.id,
      version: 1,
      createdAt: at,
      reason: "Synthetic example loaded",
      rulePack: RULE_PACK,
      pipeline: PIPELINE,
      imageIds: [image.id],
      imageSnapshots: [
        {
          id: image.id,
          fixture: image.fixture,
          surface: image.surface,
          quality: image.quality,
          width: image.width,
          height: image.height,
        },
      ],
      productSnapshot: {
        name: scan.name,
        brand: scan.brand,
        category: scan.category,
        origin: scan.origin,
        demo: true,
      },
      findings,
      reviewer: "Demo reviewer",
      demo: true,
    };
    await saveAssessment(scan, [image], assessment, {
      id: `${demo.id}-loaded`,
      scanId: demo.id,
      type: "demo_loaded",
      message: `${demo.name} sample loaded`,
      at,
      actor: "Demo workspace",
    });
  }
}
export function demoDefinitions() {
  return demos;
}
