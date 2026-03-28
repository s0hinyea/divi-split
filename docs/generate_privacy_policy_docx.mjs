import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageNumber,
  NumberFormat,
  LevelFormat,
  UnderlineType,
  Header,
  Footer,
  convertInchesToTwip,
} from "docx";
import { writeFileSync } from "fs";

const PLACEHOLDER_COLOR = "CC0000"; // red so placeholders are obvious
const HEADING_COLOR = "2563EB";
const SUBTITLE_COLOR = "666666";

const EFFECTIVE_DATE = "[EFFECTIVE_DATE]";
const DEVELOPER_EMAIL = "divi";
const DEVELOPER_NAME = "[DEVELOPER_NAME_OR_COMPANY]";
const MAILING_ADDRESS = "[MAILING_ADDRESS]";
const SUPPORT_URL = "[SUPPORT_URL]";

function ph(text) {
  return new TextRun({ text, color: PLACEHOLDER_COLOR, italics: true });
}

function bold(text) {
  return new TextRun({ text, bold: true });
}

function link(text) {
  return new TextRun({ text, underline: { type: UnderlineType.SINGLE }, color: "2563EB" });
}

function p(children) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [new TextRun(children)],
    spacing: { after: 160 },
  });
}

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 80 },
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: HEADING_COLOR, size: 28 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    border: { bottom: { color: "E5E7EB", size: 6, space: 4, style: "single" } },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 200, after: 80 },
  });
}

