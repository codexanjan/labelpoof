import { icon } from "../ui.js";
export function landing() {
  return `<div class="landing"><nav class="landing-nav"><a class="brand" href="/">${icon("scan-line")}<span>Label<span class="brand-light">Proof</span></span></a><div><a href="#features">Features</a><a href="/dashboard/rules">Rule sources</a><a href="https://github.com/codexanjan/labelpoof" target="_blank" rel="noopener">GitHub ${icon("arrow-up-right")}</a></div><a class="primary" href="/dashboard">Open dashboard ${icon("arrow-right")}</a></nav>
    <main class="landing-main"><section class="landing-hero"><div class="hero-copy"><span class="hero-tag"><span class="live-dot"></span> SIH26034 · EVIDENCE-BACKED LABEL REVIEW</span><h1>Every label<br>tells a story.<br><em>Find the proof.</em></h1><p>Scan packaged products. Follow the evidence. Know what’s present, what’s unreadable, and what needs another photo.</p><div class="landing-actions"><a class="primary" href="/dashboard">Explore the dashboard ${icon("arrow-right")}</a><a class="secondary" href="/dashboard/scans/demo-oats">Try sample report ${icon("scan-search")}</a></div><div class="hero-trust">${icon("check-check")} Guided capture <span>·</span> Image evidence <span>·</span> Indian rules</div></div><div class="landing-art"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><img src="/images/oats-pack.svg" alt="Synthetic Earth and Grain oat packaging"><div class="float-card verified">${icon("circle-check")}<div>Net quantity observed<small>Linked to image evidence</small></div></div><div class="float-card rescan">${icon("focus")}<div>A closer look needed<small>Retake the date marking</small></div></div><span class="art-caption">SYNTHETIC DEMONSTRATION PRODUCT</span></div></section>
    <section class="landing-principle"><div><span class="eyebrow">THE LABELPROOF DIFFERENCE</span><h2>“Can’t read it” doesn’t mean<br>“it isn’t there.”</h2></div><div><p>Incomplete photos should lead to a better photo, not an unsupported accusation. LabelProof keeps observations, uncertainty, and reviewed absence separate.</p><div class="status-examples"><span class="badge unreadable">${icon("eye-off")} Unreadable</span><span class="badge not_captured">${icon("camera-off")} Not photographed</span><span class="badge missing">${icon("circle-alert")} Reviewed absence</span></div></div></section>
    <section id="features" class="landing-features"><span class="eyebrow">A COMPLETE REVIEW WORKSPACE</span><h2>From first photo to final report.</h2><div class="feature-grid">${[
      [
        "camera",
        "Guided capture",
        "Photograph every surface, label your images, and check readability.",
      ],
      [
        "scan-search",
        "Real browser OCR",
        "Extract English or English/Hindi text with source image coordinates.",
      ],
      [
        "list-checks",
        "Review & rescan",
        "Turn uncertain findings into specific next steps and traceable corrections.",
      ],
      [
        "images",
        "Evidence library",
        "Keep original photos, highlights, OCR text and provenance together.",
      ],
      [
        "files",
        "Versioned reports",
        "Reopen earlier assessments and export JSON, CSV or print-to-PDF.",
      ],
      [
        "chart-no-axes-combined",
        "Workspace analytics",
        "See observation counts and coverage gaps without a misleading legal score.",
      ],
    ]
      .map(
        ([i, t, d]) =>
          `<article class="panel">${icon(i)}<h3>${t}</h3><p>${d}</p></article>`,
      )
      .join("")}</div></section>
    <section class="landing-cta"><span class="eyebrow">START WITH A CLOSER LOOK</span><h2>Your next discovery is one scan away.</h2><p>Three synthetic sample products are ready to explore. Upload real packaging when you’re ready.</p><a class="primary" href="/dashboard">Open your workspace ${icon("arrow-right")}</a></section></main><footer><span>LabelProof · Evidence, not assumptions.</span><span>Browser workspace · Preliminary label review</span></footer></div>`;
}
