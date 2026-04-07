import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  TabStopType,
} from "docx";
import path from "path";
import fs from "fs";
import type { Module, CaseStudy } from "./types";

interface ResponseData {
  case_study_id: number;
  content: string;
}

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  cohort: string;
  submitted_at: string;
}

// BCE brand colors (hex without #)
const BCE_NAVY = "054166";
const BCE_NAVY_DARK = "02273C";
const BCE_LIGHT_BLUE = "4FC6E0";
const GREY = "4A5568";
const MUTED = "A0AEC0";
const LIGHT_GREY = "E2E8F0";
const BODY_COLOR = "1A202C";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "  \u2022 ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "\u00B7")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Build a label/value row for the info table on the cover page
function infoRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: "F8FAFC", color: "auto" },
        margins: { top: 120, bottom: 120, left: 180, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY },
          left: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY },
          right: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label.toUpperCase(),
                color: MUTED,
                size: 16, // half-points; 16 = 8pt
                bold: true,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: "F8FAFC", color: "auto" },
        margins: { top: 120, bottom: 120, left: 120, right: 180 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY },
          left: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY },
          right: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value,
                color: GREY,
                size: 22, // 11pt
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function responseParagraphs(content: string): Paragraph[] {
  const paragraphs = content.trim().split(/\n\s*\n/);
  return paragraphs
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map(
      (para) =>
        new Paragraph({
          spacing: { after: 160, line: 300 },
          children: [
            new TextRun({
              text: para,
              color: BODY_COLOR,
              size: 22, // 11pt
            }),
          ],
        })
    );
}

export async function generateSubmissionDocx(
  user: UserData,
  modules: Module[],
  caseStudies: CaseStudy[],
  responses: ResponseData[]
): Promise<Buffer> {
  const submittedDate = new Date(user.submitted_at + "Z").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Brisbane",
  });

  // Load logo for cover page
  let logoChildren: (Paragraph | Table)[] = [];
  try {
    const logoPath = path.join(process.cwd(), "public", "bce-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoChildren = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 400 },
          children: [
            new ImageRun({
              type: "png",
              data: logoBuffer,
              transformation: { width: 200, height: 60 },
            }),
          ],
        }),
      ];
    }
  } catch {
    // No logo — skip
  }

  // --- COVER PAGE CONTENT ---
  const coverChildren: (Paragraph | Table)[] = [
    ...logoChildren,
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      children: [
        new TextRun({
          text: "Professional Practices",
          color: BCE_NAVY_DARK,
          size: 60, // 30pt
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Compliance Program",
          color: BCE_NAVY,
          size: 48, // 24pt
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [
        new TextRun({
          text: "Case Study Responses",
          color: BCE_LIGHT_BLUE,
          size: 30, // 15pt
          italics: true,
        }),
      ],
    }),
    // Participant info table
    new Table({
      width: { size: 80, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: [
        infoRow("Participant", `${user.first_name} ${user.last_name}`),
        infoRow("Email", user.email),
        infoRow("Syndicate #", user.cohort),
        infoRow("Submitted", submittedDate),
      ],
    }),
    // Page break to start responses on a fresh page
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];

  // --- RESPONSE SECTIONS ---
  const responseMap = new Map(responses.map((r) => [r.case_study_id, r.content]));
  const bodyChildren: (Paragraph | Table)[] = [];

  modules.forEach((mod, modIdx) => {
    const moduleCases = caseStudies
      .filter((c) => c.module_id === mod.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (moduleCases.length === 0) return;

    // Page break before each module (except the first, which follows the cover page break)
    if (modIdx > 0) {
      bodyChildren.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    // Module header — navy band via shaded paragraph
    bodyChildren.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        shading: { type: ShadingType.CLEAR, fill: BCE_NAVY_DARK, color: "auto" },
        indent: { left: 200, right: 200 },
        children: [
          new TextRun({
            text: mod.title,
            color: "FFFFFF",
            size: 30, // 15pt
            bold: true,
          }),
        ],
      })
    );

    // Module description
    if (mod.description) {
      bodyChildren.push(
        new Paragraph({
          spacing: { after: 200 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY, space: 8 },
          },
          children: [
            new TextRun({
              text: mod.description,
              color: GREY,
              size: 20, // 10pt
            }),
          ],
        })
      );
    }

    // Case studies
    for (const cs of moduleCases) {
      // Case study title — navy band
      bodyChildren.push(
        new Paragraph({
          spacing: { before: 300, after: 160 },
          shading: { type: ShadingType.CLEAR, fill: BCE_NAVY, color: "auto" },
          indent: { left: 160, right: 160 },
          children: [
            new TextRun({
              text: cs.title,
              color: "FFFFFF",
              size: 22, // 11pt
              bold: true,
            }),
          ],
        })
      );

      // Scenario (unless it's the generic "refer to the scenario" text)
      const scenarioText = stripHtml(cs.scenario);
      if (scenarioText && !scenarioText.toLowerCase().includes("refer to the scenario")) {
        bodyChildren.push(
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: "SCENARIO",
                color: BCE_LIGHT_BLUE,
                size: 16, // 8pt
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200, line: 300 },
            children: [
              new TextRun({
                text: scenarioText,
                color: GREY,
                size: 20,
              }),
            ],
          })
        );
      }

      // Question
      bodyChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text: "QUESTION",
              color: BCE_LIGHT_BLUE,
              size: 16,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200, line: 300 },
          children: [
            new TextRun({
              text: stripHtml(cs.questions),
              color: BCE_NAVY_DARK,
              size: 20,
              bold: true,
            }),
          ],
        })
      );

      // Response
      bodyChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text: "RESPONSE",
              color: BCE_LIGHT_BLUE,
              size: 16,
              bold: true,
            }),
          ],
        })
      );

      const responseContent = responseMap.get(cs.id);
      if (responseContent && responseContent.trim()) {
        bodyChildren.push(...responseParagraphs(responseContent));
      } else {
        bodyChildren.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "No response provided.",
                color: MUTED,
                size: 20,
                italics: true,
              }),
            ],
          })
        );
      }

      // Divider after each case study
      bodyChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 200 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY, space: 1 },
          },
          children: [],
        })
      );
    }
  });

  // --- DOCUMENT ---
  const doc = new Document({
    creator: "BCE Professional Practices Portal",
    title: `BCE Case Study Responses — ${user.first_name} ${user.last_name}`,
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1100, right: 1100, bottom: 1400, left: 1100 },
          },
        },
        headers: {
          default: new Header({ children: [] }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_GREY, space: 4 },
                },
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: `BCE Professional Practices \u2013 ${user.first_name} ${user.last_name}`,
                    color: MUTED,
                    size: 16, // 8pt
                  }),
                  new TextRun({
                    text: "\t",
                  }),
                  new TextRun({
                    text: "Page ",
                    color: MUTED,
                    size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    color: MUTED,
                    size: 16,
                  }),
                  new TextRun({
                    text: " of ",
                    color: MUTED,
                    size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    color: MUTED,
                    size: 16,
                  }),
                ],
                tabStops: [
                  { type: TabStopType.RIGHT, position: 9000 },
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: "Portal developed by Turbo 360 \u2013 turbo.net.au",
                    color: "C4C4C4",
                    size: 14, // 7pt
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...coverChildren, ...bodyChildren],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
