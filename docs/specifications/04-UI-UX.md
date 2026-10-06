# LabelProof UI UX Specification

Document LP UX 1.0 | Prepared 6 October 2026 | Product baseline 3.2 | Delivery package 3.3

## Experience goal

The interface should make every label finding understandable through an original photograph, plain-language status and a useful next action. Users should recognize whether more evidence is needed before judging a product. This document specifies navigation, screen behavior, interaction states, visual design, accessibility and production improvements for designers and frontend developers.

Current screens support an observation prototype. Pending authentication email, remote processing and legal validation must remain visibly pending. Do not replace these statuses with optimistic success labels or a compliance percentage.

## Information architecture

The public route / explains the product and links to the workspace and samples. /dashboard is the workspace overview. Navigation groups product work through My scans, Review queue, Evidence library and Reports; analysis through Analytics and Rule library; team work through Account and privacy, Team and cloud, Processing and batches, Review workflow and Compare reports; maintenance through Activity, Settings, Release readiness and Project documents.

New scan uses /dashboard/new. Each product report has /dashboard/scans/{id}, with field and version query parameters for a deep link to selected evidence or historical assessment. Each screen needs a clear heading, current context and a route that reloads without losing its saved data.

## Design system

Retain the existing warm neutral background, forest text, teal primary actions and restrained panel layout. Use current src/style.css as the source of truth; proposed tokens should consolidate its values rather than introduce a competing stylesheet. Text and spacing hierarchy must carry meaning independently of color.

Use a consistent scale for page title, section title, body, helper text and provenance. Body text should remain comfortably readable on mobile. Primary buttons describe the immediate action, such as Review label or Download cloud workspace. Secondary actions should be lower emphasis. Destructive actions need an explicit confirmation with the object and consequences, plus a safe cancellation action.

States use named badges: Observed, Not photographed, Unreadable, Needs review, Conflicting, Potential issue and Not applicable. Muted green supports observations, blue-gray supports missing capture, amber supports uncertainty and warm red supports potential issues. Never rely on red or green alone. An icon, text and explanation must accompany status.

Cards and tables should align repeated values consistently. Long product names, translated copy, source URLs and error messages must wrap. Avoid fixed heights for explanation blocks. Image evidence must preserve aspect ratio, with zoom controls and a visible selected-image label.

## Screen specifications

### Overview and product library

Overview displays counts derived from stored observations, product previews, review priorities and recent activity. Counts are not a legal compliance score. New product scan is the primary action. The product library supports name, brand and category search, sample/upload filters and report navigation. Empty results include Clear filters; a truly empty workspace includes New scan and Reload samples where available.

### Guided capture

Present product metadata before evidence capture. Each image card shows thumbnail, filename, surface, readable status, quality hints and Remove. Keep the seven surface options consistent with the evidence model. Suggestions identify useful places to inspect; a field may appear on another surface, so suggestions must not become legal assumptions.

Before processing, show the number of images, selected language and initial-download requirement. During OCR, show stage and progress with a Cancel action when safe. Disable repeated submission while saving. If processing fails, keep images and entered metadata, explain the reason in plain language and expose Retry. Camera access and file picker behavior must follow device capabilities without falsely reporting capture success.

Proposed production capture adds measured blur, glare, crop and tiny-text guidance. It should say Retake the date panel closer only when the relevant evidence or user-selected target supports that instruction. A quality hint is a suggestion, not proof that a declaration is absent.

### Evidence report

Desktop uses a finding list beside the image viewer. Selecting a declaration displays its value, state, source reference, provenance and review notes, and selects the linked photograph. Draw a box only for a valid observed region. The report needs image switching, zoom, version selection, JSON/CSV/PDF export, Review or correct and Add a photo and reassess.

Conflicts display all retained candidates with their own images. Historical versions show Read-only earlier assessment and their original product/image snapshots. If a requested version is unavailable, show an explanation and a link to a valid report. A legal source entry point must be labelled Reference pending review when no operative rule is published.

On mobile, place the selected finding summary above the image, followed by evidence details and actions. Preserve an obvious way to return to the finding list. Avoid horizontal scrolling of the primary workflow and do not hide review rationale behind hover-only behavior.

### Correction dialog

