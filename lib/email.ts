import nodemailer from "nodemailer";
import type { SendMailOptions, Transporter } from "nodemailer";
import { env } from "@/lib/env";

type WeeklyStats = {
  projects: number;
  content: number;
  scheduled: number;
};

type ScheduledPostNotificationInput = {
  userEmail: string;
  platform: string;
  postBody: string;
  scheduledAt: Date;
  projectTitle: string;
};

type SendEmailInput = {
  html: string;
  optional?: boolean;
  subject: string;
  text?: string;
  to: string;
};

type SmtpConfig = {
  from: string;
  host: string;
  pass: string;
  port: number;
  secure: boolean;
  user: string;
};

let smtpTransporter: Transporter | null = null;

export function assertEmailConfigured() {
  if (!resolveSmtpConfig()) {
    throw new Error(
      "Configure free SMTP email with SMTP_HOST/SMTP_USER/SMTP_PASS or Gmail EMAIL_USER/EMAIL_APP_PASSWORD.",
    );
  }
}

export async function verifyEmailTransport() {
  const transporter = getSmtpTransporter();
  await transporter.verify();
  return { ok: true };
}

export async function sendTestEmail(to: string) {
  await sendEmail({
    to,
    subject: "Recastr email test",
    text: "Your Recastr SMTP email setup is working.",
    html: baseEmailTemplate({
      heading: "SMTP email is working",
      intro: "Your Recastr scheduled reminder emails can now be delivered through your free SMTP provider.",
      body: "<p style=\"margin:0;color:#334155;line-height:1.6\">This is a test message from Recastr.</p>",
      ctaHref: `${env.appUrl}/tasks?tab=scheduled`,
      ctaLabel: "Open scheduled posts",
    }),
  });
}

export async function sendContentReadyEmail(userEmail: string, projectTitle: string) {
  await sendEmail({
    to: userEmail,
    subject: `Your content for "${projectTitle}" is ready`,
    html: baseEmailTemplate({
      heading: "Your content is ready",
      intro: `Your AI content generation for "${escapeHtml(projectTitle)}" has finished.`,
      body: "<p style=\"margin:0;color:#334155;line-height:1.6\">Open Recastr to review, copy, and schedule your generated content.</p>",
      ctaHref: `${env.appUrl}/dashboard`,
      ctaLabel: "View your dashboard",
    }),
  });
}

export async function sendWeeklyDigestEmail(userEmail: string, stats: WeeklyStats) {
  await sendEmail({
    to: userEmail,
    subject: "Your Recastr weekly digest",
    html: baseEmailTemplate({
      heading: "Your weekly Recastr digest",
      intro: "A quick snapshot of your content workflow this week.",
      body: `
        <ul style="margin:0;padding-left:20px;color:#334155;line-height:1.7">
          <li>${stats.projects} projects</li>
          <li>${stats.content} content pieces</li>
          <li>${stats.scheduled} scheduled posts</li>
        </ul>
      `,
      ctaHref: `${env.appUrl}/dashboard`,
      ctaLabel: "Go to dashboard",
    }),
    optional: true,
  });
}

export async function sendScheduleReminderEmail(
  userEmail: string,
  platform: string,
  scheduledAt: Date,
) {
  const scheduledLabel = formatScheduledDate(scheduledAt);
  await sendEmail({
    to: userEmail,
    subject: `Reminder: post to ${platform}`,
    html: baseEmailTemplate({
      heading: `Reminder for ${escapeHtml(platform)}`,
      intro: `Your post is scheduled for ${escapeHtml(scheduledLabel)}.`,
      body: "<p style=\"margin:0;color:#334155;line-height:1.6\">Open Recastr to review your scheduled content.</p>",
      ctaHref: `${env.appUrl}/tasks?tab=scheduled`,
      ctaLabel: "View scheduled posts",
    }),
    optional: true,
  });
}

