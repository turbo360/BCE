import { ServerClient } from "postmark";
import fs from "fs";
import path from "path";

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

  const submittedDate = new Date(submittedAt + "Z").toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Brisbane",
  });

  const toAddresses = recipientEmails.map((r) => r.email).join(",");

  // Read BCE logo for inline embedding
  let logoBase64 = "";
  try {
    const logoPath = path.join(process.cwd(), "public", "bce-logo.png");
    logoBase64 = fs.readFileSync(logoPath).toString("base64");
  } catch {
    console.warn("Could not read BCE logo for email");
  }

  try {
    await client.sendEmail({
      From: FROM_EMAIL,
      To: toAddresses,
      Subject: `BCE Case Study Submission – ${userName} (${cohort})`,
      HtmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f7f5f2;">
    <tr>
      <td style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto;">

          <!-- Logo -->
          <tr>
            <td style="padding: 24px 0; text-align: center;">
              ${logoBase64 ? `<img src="cid:bce-logo" alt="Brisbane Catholic Education" style="width: 180px; max-width: 50%; height: auto;" />` : ""}
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background-color: #054166; padding: 28px 32px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; font-size: 20px; margin: 0; line-height: 1.3;">Case Study Submission</h1>
              <p style="color: #4fc6e0; font-size: 13px; margin: 6px 0 0; line-height: 1.4;">Professional Practices: Compliance Program</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              <p style="color: #4A5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                A participant has submitted their case study responses.
              </p>

              <!-- Info card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; color: #718096; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Participant</td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 14px 0; color: #02273C; font-size: 16px; font-weight: 600;">${userName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #718096; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Email</td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 14px 0; color: #02273C; font-size: 14px;">${userEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #718096; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Cohort</td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 14px 0; color: #02273C; font-size: 14px;">${cohort}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #718096; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Submitted</td>
                      </tr>
                      <tr>
                        <td style="padding: 0; color: #02273C; font-size: 14px;">${submittedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #4A5568; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                The full responses are attached as a PDF document.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #02273C; padding: 20px 32px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #a0aec0; font-size: 11px; margin: 0 0 6px 0;">
                This is an automated notification from the BCE Case Studies Portal.
              </p>
              <p style="color: #718096; font-size: 10px; margin: 0;">
                Powered by <a href="https://turbo.net.au" style="color: #4fc6e0; text-decoration: none;">Turbo 360</a> &ndash; turbo.net.au
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      TextBody: `BCE Case Study Submission\n\nParticipant: ${userName}\nEmail: ${userEmail}\nCohort: ${cohort}\nSubmitted: ${submittedDate}\n\nThe full responses are attached as a PDF document.\n\nPowered by Turbo 360 - turbo.net.au`,
      Attachments: [
        {
          Name: `BCE-Responses-${userName.replace(/\s+/g, "-")}.pdf`,
          Content: pdfBuffer.toString("base64"),
          ContentType: "application/pdf",
          ContentID: "",
        },
        ...(logoBase64
          ? [
              {
                Name: "bce-logo.png",
                Content: logoBase64,
                ContentType: "image/png",
                ContentID: "cid:bce-logo",
              },
            ]
          : []),
      ],
    });

    console.log(`Submission email sent to ${toAddresses} for ${userName}`);
    return true;
  } catch (err) {
    console.error("Failed to send submission email:", err);
    return false;
  }
}