The dialog includes observation state, exact text, applicability, image selection, rationale, readable-coverage confirmation where needed and optional image coordinates. Show state-specific validation before saving. Potential issue requires applicability and readable-coverage attestation. Not applicable requires an exception rationale. Observed requires text and evidence. A changed value clears a stale box unless a valid new region is entered.

Focus moves to the dialog heading or first logical input, remains within the native modal and returns to the initiating control on close. Escape cancels a dismissible review dialog. Saving an assessment shows progress and protects against duplicate clicks. Failure keeps entered review text so it can be corrected.

### Review queue and evidence library

The queue separates uncaptured, unreadable, review, conflict and potential-issue states. Every item names the declaration and gives a reason. Targeted rescan carries the product and declaration context into capture. Inspect evidence opens the correct report field. Filter selection remains visible and empty filters explain that no matching items exist.

The evidence library shows surface-filtered thumbnails and original-image inspection with OCR text and provenance. Unavailable originals must display a truthful placeholder and recovery guidance. Never replace a real photograph with an illustrative pack while retaining a claim of evidence.

### Accounts and cloud team

Account and privacy explains local use and cloud access. The demo card displays public credentials and Sign in to demo. After demo sign-in, show Shared demo and Read-only cloud access. Hide credential-change controls for the shared demo. Local experiments can remain available, with a clear distinction from protected cloud samples.

Team and cloud needs organization creation, load/select controls, membership display, role selection and explicit upload/download actions. Show the selected organization and current cloud version. Demo users can load and download; disabled writes explain the restriction. A version conflict must offer a safe download and reconciliation path, not an automatic overwrite.

Production account switching must prevent accidental upload of another account's device-wide cached records. Pending email setup should be explicit at signup and recovery controls. Once configured, success text should say Check your email without exposing whether an unrelated address is registered.

### Processing and approvals

Current batch jobs operate in the browser and should explain that the page must remain open. Records show state, product, timestamp and retry action. Stop after current product should leave unfinished work resumable. A future remote job view displays Queued, Running, Retry scheduled, Needs rescan, Failed, Cancelled or Completed and offers a suitable action for each.

Review workflow shows selected assessment version, assigned reviewer, notes, rescan request and preliminary decision. Cloud decisions require a permitted role and exact version binding. A displayed decision on an older version must not appear as approval of newer evidence.

### Rules, readiness and documents

Rule library distinguishes source references, extraction detectors and non-executable draft notes. Release readiness shows connected versus pending services, health checks and known gates. Project documents provides five specifications, editable sources, master prompt, MVP prompt within the master and an all-documents package. Download labels must include the file format and avoid opening an empty route.

## Responsive and accessibility requirements

Validate widths of 390, 768 and 1440 pixels plus 200 percent text zoom. Mobile navigation closes via the close button, backdrop, Escape or destination link. Long navigation remains scrollable and the primary page action remains reachable. Use a labelled menu toggle with correct expanded state.

Target WCAG 2.2 AA. Check visible focus, input labels, headings and landmarks, contrast, error association and keyboard ordering. Aim for 44-pixel interactive targets where feasible; meet the applicable minimum target criterion. Status updates use a restrained live region without announcing every OCR frame. Product images have meaningful alternative text; decorative icons are hidden from assistive technology. Provide progress and final outcome in text.

## Content and failure messages

Not photographed: Add a photo of the relevant label area. Unreadable: Retake this area closer with even light. Needs review: Inspect the captured images before deciding. Conflicting: Two photographs show different values; compare both. Potential issue: A reviewer recorded a possible absence; legal review is still required.

Storage blocked: Another tab is holding an older workspace; close or refresh it and retry. Storage unavailable: Enable site storage or use a supported regular browser. OCR failure: Photos are retained for retry. Cloud version conflict: A newer workspace exists; download it before reconciling changes. Missing SMTP: Public account email setup is pending; confirmed and demo accounts can sign in.

Do not invent completion, percentages or accuracy. Link errors to the action that can resolve them. Notifications should not vanish before users can read them; long failures belong in a persistent message near the affected control.

## Usability acceptance

Observe at least five representative participants completing capture, targeted rescan, correction and export without coaching before changing status to usability validated. Record task completion, time, confusion between absence and uncertainty, and recovery success. This is a proposed study; no participants or findings are invented. Include a reviewer and a mobile uploader. Combine it with keyboard and screen-reader checks from Testing.