function bullet(children) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [new TextRun(children)],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } },
            },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Divi", bold: true, color: "444444", size: 20 })],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      children: [
        // Title block
        h1("Divi — Privacy Policy"),
        new Paragraph({
          children: [
            new TextRun({ text: "Last Updated: ", italics: true, color: SUBTITLE_COLOR, size: 22 }),
            new TextRun({ text: EFFECTIVE_DATE, italics: true, color: PLACEHOLDER_COLOR, size: 22 }),
          ],
          spacing: { after: 400 },
        }),

        // Intro
        p([
          new TextRun(
            "Divi is a simple tool — you point your camera at a receipt, and we tell you who owes what. " +
            "This privacy policy explains exactly what happens to your data in the process. " +
            "We've written it in plain English because we believe you deserve to understand it. " +
            "This policy applies to the Divi mobile application."
          ),
        ]),

        // 1. Information We Collect
        h2("1. Information We Collect"),

        h3("a) Information You Provide"),
        p('When you create a bill split, you may enter names or labels for the people involved (for example, \u201CAlex\u201D or \u201CSam\u201D). This information is entirely optional and up to you \u2014 you can use nicknames, initials, or any label you like.'),
        p("If you choose to send a payment notification, you may also enter a phone number or email address for each person. This is also voluntary. We never require it to calculate a split."),

        h3("b) Information Collected Automatically"),
        p("To keep Divi running smoothly, we collect limited technical information automatically:"),
        bullet("Device type and operating system version (for debugging and compatibility)"),
        bullet("Anonymized app usage data (such as how many scans you run or which features you use) to help us improve the app"),
        bullet("Your IP address, which is a standard part of any network request"),
        p("This data is not linked to your identity and is used solely for technical purposes."),

        h3("c) Receipt Images (Camera Data)"),
        p("When you scan a receipt, the image you capture is transmitted to OpenAI's API so that the text on the receipt can be extracted and parsed. This is the core function of the app."),
        p([
          bold("Important: "),
          new TextRun("Receipt images are processed by OpenAI. Please review OpenAI's privacy policy at "),
          link("openai.com/privacy"),
          new TextRun("."),
        ]),
        p("Divi does not permanently store your receipt images on its own servers. Once OpenAI processes the image and returns the parsed data, the image is not retained by Divi."),
        p("Receipt images may incidentally contain personal data — such as names printed on receipts or restaurant details. Divi takes no responsibility for the content that appears in user-generated scans. We recommend only scanning receipts from your own meals."),

        // 2. How We Use Your Information
        h2("2. How We Use Your Information"),
        p("We use the information we collect for specific, limited purposes:"),
        bullet("To parse receipt data and calculate how to split the bill among your group"),
        bullet("To send payment request notifications to the contacts you specify"),
        bullet("To improve app performance, fix bugs, and enhance reliability"),
        bullet("To maintain your receipt history so it's available across your devices"),
        p([bold("We do not"), new TextRun(" use your data for advertising or to build a profile of you for marketing purposes.")]),
        p([bold("We do not"), new TextRun(" sell your personal information to third parties — ever.")]),

        // 3. Third-Party Services
        h2("3. Third-Party Services"),
        p("Divi works with the following third-party services. Each one receives only the data necessary for its specific purpose."),

        h3("OpenAI"),
        p([bold("Purpose: "), new TextRun("AI-powered receipt text extraction.")]),
        p([bold("What is shared: "), new TextRun("The receipt image you capture during each scan.")]),
        p("Divi uses OpenAI's API to process receipt images. As of 2025, Apple and Google require explicit disclosure when an app uses AI services to process user content. Per that requirement: Divi uses OpenAI to analyze your receipt images. Images are sent over an encrypted connection and are not retained by Divi after processing."),
        p(["Privacy policy: ", link("openai.com/privacy")]),

        h3("Supabase"),
        p([bold("Purpose: "), new TextRun("Secure cloud database, user authentication, and backend infrastructure.")]),
        p([bold("What is shared: "), new TextRun("Your account details, saved receipt splits, and saved contact names.")]),
        p(["Privacy policy: ", link("supabase.com/privacy")]),

        h3("Apple App Store & Google Play Store"),
        p("Divi is distributed through Apple's App Store and the Google Play Store. These platforms may collect their own data as part of the standard app distribution process. Please refer to Apple's and Google's own privacy policies for details."),

        h3("Analytics"),
        p("We do not use third-party analytics services at this time."),

        // 4. Data Retention
        h2("4. Data Retention"),
        bullet([bold("Receipt images: "), new TextRun("Not retained by Divi after OpenAI processes the scan. The image is ephemeral — it exists only long enough to be analyzed.")]),
        bullet([bold("Split data: "), new TextRun("Your bill splits are stored securely in our cloud database (Supabase) so you can view your receipt history across all your devices.")]),
        bullet([bold("Contact info: "), new TextRun("Saved to your account in our database so that assigning future splits is faster. You can delete individual contacts from within the app at any time.")]),
        bullet([bold("Account deletion: "), new TextRun("If you request that your account be deleted, all associated splits, contacts, and account data are permanently removed from our servers. Contact us at "), ph(DEVELOPER_EMAIL), new TextRun(" to request deletion.")]),

        // 5. Data Sharing
        h2("5. Data Sharing"),
        p("We do not sell, trade, or rent your personal information to anyone."),
        p("The only data sharing that occurs is what's necessary to operate the app:"),
        bullet("We share receipt images with OpenAI solely for the purpose of text extraction"),
        bullet("We use Supabase as our securely hosted cloud infrastructure to store account and split data"),
        p("We may be required to disclose information if compelled by law — for example, in response to a valid court order or subpoena. We will notify you of such requests to the extent permitted by law."),
        p("We work with no advertising networks and no data brokers."),

        // 6. Children's Privacy
        h2("6. Children's Privacy"),
        p("Divi is not directed at children under the age of 13, and we do not knowingly collect personal information from children under 13."),
        p("If we learn that we have inadvertently collected information from a child under 13, we will delete that information promptly."),
        p(["If you believe a child under 13 has provided us with personal data, please contact us at ", ph(DEVELOPER_EMAIL), new TextRun(" and we will take immediate steps to remove it.")]),
        p("Divi complies with the Children's Online Privacy Protection Act (COPPA)."),

        // 7. Your Rights
        h2("7. Your Rights"),

        h3("US Users — California (CCPA)"),
        p("If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):"),
        bullet([bold("Right to know — "), new TextRun("request a copy of the personal information we have collected about you")]),
        bullet([bold("Right to delete — "), new TextRun("request that we delete your personal information")]),
        bullet([bold("Right to opt-out of sale — "), new TextRun("we do not sell your personal information, so this right is already satisfied")]),
        bullet([bold("Right to non-discrimination — "), new TextRun("we will not discriminate against you for exercising any of these rights")]),
        p(["To exercise any of these rights, contact us at ", ph(DEVELOPER_EMAIL), new TextRun(".")]),

        h3("EU & International Users — GDPR"),
        p("If you are located in the European Union or European Economic Area, you have the following rights under the General Data Protection Regulation (GDPR):"),
        bullet([bold("Right of access — "), new TextRun("request a copy of your personal data")]),
        bullet([bold("Right to rectification — "), new TextRun("request correction of inaccurate data")]),
        bullet([bold("Right to erasure — "), new TextRun("request deletion of your personal data")]),
        bullet([bold("Right to restriction — "), new TextRun("request that we limit how we process your data")]),
        bullet([bold("Right to data portability — "), new TextRun("receive your data in a portable format")]),
        bullet([bold("Right to object — "), new TextRun("object to processing based on legitimate interest")]),
        p([bold("Legal basis for processing: "), new TextRun("We process your data on the basis of legitimate interest — specifically, to provide the bill-splitting service you requested when you opened the app.")]),
        p(["To exercise any of these rights, contact us at ", ph(DEVELOPER_EMAIL), new TextRun(".")]),

        // 8. Security
        h2("8. Security"),
        p("We take the security of your data seriously. Here is what we do:"),
        bullet("All data transmitted between Divi and OpenAI's API uses HTTPS/TLS encryption"),
        bullet("Receipt images are sent over encrypted connections only"),
        bullet("Your account and split data is stored in Supabase, secured with industry-standard practices"),
        bullet("Divi does not collect, transmit, or store any payment information — ever"),
        p("Despite our best efforts, no method of transmitting data over the internet is 100% secure. We cannot guarantee absolute security, but we are committed to protecting your data using reasonable and industry-standard measures."),

        // 9. Changes to This Policy
        h2("9. Changes to This Policy"),
        p("We may update this privacy policy as Divi evolves — for example, when we add new features or integrate new services."),
        p("If we make material changes, we will notify you through an in-app notice or by updating the \"Last Updated\" date at the top of this document. We encourage you to review this policy from time to time."),
        p("Continuing to use Divi after changes to this policy constitutes your acceptance of the updated terms."),

        // 10. Contact Us
        h2("10. Contact Us"),
        p("Have a question about this policy or want to exercise your privacy rights? We're happy to help."),
        new Paragraph({
          children: [ph(DEVELOPER_NAME)],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun("Email: "), ph(DEVELOPER_EMAIL)],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun("Support: "), ph(SUPPORT_URL)],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun("Mailing address: "), ph(MAILING_ADDRESS)],
          spacing: { after: 160 },
        }),
        p("We aim to respond to all privacy-related inquiries within 5 business days."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  writeFileSync("docs/privacy_policy.docx", buffer);
  console.log("✓ docs/privacy_policy.docx created successfully");
});
