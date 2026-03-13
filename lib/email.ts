import { ServerClient } from "postmark";

const FROM_EMAIL = "hello@turbo360.com.au";

function getClient(): ServerClient | null {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    console.error("POSTMARK_API_TOKEN not set — email will not be sent");
    return null;
  }
  return new ServerClient(token);
}

interface SendSubmissionEmailParams {
  recipientEmails: { email: string; name: string }[];
  userName: string;
  userEmail: string;
  cohort: string;
  submittedAt: string;
  pdfBuffer: Buffer;
}

export async function sendSubmissionEmail({
  recipientEmails,
  userName,
  userEmail,
  cohort,
  submittedAt,
  pdfBuffer,
}: SendSubmissionEmailParams): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  if (recipientEmails.length === 0) {
    console.log("No notification recipients configured — skipping email");
    return false;
  }

  const submittedDate = new Date(submittedAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const toAddresses = recipientEmails.map((r) => r.email).join(",");

  try {
    await client.sendEmail({
      From: FROM_EMAIL,
      To: toAddresses,
      Subject: `BCE Case Study Submission – ${userName} (${cohort})`,
      HtmlBody: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #054166; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; font-size: 20px; margin: 0;">BCE Case Study Submission</h1>
            <p style="color: #4fc6e0; font-size: 13px; margin: 4px 0 0;">Professional Practices: Compliance Program</p>
          </div>
          <div style="background-color: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #4A5568; font-size: 15px; line-height: 1.6; margin-top: 0;">
              A participant has submitted their case study responses.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; color: #718096; font-size: 13px; width: 120px;">Participant</td>
                <td style="padding: 8px 0; color: #02273C; font-size: 14px; font-weight: 600;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #718096; font-size: 13px;">Email</td>
                <td style="padding: 8px 0; color: #02273C; font-size: 14px;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #718096; font-size: 13px;">Cohort</td>
                <td style="padding: 8px 0; color: #02273C; font-size: 14px;">${cohort}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #718096; font-size: 13px;">Submitted</td>
                <td style="padding: 8px 0; color: #02273C; font-size: 14px;">${submittedDate}</td>
              </tr>
            </table>
            <p style="color: #4A5568; font-size: 14px; line-height: 1.6;">
              The full responses are attached as a PDF document.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #A0AEC0; font-size: 11px; margin-bottom: 0;">
              This is an automated notification from the BCE Case Studies Portal.
            </p>
          </div>
        </div>
      `,
      TextBody: `BCE Case Study Submission\n\nParticipant: ${userName}\nEmail: ${userEmail}\nCohort: ${cohort}\nSubmitted: ${submittedDate}\n\nThe full responses are attached as a PDF document.`,
      Attachments: [
        {
          Name: `BCE-Responses-${userName.replace(/\s+/g, "-")}.pdf`,
          Content: pdfBuffer.toString("base64"),
          ContentType: "application/pdf",
          ContentID: "",
        },
      ],
    });

    console.log(`Submission email sent to ${toAddresses} for ${userName}`);
    return true;
  } catch (err) {
    console.error("Failed to send submission email:", err);
    return false;
  }
}
