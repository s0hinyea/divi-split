# Claude Code Spec: Divi Privacy Policy Generator

## Objective
Generate a complete, legally compliant privacy policy for **Divi** — a mobile app that uses camera-based receipt scanning and AI (OpenAI API) to split bills among groups. Output should be a hosted-ready HTML file AND a `.docx` file. Both must be identical in content.

---

## App Context (Feed This to Claude Code)

| Field | Value |
|---|---|
| App Name | Divi |
| App Type | Mobile app (iOS + Android) |
| Core Function | Scan restaurant receipts with camera, split itemized bill among friends with proportional tax & tip, send payment notifications |
| AI Provider | OpenAI API (receipt images are sent to OpenAI for parsing) |
| Data Collected | Camera/receipt images, user-entered names, calculated split amounts, notification contact info (phone/email) |
| Payments Handled? | No — Divi only calculates and notifies; it does not process payments |
| Target Geography | United States (primary). Must also acknowledge GDPR since App Store is global |
| Children's Data | No — app is not directed at children under 13 |
| Developer | Individual developer / sole proprietor |
| Contact Email | [PLACEHOLDER — insert developer email] |
| Support URL | [PLACEHOLDER — insert support URL or same as privacy policy URL] |
| Effective Date | [PLACEHOLDER — insert launch date] |

---

## Required Sections (in order)

### 1. Header / Introduction
- App name, effective date, and one-paragraph plain-English summary of what the policy covers
- Must state clearly: "This policy applies to the Divi mobile application"

### 2. Information We Collect
Break into three subsections:

**a) Information You Provide**
- Names or labels you assign to people in a split (e.g. "Alex", "Sam")
- Contact information (phone number or email) if you choose to send a payment notification
- Emphasize: this info is optional and entered voluntarily

**b) Information Collected Automatically**
- Device type and OS version (for crash reporting / debugging)
- App usage data (e.g. number of scans, feature usage) — anonymized
- IP address (standard with any network request)

**c) Receipt Images (Camera Data)**
- When you take a scan, the image is transmitted to OpenAI's API for text extraction
- Images are NOT stored on Divi's servers permanently
- Must explicitly state: "Receipt images are processed by OpenAI. Please review OpenAI's privacy policy at openai.com/privacy"
- Must state that images may contain incidental personal data (names on receipts, restaurant info) and Divi takes no responsibility for what appears in user-generated scans

### 3. How We Use Your Information
- To parse and calculate your bill split
- To send payment request notifications to the contacts you specify
- To improve app performance and fix bugs
- We do NOT use your data for advertising
- We do NOT sell your data to third parties

### 4. Third-Party Services
Must include a subsection for each:

**OpenAI**
- Purpose: AI-powered receipt text extraction
- What is shared: Receipt image from each scan
- Note: As of 2025, Apple and Google require explicit disclosure of AI service usage

**Supabase**
- Purpose: Secure cloud database, authentication, and server infrastructure
- What is shared: Your account details, saved receipts, and saved contacts
- Link: https://supabase.com/privacy

**Apple / Google (App Stores)**
- Standard app distribution; refer users to Apple and Google's own policies

**Optional: Analytics (if applicable)**
- If any analytics SDK is used (Firebase, etc.), list it here
- If none, state: "We do not use third-party analytics services"

### 5. Data Retention
- Receipt images: not retained after OpenAI processes the scan (ephemeral)
- Split data: stored securely in our cloud database (Supabase) so you can view your receipt history across devices
- Contact info (names/phones): saved to your account in our database to make assigning future splits faster and easier
- Account deletion: if you request account deletion, all associated splits and contact data are permanently removed from our servers

### 6. Data Sharing
- We do not sell, trade, or rent your personal information
- We share receipt images with OpenAI solely for the purpose of text extraction
- We use securely hosted cloud infrastructure (Supabase) to store your account data
- We may disclose information if required by law (e.g. valid court order)
- No advertising networks, no data brokers

### 7. Children's Privacy
- Divi is not directed at children under 13
- We do not knowingly collect data from children under 13
- If we become aware of such collection, we will delete it promptly
- Complies with COPPA

### 8. Your Rights
Split into two subsections:

**US Users**
- California users have rights under CCPA: right to know, right to delete, right to opt-out of sale (we do not sell)
- To exercise rights, contact: [developer email]

