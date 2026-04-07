import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  PageNumber,
} from "docx";
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

function labeledLine(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}

function bodyParagraphs(content: string): Paragraph[] {
  const paragraphs = content.trim().split(/\n\s*\n/);
  return paragraphs
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((para) => {
      const lines = para.split(/\n/);
      const runs: TextRun[] = [];
      lines.forEach((line, idx) => {
        if (idx > 0) runs.push(new TextRun({ break: 1 }));
        runs.push(new TextRun({ text: line }));
      });
      return new Paragraph({
        spacing: { after: 160 },
        children: runs,
      });
    });
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

  const responseMap = new Map(responses.map((r) => [r.case_study_id, r.content]));

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Professional Practices – Compliance Program" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: "Case Study Responses", italics: true })],
    })
  );

  // Participant info
  children.push(
    labeledLine("Participant", `${user.first_name} ${user.last_name}`),
    labeledLine("Email", user.email),
    labeledLine("Syndicate #", user.cohort),
    labeledLine("Submitted", submittedDate),
    new Paragraph({ spacing: { after: 200 }, children: [] })
  );

  // Modules + case studies
  for (const mod of modules) {
    const moduleCases = caseStudies
      .filter((c) => c.module_id === mod.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (moduleCases.length === 0) continue;

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 120 },
        children: [new TextRun({ text: mod.title })],
      })
    );

    if (mod.description) {
      children.push(
        new Paragraph({
          spacing: { after: 240 },
          children: [new TextRun({ text: mod.description, italics: true })],
        })
      );
    }

    for (const cs of moduleCases) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 320, after: 120 },
          children: [new TextRun({ text: cs.title })],
        })
      );

      const scenarioText = stripHtml(cs.scenario);
      if (scenarioText && !scenarioText.toLowerCase().includes("refer to the scenario")) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: "Scenario", bold: true })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: scenarioText })],
          })
        );
      }

      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "Question", bold: true })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: stripHtml(cs.questions) })],
        })
      );

      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "Response", bold: true })],
        })
      );

      const responseContent = responseMap.get(cs.id);
      if (responseContent && responseContent.trim()) {
        children.push(...bodyParagraphs(responseContent));
      } else {
        children.push(
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: "No response provided.", italics: true })],
          })
        );
      }
    }
  }

  const doc = new Document({
    creator: "BCE Professional Practices Portal",
    title: `BCE Case Study Responses — ${user.first_name} ${user.last_name}`,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page " }),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun({ text: " of " }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
