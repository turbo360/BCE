import PDFDocument from "pdfkit";
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

// Strip HTML tags for plain text PDF output
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "  • ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\u2013/g, "–")
    .replace(/\u2019/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function generateSubmissionPdf(
  user: UserData,
  modules: Module[],
  caseStudies: CaseStudy[],
  responses: ResponseData[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const BCE_NAVY = "#054166";
    const BCE_NAVY_DARK = "#02273C";
    const BCE_LIGHT_BLUE = "#4fc6e0";
    const GREY = "#4A5568";

    // --- Cover Page ---
    doc.moveDown(6);
    doc.rect(50, doc.y, pageWidth, 4).fill(BCE_NAVY);
    doc.moveDown(1.5);

    doc.fontSize(28).fillColor(BCE_NAVY_DARK).text("BCE Professional Practices", { align: "center" });
    doc.fontSize(22).fillColor(BCE_NAVY).text("Compliance Program", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor(BCE_LIGHT_BLUE).text("Case Study Responses", { align: "center" });
    doc.moveDown(2);

    doc.rect(50, doc.y, pageWidth, 1).fill("#E2E8F0");
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor(GREY);
    doc.text(`Participant: ${user.first_name} ${user.last_name}`, { align: "center" });
    doc.text(`Email: ${user.email}`, { align: "center" });
    doc.text(`Cohort: ${user.cohort}`, { align: "center" });
    doc.moveDown(0.5);
    const submittedDate = new Date(user.submitted_at).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Submitted: ${submittedDate}`, { align: "center" });

    doc.moveDown(4);
    doc.rect(50, doc.y, pageWidth, 4).fill(BCE_NAVY);

    // --- Response Pages ---
    const responseMap = new Map(responses.map((r) => [r.case_study_id, r.content]));

    for (const mod of modules) {
      const moduleCases = caseStudies
        .filter((c) => c.module_id === mod.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      if (moduleCases.length === 0) continue;

      doc.addPage();

      // Module header
      doc.rect(50, 50, pageWidth, 36).fill(BCE_NAVY_DARK);
      doc.fontSize(14).fillColor("#FFFFFF").text(mod.title, 60, 60, { width: pageWidth - 20 });
      doc.moveDown(1.5);

      // Module description
      doc.fontSize(9).fillColor(GREY).text(mod.description, { width: pageWidth });
      doc.moveDown(1);
      doc.rect(50, doc.y, pageWidth, 1).fill("#E2E8F0");
      doc.moveDown(1);

      for (const cs of moduleCases) {
        // Check if we need a new page (at least 120pt space)
        if (doc.y > doc.page.height - 180) {
          doc.addPage();
        }

        // Case study title bar
        doc.rect(50, doc.y, pageWidth, 26).fill(BCE_NAVY);
        doc.fontSize(10).fillColor("#FFFFFF").text(cs.title, 58, doc.y + 7, { width: pageWidth - 16 });
        doc.moveDown(1.2);

        // Scenario
        const scenarioText = stripHtml(cs.scenario);
        if (!scenarioText.toLowerCase().includes("refer to the scenario")) {
          doc.fontSize(8).fillColor(BCE_LIGHT_BLUE).text("SCENARIO", { underline: false });
          doc.moveDown(0.3);
          doc.fontSize(9).fillColor(GREY).text(scenarioText, { width: pageWidth });
          doc.moveDown(0.8);
        }

        // Question
        doc.fontSize(8).fillColor(BCE_LIGHT_BLUE).text("QUESTION");
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor(BCE_NAVY_DARK).text(stripHtml(cs.questions), { width: pageWidth });
        doc.moveDown(0.8);

        // Response
        doc.fontSize(8).fillColor(BCE_LIGHT_BLUE).text("RESPONSE");
        doc.moveDown(0.3);
        const responseContent = responseMap.get(cs.id);
        if (responseContent && responseContent.trim()) {
          doc.fontSize(9).fillColor("#1A202C").text(responseContent.trim(), { width: pageWidth });
        } else {
          doc.fontSize(9).fillColor("#A0AEC0").text("No response provided.", { width: pageWidth });
        }

        doc.moveDown(1);
        doc.rect(50, doc.y, pageWidth, 0.5).fill("#E2E8F0");
        doc.moveDown(1);
      }
    }

    // Footer on all pages
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor("#A0AEC0");
      doc.text(
        `BCE Professional Practices – ${user.first_name} ${user.last_name} – Page ${i + 1} of ${pages.count}`,
        50,
        doc.page.height - 48,
        { width: pageWidth, align: "center" }
      );
      doc.text(
        "Portal developed by Turbo 360 – turbo.net.au",
        50,
        doc.page.height - 36,
        { width: pageWidth, align: "center" }
      );
    }

    doc.end();
  });
}