**EU / International Users**
- GDPR rights: access, rectification, erasure, restriction, portability, objection
- Legal basis for processing: Legitimate interest (providing the service you requested)
- To exercise rights, contact: [developer email]

### 9. Security
- We use industry-standard encryption (HTTPS/TLS) for all data transmitted to OpenAI
- Receipt images are transmitted over encrypted connections
- No payment information is collected or stored by Divi
- Despite best efforts, no method of transmission is 100% secure

### 10. Changes to This Policy
- We may update this policy as the app evolves
- Users will be notified of material changes via an in-app notice or updated effective date
- Continued use of Divi after changes constitutes acceptance

### 11. Contact Us
- Plain text block with:
  - Developer name or company name
  - Email address
  - Physical mailing address (required by CalOPPA and Apple)
  - Response time commitment (e.g. "We aim to respond within 5 business days")

---

## Output Files

### File 1: `privacy_policy.html`
- Clean, minimal HTML5
- Mobile-responsive (must look good on iPhone/Android browser since this will be linked from the App Store)
- Use inline CSS only — no external dependencies
- Color scheme: white background, dark gray text (`#222`), section headers in a muted blue (`#2563EB`) or neutral dark
- Font: system-ui / sans-serif stack
- Include a visible "Last Updated" date at the top
- Each section should have an `id` attribute for anchor linking (e.g. `id="data-collection"`)
- Add a simple nav/jump list at the top linking to each section
- Must be self-contained: no JS, no external fonts, no CDN calls — it needs to work as a static file

### File 2: `privacy_policy.docx`
- Use the `docx` npm package (following the docx SKILL)
- US Letter page size (12240 x 15840 DXA), 1-inch margins
- Arial font, 12pt body, 16pt H1, 14pt H2
- App name "Divi" in the header on every page
- Page numbers in the footer (right-aligned)
- Bullet points using `LevelFormat.BULLET` (never unicode bullets)
- All section headers as `HeadingLevel.HEADING_2`
- Document title "Divi — Privacy Policy" as `HeadingLevel.HEADING_1` at top
- "Last Updated: [date]" subtitle below title, italicized, gray

---

## Placeholders to Flag

Claude Code must output a clear list at the end of the run of every placeholder that needs to be filled in before the policy goes live:

1. `[DEVELOPER_EMAIL]` — contact email for privacy requests
2. `[SUPPORT_URL]` — URL where privacy policy will be hosted
3. `[EFFECTIVE_DATE]` — launch / effective date
4. `[DEVELOPER_NAME_OR_COMPANY]` — legal name for the contact section
5. `[MAILING_ADDRESS]` — physical address (required by CalOPPA)
6. `[ANALYTICS_SDK]` — confirm whether any analytics tool is in use; if yes, add its disclosure

---

## Compliance Checklist Claude Code Must Verify Before Finishing

Before completing, Claude Code should confirm each of the following is present in the output:

- [ ] OpenAI explicitly named as a third-party processor with a link to their privacy policy
- [ ] AI usage disclosure present (required by App Store as of 2025)
- [ ] Camera usage explained with data flow described
- [ ] COPPA compliance statement (no data from children under 13)
- [ ] CCPA section for California users
- [ ] GDPR section for EU users
- [ ] No payment data collected — stated explicitly
- [ ] Data retention policy clearly states that splits and contacts are saved to our cloud servers for history/syncing purposes
- [ ] Contact information section with email placeholder
- [ ] Effective date placeholder present
- [ ] HTML file is mobile-responsive and self-contained
- [ ] DOCX file validates without errors

---

## Tone & Language Guidelines

- Plain English — avoid legal jargon where possible
- Short paragraphs (3–5 sentences max per paragraph)
- Active voice: "We collect..." not "Data is collected by..."
- Friendly but professional — matches Divi's brand voice ("You shouldn't have to be a lawyer to use an app")
- No ALL CAPS sections (common in boilerplate but bad UX)
- Avoid copy-pasting generic templates — every section should reference Divi specifically

---

## Example Opening Paragraph (Tone Reference)

> Divi is a simple tool — you point your camera at a receipt, and we tell you who owes what. This privacy policy explains exactly what happens to your data in the process. We've written it in plain English because we believe you deserve to understand it.
