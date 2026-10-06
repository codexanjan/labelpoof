import { heading } from "../ui.js";

const documents = [
  ["01-PRD", "Product requirements", "Scope, users, priorities, journeys and release acceptance."],
  ["02-SRS", "Software requirements", "Functional requirements, data invariants, contracts and failure behavior."],
  ["03-Development-Architecture", "Development architecture", "Frontend, backend, database models, processing and deployment."],
  ["04-UI-UX", "UI and UX", "Screen behavior, evidence states, mobile navigation and accessibility."],
  ["05-Testing", "Testing and acceptance", "Requirement traceability, executable checks and production release gates."],
];

export function documentationView() {
  return `${heading("PROJECT DOCUMENTS", "Everything needed to build and review.", "Five specifications and a complete master prompt with a separate MVP mode. Updated 6 October 2026.")}
  <section class="panel"><h2>Download the complete package</h2><p>Includes five readable PDFs, editable Markdown copies, the master prompt and the verification report. Working prototype features and pending production requirements are distinguished throughout.</p><div class="capture-actions"><a class="primary" href="/documents/LabelProof-documentation.zip" download>Download all documents ZIP</a><a class="secondary" href="/documents/MASTER-PROMPT.txt" download>Download master and MVP prompt TXT</a></div></section>
  <div class="documentation-grid">${documents.map(([file, name, detail]) => `<section class="panel"><h2>${name}</h2><p>${detail}</p><div class="capture-actions"><a class="primary" href="/documents/${file}.pdf" download>Download ${name} PDF</a><a class="secondary" href="/documents/${file}.md" download>Download ${name} Markdown</a></div></section>`).join("")}</div>
  <section class="panel"><h2>Release status</h2><p>Capture, browser OCR, evidence review, report history, exports and private cloud sync are available. Public email needs a verified sender domain. Reviewed legal packs, remote OCR, enforced retention and deletion, backup restoration drills and external alerts remain production gates.</p><a class="text-button" href="/documents/VERIFICATION.md" download>Download verification report Markdown</a><a class="text-button" href="/dashboard/operations">Open release readiness</a></section>`;
}
