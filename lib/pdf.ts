import PDFDocument from "pdfkit";
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
    .replace(/\u2013/g, "\u2013")
    .replace(/\u2019/g, "\u2019")
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
      margins: { top: 60, bottom: 70, left: 55, right: 55 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const LEFT = 55;
    const pageWidth = doc.page.width - LEFT * 2;
    const BCE_NAVY = "#054166";
    const BCE_NAVY_DARK = "#02273C";
    const BCE_LIGHT_BLUE = "#4fc6e0";
    const BCE_GOLD = "#FFCB05";
    const GREY = "#4A5568";
    const LIGHT_GREY = "#E2E8F0";
    const MUTED = "#A0AEC0";

    // --- COVER PAGE ---

    // Top accent bar
    doc.rect(0, 0, doc.page.width, 6).fill(BCE_NAVY);

    // BCE Logo
    const logoPath = path.join(process.cwd(), "public", "bce-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoWidth = 200;
      const logoX = (doc.page.width - logoWidth) / 2;
      doc.image(logoPath, logoX, 80, { width: logoWidth });
    }

    // Gold divider line
    const dividerY = 200;
    const dividerWidth = 80;
    doc.rect((doc.page.width - dividerWidth) / 2, dividerY, dividerWidth, 3).fill(BCE_GOLD);

    // Title block
    doc.fontSize(30).fillColor(BCE_NAVY_DARK).text("Professional Practices", LEFT, 230, { align: "center", width: pageWidth });
    doc.fontSize(24).fillColor(BCE_NAVY).text("Compliance Program", { align: "center", width: pageWidth });
    doc.moveDown(0.6);
    doc.fontSize(15).fillColor(BCE_LIGHT_BLUE).text("Case Study Responses", { align: "center", width: pageWidth });

    // Participant info card
    const cardY = 370;
    const cardHeight = 140;
    const cardPadding = 24;

    // Card background
    doc.roundedRect(LEFT + 60, cardY, pageWidth - 120, cardHeight, 8).fill("#F8FAFC");
    doc.roundedRect(LEFT + 60, cardY, pageWidth - 120, cardHeight, 8).strokeColor(LIGHT_GREY).lineWidth(1).stroke();

    // Card accent top line
    doc.rect(LEFT + 60, cardY, pageWidth - 120, 3).fill(BCE_NAVY);

    const submittedDate = new Date(user.submitted_at).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const infoX = LEFT + 60 + cardPadding;
    const infoWidth = pageWidth - 120 - cardPadding * 2;
    let infoY = cardY + 20;

    doc.fontSize(8).fillColor(MUTED).text("PARTICIPANT", infoX, infoY, { width: infoWidth });
    infoY += 13;
    doc.fontSize(13).fillColor(BCE_NAVY_DARK).text(`${user.first_name} ${user.last_name}`, infoX, infoY, { width: infoWidth });
    infoY += 22;

    doc.fontSize(8).fillColor(MUTED).text("EMAIL", infoX, infoY, { width: infoWidth / 2 });
    doc.fontSize(8).fillColor(MUTED).text("COHORT", infoX + infoWidth / 2, infoY, { width: infoWidth / 2 });
    infoY += 13;
    doc.fontSize(10).fillColor(GREY).text(user.email, infoX, infoY, { width: infoWidth / 2 });
    doc.fontSize(10).fillColor(GREY).text(user.cohort, infoX + infoWidth / 2, infoY, { width: infoWidth / 2 });
    infoY += 22;

    doc.fontSize(8).fillColor(MUTED).text("SUBMITTED", infoX, infoY, { width: infoWidth });
    infoY += 13;
    doc.fontSize(10).fillColor(GREY).text(submittedDate, infoX, infoY, { width: infoWidth });

    // Bottom accent bar on cover
    doc.rect(0, doc.page.height - 6, doc.page.width, 6).fill(BCE_NAVY);

    // --- RESPONSE PAGES ---
    const responseMap = new Map(responses.map((r) => [r.case_study_id, r.content]));

    for (const mod of modules) {
      const moduleCases = caseStudies
        .filter((c) => c.module_id === mod.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      if (moduleCases.length === 0) continue;

      doc.addPage();

      // Module header bar
      doc.rect(LEFT, 50, pageWidth, 40).fill(BCE_NAVY_DARK);
      doc.fontSize(15).fillColor("#FFFFFF").text(mod.title, LEFT + 14, 62, { width: pageWidth - 28 });

      doc.moveDown(2);

      // Module description
      doc.fontSize(9).fillColor(GREY).text(mod.description, LEFT, doc.y, { width: pageWidth, lineGap: 2 });
      doc.moveDown(0.8);
      doc.rect(LEFT, doc.y, pageWidth, 1).fill(LIGHT_GREY);
      doc.moveDown(1);

      for (const cs of moduleCases) {
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        }

        // Case study title bar
        const titleBarY = doc.y;
        doc.rect(LEFT, titleBarY, pageWidth, 28).fill(BCE_NAVY);
        // Small gold accent on left
        doc.rect(LEFT, titleBarY, 4, 28).fill(BCE_GOLD);
        doc.fontSize(10).fillColor("#FFFFFF").text(cs.title, LEFT + 14, titleBarY + 8, { width: pageWidth - 28 });
        doc.y = titleBarY + 28;
        doc.moveDown(0.8);

        // Scenario
        const scenarioText = stripHtml(cs.scenario);
        if (!scenarioText.toLowerCase().includes("refer to the scenario")) {
          doc.fontSize(7.5).fillColor(BCE_LIGHT_BLUE).text("SCENARIO", LEFT, doc.y);
          doc.moveDown(0.3);
          doc.fontSize(9).fillColor(GREY).text(scenarioText, LEFT, doc.y, { width: pageWidth, lineGap: 2 });
          doc.moveDown(0.8);
        }

        // Question
        doc.fontSize(7.5).fillColor(BCE_LIGHT_BLUE).text("QUESTION", LEFT, doc.y);
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor(BCE_NAVY_DARK).text(stripHtml(cs.questions), LEFT, doc.y, { width: pageWidth, lineGap: 2 });
        doc.moveDown(0.8);

        // Response with subtle background
        doc.fontSize(7.5).fillColor(BCE_LIGHT_BLUE).text("RESPONSE", LEFT, doc.y);
        doc.moveDown(0.3);

        const responseContent = responseMap.get(cs.id);
        const responseY = doc.y;

        if (responseContent && responseContent.trim()) {
          // Measure text height first
          doc.fontSize(9);
          const textHeight = doc.heightOfString(responseContent.trim(), { width: pageWidth - 20 });
          // Light response background
          doc.rect(LEFT, responseY - 4, pageWidth, textHeight + 16).fill("#F8FAFC");
          doc.fontSize(9).fillColor("#1A202C").text(responseContent.trim(), LEFT + 10, responseY + 4, { width: pageWidth - 20, lineGap: 2 });
        } else {
          doc.rect(LEFT, responseY - 4, pageWidth, 24).fill("#F8FAFC");
          doc.fontSize(9).fillColor(MUTED).text("No response provided.", LEFT + 10, responseY + 4, { width: pageWidth - 20 });
        }

        doc.moveDown(1.2);
        doc.rect(LEFT, doc.y, pageWidth, 0.5).fill(LIGHT_GREY);
        doc.moveDown(1.2);
      }
    }

    // --- FOOTER ON ALL PAGES ---
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Footer divider line
      doc.rect(LEFT, doc.page.height - 56, pageWidth, 0.5).fill(LIGHT_GREY);

      // Page info
      doc.fontSize(7).fillColor(MUTED);
      doc.text(
        `BCE Professional Practices \u2013 ${user.first_name} ${user.last_name}`,
        LEFT,
        doc.page.height - 44,
        { width: pageWidth / 2, align: "left" }
      );

      // Page number
      doc.text(
        `Page ${i + 1} of ${pages.count}`,
        LEFT + pageWidth / 2,
        doc.page.height - 44,
        { width: pageWidth / 2, align: "right" }
      );

      // Turbo 360 credit
      doc.fontSize(6.5).fillColor("#C4C4C4");
      doc.text(
        "Portal developed by Turbo 360 \u2013 turbo.net.au",
        LEFT,
        doc.page.height - 32,
        { width: pageWidth, align: "center" }
      );
    }

    doc.end();
  });
}