export async function sendScheduledPostNotificationEmail({
  userEmail,
  platform,
  postBody,
  scheduledAt,
  projectTitle,
}: ScheduledPostNotificationInput) {
  const scheduledLabel = formatScheduledDate(scheduledAt);
  const escapedBody = escapeHtml(postBody);
  const escapedPlatform = escapeHtml(platform);

  await sendEmail({
    to: userEmail,
    subject: `Time to post: ${platform}`,
    text: `Time to post on ${platform}\n\nProject: ${projectTitle}\nScheduled: ${scheduledLabel}\n\n${postBody}\n\nOpen Recastr: ${env.appUrl}/tasks?tab=scheduled`,
    html: baseEmailTemplate({
      heading: `Time to post on ${escapedPlatform}`,
      intro: `Project: ${escapeHtml(projectTitle)}<br />Scheduled for ${escapeHtml(scheduledLabel)}`,
      body: `
        <div style="background:#f8fafc;border-left:4px solid #7C3AED;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap;color:#0f172a">${escapedBody}</p>
        </div>
        <p style="color:#334155;margin:0 0 16px;line-height:1.6">
          Copy this content and post it manually to <strong>${escapedPlatform}</strong>.
        </p>
      `,
      ctaHref: `${env.appUrl}/tasks?tab=scheduled`,
      ctaLabel: "View scheduled posts",
      secondaryCtaHref: `mailto:?subject=${encodeURIComponent(`Scheduled ${platform} post`)}&body=${encodeURIComponent(postBody)}`,
      secondaryCtaLabel: "Open content in email draft",
    }),
  });
}

export async function sendPublishedEmail(userEmail: string, platform: string) {
  await sendEmail({
    to: userEmail,
    subject: `${platform} reminder was sent`,
    html: baseEmailTemplate({
      heading: "Reminder email sent",
      intro: `Your scheduled reminder for ${escapeHtml(platform)} was delivered.`,
      body: "<p style=\"margin:0;color:#334155;line-height:1.6\">Open Recastr to see your notification history.</p>",
      ctaHref: `${env.appUrl}/tasks?tab=history`,
      ctaLabel: "View history",
    }),
    optional: true,
  });
}

export async function sendEmail({
  html,
  optional = false,
  subject,
  text,
  to,
}: SendEmailInput) {
  try {
    const transporter = getSmtpTransporter();
    const config = resolveSmtpConfig();
    if (!config) throw new Error("SMTP email is not configured.");

    const message: SendMailOptions = {
      from: config.from,
      html,
      subject,
      text,
      to,
    };

    return await transporter.sendMail(message);
  } catch (error) {
    if (optional) return null;
    throw error;
  }
}

function getSmtpTransporter() {
  assertEmailConfigured();
  const config = resolveSmtpConfig();
  if (!config) throw new Error("SMTP email is not configured.");

  smtpTransporter ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return smtpTransporter;
}

function resolveSmtpConfig(): SmtpConfig | null {
  const gmailUser = env.EMAIL_USER;
  const gmailPassword = env.EMAIL_APP_PASSWORD;
  const smtpUser = env.SMTP_USER ?? gmailUser;
  const smtpPass = env.SMTP_PASS ?? gmailPassword;
  const smtpHost = env.SMTP_HOST ?? (gmailUser && gmailPassword ? "smtp.gmail.com" : undefined);

  if (!smtpHost || !smtpUser || !smtpPass) return null;

  const port = Number(env.SMTP_PORT ?? 587);
  return {
    from: env.SMTP_FROM_EMAIL ?? env.EMAIL_FROM ?? `Recastr <${smtpUser}>`,
    host: smtpHost,
    pass: smtpPass,
    port,
    secure: env.SMTP_SECURE === "true" || port === 465,
    user: smtpUser,
  };
}

function formatScheduledDate(value: Date) {
  return value.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function baseEmailTemplate({
  body,
  ctaHref,
  ctaLabel,
  heading,
  intro,
  secondaryCtaHref,
  secondaryCtaLabel,
}: {
  body: string;
  ctaHref: string;
  ctaLabel: string;
  heading: string;
  intro: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
}) {
  return `
    <div style="margin:0;background:#f8fafc;padding:28px 12px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden">
        <div style="padding:24px 24px 18px;background:#0f172a;color:#f8fafc">
          <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#c4b5fd;font-weight:700">Recastr</div>
          <h1 style="margin:12px 0 0;font-size:24px;line-height:1.2">${heading}</h1>
          <p style="margin:10px 0 0;color:#cbd5e1;line-height:1.6">${intro}</p>
        </div>
        <div style="padding:24px">
          ${body}
          <div style="margin-top:24px">
            <a href="${ctaHref}" style="display:inline-block;background:#7C3AED;color:#ffffff;text-decoration:none;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:700">${ctaLabel}</a>
            ${
              secondaryCtaHref && secondaryCtaLabel
                ? `<a href="${secondaryCtaHref}" style="display:inline-block;margin-left:10px;color:#7C3AED;text-decoration:none;font-size:14px;font-weight:700">${secondaryCtaLabel}</a>`
                : ""
            }
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5">
          You received this because you scheduled a reminder in Recastr.
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}
