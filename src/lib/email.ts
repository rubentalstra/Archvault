import type { ReactElement } from "react";
import { render } from "@react-email/components";
import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const html = await render(react);

  if (!process.env.SMTP_HOST) {
    console.log("──── DEV EMAIL ────");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(html);
    console.log("───────────────────");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "noreply@archvault.dev",
    to,
    subject,
    html,
  });
}
