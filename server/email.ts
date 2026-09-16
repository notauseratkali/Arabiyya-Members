import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

// In-memory runtime SMTP config that can be loaded from env or updated via Admin Settings
let runtimeSmtpConfig: SmtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || 'Secretary of Arabiyya Rover Council <no-reply@arabiyyarovers.net>'
};

// Secretary Identity for Personalization
let secretaryFullName = 'Ahmed Nazih Nafiz';

export function setSecretaryName(name: string) {
  if (name && name.trim()) {
    secretaryFullName = name.trim();
  }
}

export function getSecretaryName(): string {
  return secretaryFullName || 'Ahmed Nazih Nafiz';
}

export function renderSecretarySignatureHtml(fullName?: string): string {
  const name = (fullName || secretaryFullName || 'Ahmed Nazih Nafiz').trim();
  return `
    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Yours in Scouting,</p>
      <p style="margin: 0; font-size: 15px; font-weight: 800; color: #0F172A; line-height: 1.4; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${name},<br>
        <span style="font-weight: 700; color: #800000; font-size: 13px; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Secretary of Arabiyya Rover Council</span>
      </p>
    </div>
  `;
}

export function renderSecretarySignatureText(fullName?: string): string {
  const name = (fullName || secretaryFullName || 'Ahmed Nazih Nafiz').trim();
  return `Yours in Scouting,\n\n${name},\nSecretary of Arabiyya Rover Council`;
}

export function getSmtpConfig(): SmtpConfig {
  return {
    ...runtimeSmtpConfig,
    // Mask password when returning for client security
    pass: runtimeSmtpConfig.pass ? '••••••••••••' : ''
  };
}

export let emailDesignConfig = {
  groupLogo: ''
};

export function updateEmailDesignConfig(logo: string) {
  emailDesignConfig.groupLogo = logo;
}

export function updateSmtpConfig(newConfig: Partial<SmtpConfig>) {
  runtimeSmtpConfig = {
    ...runtimeSmtpConfig,
    ...newConfig,
    // If user didn't change the masked password, preserve the existing password
    pass: (newConfig.pass && newConfig.pass !== '••••••••••••') ? newConfig.pass : runtimeSmtpConfig.pass
  };
}

// Helper to resolve logo attachment and img src for all email clients
interface LogoResolution {
  src: string;
  attachment?: {
    filename: string;
    content: Buffer;
    cid: string;
    contentType?: string;
  };
}

function resolveLogoAsset(): LogoResolution {
  const customLogo = emailDesignConfig.groupLogo;

  // 1. If base64 data URL (e.g. data:image/png;base64,...)
  if (customLogo && customLogo.startsWith('data:image/')) {
    try {
      const match = customLogo.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType.split('/')[1]?.replace('+xml', '') || 'png';
        return {
          src: 'cid:grouplogo@arabiyyarovers',
          attachment: {
            filename: `group-logo.${ext}`,
            content: Buffer.from(base64Data, 'base64'),
            cid: 'grouplogo@arabiyyarovers',
            contentType: mimeType
          }
        };
      }
    } catch (e) {
      console.error('[Error parsing base64 logo for email]:', e);
    }
  }

  // 2. If external HTTP/HTTPS URL
  if (customLogo && (customLogo.startsWith('http://') || customLogo.startsWith('https://'))) {
    return {
      src: customLogo
    };
  }

  // 3. If local file or default file
  const localCandidates = [
    customLogo ? path.join(process.cwd(), 'public', customLogo.replace(/^\//, '')) : null,
    path.join(process.cwd(), 'public', 'logo.png'),
    path.join(process.cwd(), 'public', 'logo.svg'),
    path.join(process.cwd(), 'public', 'asg_rover_logo.jpg')
  ].filter(Boolean) as string[];

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      try {
        const ext = path.extname(candidate).toLowerCase().replace('.', '');
        const mimeType = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        const fileContent = fs.readFileSync(candidate);
        return {
          src: 'cid:grouplogo@arabiyyarovers',
          attachment: {
            filename: `group-logo.${ext}`,
            content: fileContent,
            cid: 'grouplogo@arabiyyarovers',
            contentType: mimeType
          }
        };
      } catch (e) {
        console.error(`[Error reading local logo file ${candidate} for email]:`, e);
      }
    }
  }

  // 4. Fallback to public URL
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';
  return {
    src: `${appUrl}/logo.png`
  };
}

// Helper to create a nodemailer transporter
export function createTransporter(customConfig?: Partial<SmtpConfig>) {
  const config = {
    ...runtimeSmtpConfig,
    ...customConfig
  };

  if (!config.host || !config.user) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Verify SMTP Connection
export async function verifySmtp(customConfig?: Partial<SmtpConfig>): Promise<{ success: boolean; message: string }> {
  try {
    const config = {
      ...runtimeSmtpConfig,
      ...customConfig
    };

    if (!config.host || !config.user || !config.pass) {
      return {
        success: false,
        message: 'SMTP credentials incomplete. Please provide Host, Port, Username, and Password.'
      };
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    return {
      success: true,
      message: `SMTP Connection verified successfully with ${config.host}:${config.port}`
    };
  } catch (error: any) {
    console.error('[SMTP Verification Error]', error);
    return {
      success: false,
      message: error.message || 'Failed to connect to SMTP server. Please check your host, port, and credentials.'
    };
  }
}

// Send Generic Email with Unified Logo Handling
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const transporter = createTransporter();

  const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  const secName = getSecretaryName();
  let configuredFrom = runtimeSmtpConfig.from || 'Secretary of Arabiyya Rover Council <no-reply@arabiyyarovers.net>';
  let from = configuredFrom;

  // Personalize from header to show Secretary of Arabiyya Rover Council
  if (configuredFrom.includes('<') && configuredFrom.includes('>')) {
    const emailMatch = configuredFrom.match(/<([^>]+)>/);
    if (emailMatch && emailMatch[1]) {
      from = `"${secName}, Secretary of Arabiyya Rover Council" <${emailMatch[1]}>`;
    }
  } else if (configuredFrom.includes('@') && !configuredFrom.includes('<')) {
    from = `"${secName}, Secretary of Arabiyya Rover Council" <${configuredFrom.trim()}>`;
  }

  // Resolve logo attachment
  const logoRes = resolveLogoAsset();
  const finalAttachments = options.attachments ? [...options.attachments] : [];
  if (logoRes.attachment && !finalAttachments.some(a => a.cid === logoRes.attachment?.cid)) {
    finalAttachments.push(logoRes.attachment);
  }

  if (!transporter) {
    console.log(`[SMTP Notice: No active SMTP configured. Simulating delivery to: ${recipients}]`);
    console.log(`[Subject: ${options.subject}]`);
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: finalAttachments.length > 0 ? finalAttachments : undefined
    });

    console.log(`[SMTP Success: Email dispatched to ${recipients}, Message ID: ${info.messageId}]`);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (err: any) {
    console.error(`[SMTP Error dispatching to ${recipients}]:`, err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Unified Branded HTML Email Wrapper
export interface EmailWrapperOptions {
  title: string;
  badgeText?: string;
  badgeBg?: string;
  badgeColor?: string;
  content: string;
}

export function wrapEmailHtml(options: EmailWrapperOptions | string, legacyTitle?: string): string {
  const opts: EmailWrapperOptions = typeof options === 'string'
    ? { content: options, title: legacyTitle || 'Arabiyya Members' }
    : options;

  const logoRes = resolveLogoAsset();
  const year = new Date().getFullYear();

  const badgeHtml = opts.badgeText
    ? `<div style="display: inline-block; background-color: ${opts.badgeBg || '#eff6ff'}; color: ${opts.badgeColor || '#1d4ed8'}; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(0,0,0,0.06);">${opts.badgeText}</div>`
    : '';

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${opts.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800&display=swap');
      * {
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      body {
        margin: 0;
        padding: 24px 12px;
        background-color: #f1f5f9;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        color: #1e293b;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .header {
        background-color: #0F172A;
        padding: 30px 24px 26px 24px;
        text-align: center;
        color: #ffffff;
        border-bottom: 3px solid #800000;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .logo-container {
        display: inline-block;
        padding: 6px;
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        margin-bottom: 14px;
      }
      .logo-img {
        height: 52px;
        max-height: 52px;
        max-width: 170px;
        width: auto;
        display: block;
        margin: 0 auto;
        object-fit: contain;
      }
      .header-title {
        margin: 0;
        font-size: 21px;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -0.02em;
        line-height: 1.2;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .header-subtitle {
        margin: 6px 0 0 0;
        font-size: 11px;
        font-weight: 700;
        color: #93c5fd;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .content {
        padding: 32px 28px;
        font-size: 14px;
        line-height: 1.65;
        color: #334155;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .content h2 {
        margin-top: 0;
        margin-bottom: 14px;
        font-size: 19px;
        font-weight: 800;
        color: #0F172A;
        letter-spacing: -0.01em;
        line-height: 1.3;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .content p {
        margin: 0 0 16px 0;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .data-table-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 18px;
        margin: 20px 0;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .data-table td {
        padding: 7px 0;
        vertical-align: top;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .data-label {
        color: #64748b;
        font-weight: 600;
        width: 140px;
      }
      .data-value {
        color: #0F172A;
        font-weight: 700;
      }
      .code-box {
        background-color: #f8fafc;
        border: 2px dashed #0F172A;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 22px 0;
      }
      .code-label {
        font-size: 11px;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 700;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .code-val {
        font-size: 32px;
        font-weight: 900;
        letter-spacing: 7px;
        color: #800000;
        font-family: 'Quicksand', monospace !important;
      }
      .code-sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 6px;
        font-weight: 600;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .btn {
        display: inline-block;
        background-color: #800000;
        color: #ffffff !important;
        text-decoration: none;
        padding: 13px 28px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: 0.02em;
        margin: 16px 0;
        text-align: center;
        box-shadow: 0 2px 4px rgba(128, 0, 0, 0.2);
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .callout {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        padding: 14px 16px;
        margin: 18px 0;
        font-size: 13px;
        color: #166534;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .callout-blue {
        background-color: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 12px;
        padding: 14px 16px;
        margin: 18px 0;
        font-size: 13px;
        color: #1e40af;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .footer {
        background-color: #f8fafc;
        padding: 22px 24px;
        text-align: center;
        font-size: 11px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
        line-height: 1.6;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      .footer-org {
        font-weight: 700;
        color: #334155;
        font-size: 12px;
        margin-bottom: 4px;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <!-- Universal Branded Header -->
      <div class="header">
        <div class="logo-container">
          <img class="logo-img" src="${logoRes.src}" alt="Arabiyya Rover Network Logo" />
        </div>
        <h1 class="header-title">Arabiyya Members</h1>
        <p class="header-subtitle">Arabiyya Rover Network</p>
      </div>

      <!-- Main Body Content -->
      <div class="content">
        ${badgeHtml}
        ${opts.content}
      </div>

      <!-- Universal Branded Footer -->
      <div class="footer">
        <div class="footer-org">Arabiyya Rover Network</div>
        <p style="margin: 0 0 6px 0;">Arabiyya Members</p>
        <p style="margin: 0 0 6px 0;">© 2006 - ${year} Arabiyya Rover Network. All rights reserved.</p>
        <p style="margin: 0; color: #94a3b8; font-size: 10px;">This is an official communication dispatched on behalf of the Secretary of Arabiyya Rover Council.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// 1. Send OTP Email for Application Tracking / Password Recovery
export async function sendOtpEmail(to: string, otp: string, purpose: 'tracking' | 'password-reset'): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const isTracking = purpose === 'tracking';
  const secName = getSecretaryName();
  const subject = isTracking 
    ? `[Arabiyya Rovers] Your Application Tracking Verification Code: ${otp}`
    : `[Arabiyya Rovers Security] Your Password Reset Verification Code: ${otp}`;

  const html = wrapEmailHtml({
    title: isTracking ? 'Application Status Verification' : 'Password Reset Verification',
    badgeText: isTracking ? 'Official Verification' : 'Security Alert',
    badgeBg: isTracking ? '#eff6ff' : '#fef2f2',
    badgeColor: isTracking ? '#1d4ed8' : '#b91c1c',
    content: `
      <h2>${isTracking ? 'Membership Application Tracking' : 'Account Password Reset'}</h2>
      <p>Dear Member / Applicant,</p>
      <p>${isTracking 
        ? 'I received your request to verify your identity and track your membership application with the Arabiyya Rover Network.' 
        : 'I received a request to reset your password for your Arabiyya Members account.'}</p>
      
      <p>To safely verify that this request came from you, please use the 6-digit one-time verification code below:</p>

      <div class="code-box">
        <div class="code-label">Your 6-Digit Verification Code</div>
        <div class="code-val">${otp}</div>
        <div class="code-sub">Valid for 10 minutes</div>
      </div>

      <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
        ${isTracking 
          ? 'If you did not initiate this tracking request or have questions about your application, please reach out to me directly.' 
          : 'If you did not request this password reset, please contact me immediately so that we can safeguard your account.'}
      </p>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Arabiyya Members\nArabiyya Rover Council\n\nDear Member / Applicant,\n\n${isTracking ? 'I received your request to track your membership application status.' : 'I received a request to reset your account password.'}\n\nYour 6-digit verification code is: ${otp}\n(Valid for 10 minutes)\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to, subject, text, html });
}

// 2. Send Leader Application Alert to Council Leaders
export async function sendLeaderApplicationNotification(
  leaderApp: { fullName: string; idCardNumber: string; email: string; phoneNumber: string; currentAddress?: any },
  recipients: string[]
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  if (!recipients || recipients.length === 0) return { success: true, simulated: true };

  const secName = getSecretaryName();
  const subject = `[Council Alert] New Leader Candidate Registration: ${leaderApp.fullName} (${leaderApp.idCardNumber})`;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';

  const html = wrapEmailHtml({
    title: 'New Leader Candidate Alert',
    badgeText: 'Council Administration Alert',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    content: `
      <h2>New Leader Candidate Registration Received</h2>
      <p>Dear Council Leaders,</p>
      <p>I would like to notify you that a new candidate has officially submitted their credentials under our <strong>Leader Registration Track</strong>.</p>
      <p>I have logged their submission into the Administrative Requests Queue (30-day retention). Below are the candidate's registration details:</p>
      
      <div class="data-table-card">
        <table class="data-table">
          <tr>
            <td class="data-label">Candidate Name:</td>
            <td class="data-value">${leaderApp.fullName}</td>
          </tr>
          <tr>
            <td class="data-label">ID Card Number:</td>
            <td class="data-value">${leaderApp.idCardNumber}</td>
          </tr>
          <tr>
            <td class="data-label">Email Address:</td>
            <td class="data-value">${leaderApp.email}</td>
          </tr>
          <tr>
            <td class="data-label">Phone Number:</td>
            <td class="data-value">${leaderApp.phoneNumber}</td>
          </tr>
          ${leaderApp.currentAddress ? `
          <tr>
            <td class="data-label">Current Address:</td>
            <td class="data-value">${leaderApp.currentAddress}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p>Please log in to Council Admin Requests at your earliest convenience to review candidate background documents and schedule the leadership interview.</p>
      <div style="text-align: center;">
        <a href="${appUrl}/admin" class="btn">Open Admin Requests Queue</a>
      </div>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Dear Council Leaders,\n\nI would like to notify you that a new candidate has submitted their credentials under the Leader Registration Track:\n\nCandidate Name: ${leaderApp.fullName}\nID Card: ${leaderApp.idCardNumber}\nEmail: ${leaderApp.email}\nPhone: ${leaderApp.phoneNumber}\n\nPlease access Admin Requests to review the submission:\n${appUrl}/admin\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to: recipients, subject, text, html });
}

// 3. Send Member Registration Alert to Council Leaders
export async function sendMemberApplicationNotification(
  memberApp: { fullName: string; idCardNumber: string; email: string; phoneNumber: string; role: string; username: string },
  recipients: string[]
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  if (!recipients || recipients.length === 0) return { success: true, simulated: true };

  const secName = getSecretaryName();
  const subject = `[Council Alert] New Join Request: ${memberApp.fullName} (${memberApp.idCardNumber})`;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';

  const html = wrapEmailHtml({
    title: 'New Join Request Alert',
    badgeText: 'Pipeline Notification',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
    content: `
      <h2>New Join Request Received</h2>
      <p>Dear Council Leaders,</p>
      <p>I am pleased to inform you that a new applicant has registered via <strong>Member Sign Up</strong>.</p>
      <p>I have registered their application into our Join Requests Pipeline for council review. Below is a summary of the applicant's profile:</p>
      
      <div class="data-table-card">
        <table class="data-table">
          <tr>
            <td class="data-label">Candidate Name:</td>
            <td class="data-value">${memberApp.fullName}</td>
          </tr>
          <tr>
            <td class="data-label">ID Card Number:</td>
            <td class="data-value">${memberApp.idCardNumber}</td>
          </tr>
          <tr>
            <td class="data-label">Username:</td>
            <td class="data-value">${memberApp.username}</td>
          </tr>
          <tr>
            <td class="data-label">Section / Role:</td>
            <td class="data-value"><span style="display:inline-block; background:#f1f5f9; padding:2px 8px; border-radius:6px; font-weight:700;">${memberApp.role}</span></td>
          </tr>
          <tr>
            <td class="data-label">Email Address:</td>
            <td class="data-value">${memberApp.email}</td>
          </tr>
          <tr>
            <td class="data-label">Phone Number:</td>
            <td class="data-value">${memberApp.phoneNumber}</td>
          </tr>
        </table>
      </div>

      <p>Please log in to Council Admin Requests (Join Requests Pipeline) to review details, conduct interview assessment, and set the investiture schedule.</p>
      <div style="text-align: center;">
        <a href="${appUrl}/admin" class="btn">View Join Requests Pipeline</a>
      </div>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Dear Council Leaders,\n\nI am pleased to inform you that a new candidate has applied through Member Sign Up:\n\nCandidate Name: ${memberApp.fullName}\nID Card: ${memberApp.idCardNumber}\nRole / Section: ${memberApp.role}\nUsername: ${memberApp.username}\nEmail: ${memberApp.email}\nPhone: ${memberApp.phoneNumber}\n\nPlease access the Join Requests Pipeline to review this application:\n${appUrl}/admin\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to: recipients, subject, text, html });
}

// 4. Send Member Registration Confirmation to Applicant
export async function sendMemberWelcomeConfirmation(memberApp: {
  fullName: string;
  role: string;
  email: string;
  idCardNumber: string;
  username: string;
  commonName?: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const secName = getSecretaryName();
  const subject = `[Arabiyya Rovers] Membership Registration Received: ${memberApp.fullName}`;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';
  const trackUrl = `${appUrl}/track`;
  const displayName = memberApp.commonName || memberApp.fullName.split(' ')[0] || memberApp.fullName;
  
  const html = wrapEmailHtml({
    title: 'Registration Received',
    badgeText: 'Registration Status',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    content: `
      <h2>We have received your request to join Arabiyya Rover Network.</h2>
      <p>Dear <strong>${displayName}</strong>,</p>
      <p>On behalf of the Arabiyya Rover Council, I am pleased to personally confirm that I have received your request to join our crew.</p>
      <p>Your registration is currently being processed through our membership review pipeline. Here is a summary of your submitted details for your records:</p>
      
      <div class="data-table-card">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.06em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Your Application Summary</div>
        <table class="data-table">
          <tr>
            <td class="data-label">Section:</td>
            <td class="data-value">${memberApp.role}</td>
          </tr>
          <tr>
            <td class="data-label">ID Card:</td>
            <td class="data-value">${memberApp.idCardNumber}</td>
          </tr>
          <tr>
            <td class="data-label">Username:</td>
            <td class="data-value">${memberApp.username}</td>
          </tr>
          <tr>
            <td class="data-label">Status:</td>
            <td class="data-value">
              <span style="display: inline-block; background-color: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">
                Processing (Pending Council Review)
              </span>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="callout-blue">
        <strong>Next Steps:</strong> Please wait for a personal call or follow-up communication from me or an Arabiyya Rover Council representative regarding your candidate interview and Investiture following background verification.
      </div>

      <p style="margin-top: 20px;">You can check the real-time status of your application at any time using our online tracker:</p>
      <div style="text-align: center;">
        <a href="${trackUrl}" class="btn">Track Application Status</a>
      </div>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Dear ${displayName},\n\nOn behalf of the Arabiyya Rover Council, I am pleased to confirm that I have received your request to join the Arabiyya Rover Network.\n\nWe are currently processing your application.\n\nYour Application Summary:\n- Section: ${memberApp.role}\n- ID Card: ${memberApp.idCardNumber}\n- Username: ${memberApp.username}\n- Status: Processing (Pending Council Review)\n\nNext Steps: Please wait for a personal call or follow-up from me or an Arabiyya Rover Council representative regarding your candidate interview and Investiture.\n\nTrack status: ${trackUrl}\n\n${renderSecretarySignatureText(secName)}`;
  
  return sendEmail({ to: memberApp.email, subject, text, html });
}

// 5. Send Event Announcement
export async function sendEventAnnouncementEmail(
  event: { name: string; location: string; fromDateTime: string; toDateTime: string; description?: string },
  recipients: string[]
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  if (!recipients || recipients.length === 0) return { success: true, simulated: true };

  const secName = getSecretaryName();
  const subject = `📢 [Event Notice] ${event.name} - Arabiyya Rovers`;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';

  const html = wrapEmailHtml({
    title: event.name,
    badgeText: 'Official Crew Event Notice',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
    content: `
      <h2>📢 Official Crew Event Notice</h2>
      <h3 style="font-size: 17px; color: #800000; margin: 0 0 16px 0; font-weight: 800;">${event.name}</h3>
      <p>Dear Rovers and Crew Members,</p>
      <p>I am writing to officially announce an upcoming event for the Arabiyya Rover Network. Please review the schedule and event information below:</p>

      <div class="data-table-card">
        <table class="data-table">
          <tr>
            <td class="data-label">Location:</td>
            <td class="data-value">${event.location}</td>
          </tr>
          <tr>
            <td class="data-label">Start Time:</td>
            <td class="data-value">${event.fromDateTime.replace('T', ' ')}</td>
          </tr>
          <tr>
            <td class="data-label">End Time:</td>
            <td class="data-value">${event.toDateTime.replace('T', ' ')}</td>
          </tr>
          ${event.description ? `
          <tr>
            <td class="data-label">Brief / Agenda:</td>
            <td class="data-value" style="font-weight: 500;">${event.description}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div class="callout">
        <strong>Attendance Policy:</strong> Active members are required to attend. If you are unable to attend, kindly submit your absence excuse through <strong>My Attendance</strong> within 48 hours.
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}/attendance" class="btn">Go to My Attendance</a>
      </div>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Dear Rovers and Crew Members,\n\nI am writing to officially announce an upcoming event for the Arabiyya Rover Network:\n\nEvent: ${event.name}\nLocation: ${event.location}\nFrom: ${event.fromDateTime} to ${event.toDateTime}\n${event.description ? `Brief: ${event.description}\n` : ''}\nAttendance: ${appUrl}/attendance\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to: recipients, subject, text, html });
}

// 5b. Send Event Update Notice Email
export async function sendEventUpdateEmail(
  event: { name: string; location: string; fromDateTime: string; toDateTime: string; description?: string },
  recipients: string[]
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  if (!recipients || recipients.length === 0) return { success: true, simulated: true };

  const secName = getSecretaryName();
  const subject = `⚠️ [Event Updated] ${event.name} - Arabiyya Rovers`;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';

  const html = wrapEmailHtml({
    title: `Updated: ${event.name}`,
    badgeText: 'Official Event Schedule Update',
    badgeBg: '#fee2e2',
    badgeColor: '#b91c1c',
    content: `
      <h2>⚠️ Official Event Schedule Update</h2>
      <h3 style="font-size: 17px; color: #800000; margin: 0 0 16px 0; font-weight: 800;">${event.name}</h3>
      <p>Dear Rovers and Crew Members,</p>
      <p>Please note that official changes have been made to an already published event schedule. Please review the updated event details below:</p>

      <div class="data-table-card">
        <table class="data-table">
          <tr>
            <td class="data-label">Location:</td>
            <td class="data-value">${event.location}</td>
          </tr>
          <tr>
            <td class="data-label">Start Time:</td>
            <td class="data-value">${event.fromDateTime.replace('T', ' ')}</td>
          </tr>
          <tr>
            <td class="data-label">End Time:</td>
            <td class="data-value">${event.toDateTime.replace('T', ' ')}</td>
          </tr>
          ${event.description ? `
          <tr>
            <td class="data-label">Brief / Agenda:</td>
            <td class="data-value" style="font-weight: 500;">${event.description}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div class="callout">
        <strong>Attendance Policy:</strong> Active members are required to attend. If you are unable to attend, kindly submit your absence excuse through <strong>My Attendance</strong> within 48 hours.
      </div>

      <div style="text-align: center;">
        <a href="${appUrl}/attendance" class="btn">Go to My Attendance</a>
      </div>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Dear Rovers and Crew Members,\n\nOfficial updates have been made to the event "${event.name}".\n\nLocation: ${event.location}\nFrom: ${event.fromDateTime} to ${event.toDateTime}\n${event.description ? `Brief: ${event.description}\n` : ''}\nAttendance: ${appUrl}/attendance\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to: recipients, subject, text, html });
}

// 6. Send Test Email (SMTP Diagnostic)
export async function sendTestEmail(recipientEmail: string): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const secName = getSecretaryName();
  const subject = '🧪 [Test Email] Arabiyya Rovers SMTP Mail Server Connection';
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';

  const html = wrapEmailHtml({
    title: 'SMTP Test Dispatch',
    badgeText: 'SMTP System Diagnostic',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    content: `
      <h2>SMTP Mail Server Connection Test</h2>
      <p>Hello Administrator / Council Colleague,</p>
      <p>This test email confirms that our <strong>outgoing SMTP mail server</strong> is successfully configured and actively dispatching emails for Arabiyya Members.</p>
      <p>As Secretary of Arabiyya Rover Council, I use this automated mail service to dispatch official notifications, verification codes, registration updates, and event announcements.</p>
      
      <div class="data-table-card">
        <table class="data-table">
          <tr>
            <td class="data-label">Server Status:</td>
            <td class="data-value" style="color: #047857;">● Operational (Connected)</td>
          </tr>
          <tr>
            <td class="data-label">Dispatch Time:</td>
            <td class="data-value">${new Date().toUTCString()}</td>
          </tr>
          <tr>
            <td class="data-label">Target Recipient:</td>
            <td class="data-value">${recipientEmail}</td>
          </tr>
          <tr>
            <td class="data-label">Sender Attribution:</td>
            <td class="data-value">Secretary of Arabiyya Rover Council (${secName})</td>
          </tr>
        </table>
      </div>

      <p style="color: #64748b; font-size: 12px;">All emails are personalized and signed with the official Secretary of Arabiyya Rover Council signature.</p>

      <div style="text-align: center;">
        <a href="${appUrl}/admin/settings" class="btn">Open Settings</a>
      </div>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Hello Administrator,\n\nThis test email confirms that our outgoing SMTP mail server is operating correctly.\n\nDispatch Time: ${new Date().toISOString()}\nSender Attribution: Secretary of Arabiyya Rover Council (${secName})\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to: recipientEmail, subject, text, html });
}

// Dispatches Custom Official Announcement from Secretary of Arabiyya Rover Council
export async function sendCustomAnnouncementEmail(params: {
  to: string | string[];
  title: string;
  message: string;
  category?: string;
  actionUrl?: string;
  actionText?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, title, message, category, actionUrl, actionText } = params;
  const secName = getSecretaryName();
  const appUrl = process.env.APP_URL || 'https://arabiyyarovers.net';
  const subject = `[Arabiyya Rovers Notice] ${title}`;

  const formattedCategory = category ? category.toUpperCase() : 'OFFICIAL NOTICE';
  const paragraphHtml = message
    .split('\n\n')
    .map(p => `<p style="margin: 0 0 14px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const html = wrapEmailHtml({
    title,
    badgeText: formattedCategory,
    badgeBg: category === 'Urgent' ? '#fee2e2' : '#f0fdf4',
    badgeColor: category === 'Urgent' ? '#b91c1c' : '#15803d',
    content: `
      <h2>${title}</h2>
      <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Official Communication from the Arabiyya Rover Council</p>

      <div style="font-size: 14px; color: #1e293b; margin-bottom: 24px;">
        ${paragraphHtml}
      </div>

      ${actionUrl ? `
        <div style="text-align: center; margin: 28px 0;">
          <a href="${actionUrl.startsWith('http') ? actionUrl : `${appUrl}${actionUrl}`}" class="btn" style="background-color: #800000; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            ${actionText || 'View in Arabiyya Members'}
          </a>
        </div>
      ` : ''}

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `⚜️ Arabiyya Rover Council\nOfficial Communication\n\n${title}\n\n${message}\n\n${actionUrl ? `Action Link: ${actionUrl}\n\n` : ''}${renderSecretarySignatureText(secName)}`;
  return sendEmail({ to, subject, text, html });
}

// 7. Send Invite Email for Registration
export async function sendInviteEmail(to: string, inviteLink: string): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const secName = getSecretaryName();
  const subject = `⚜️ [Arabiyya Rovers] Invitation to Join Arabiyya Rover Crew`;

  const html = wrapEmailHtml({
    title: 'Arabiyya Crew Invitation',
    badgeText: 'Official Invitation',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    content: `
      <h2>Invitation to Join Arabiyya Rover Crew</h2>
      <p>Dear Candidate,</p>
      <p>I am pleased to inform you that you have been officially invited to join the <strong>Arabiyya Rover Crew</strong>.</p>
      
      <p>Please use the button below to register and complete your membership details in our system. Note that this invitation link is secure and will expire in 2 hours:</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${inviteLink}" class="btn" style="background-color: #800000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(128, 0, 0, 0.15);">
          Accept Invitation & Register
        </a>
      </div>

      <div class="callout-blue">
        <strong>Security Notice:</strong> Do not share this link with anyone else. The registration token embedded in the link is uniquely tied to your email address and can only be used once.
      </div>

      <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
        If you did not expect this invitation or believe it was sent in error, you can safely ignore this email.
      </p>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Arabiyya Members\nArabiyya Rover Council\n\nDear Candidate,\n\nYou have been officially invited to join the Arabiyya Rover Crew.\n\nPlease use the following link to register and complete your membership: ${inviteLink}\n\n(This link is valid for 2 hours)\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to, subject, text, html });
}

// 8. Send Welcome Email upon Approval/Activation (Only Full Name and Username)
export async function sendWelcomeEmail(member: {
  fullName: string;
  role: string;
  email: string;
  username: string;
  commonName?: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const secName = getSecretaryName();
  const subject = `⚜️ [Arabiyya Rovers] Welcome to the Crew, ${member.fullName}!`;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';
  const displayName = member.commonName || member.fullName.split(' ')[0] || member.fullName;

  const html = wrapEmailHtml({
    title: 'Welcome to Arabiyya Crew',
    badgeText: 'Official Membership Activation',
    badgeBg: '#f0fdf4',
    badgeColor: '#15803d',
    content: `
      <h2>Welcome to the Arabiyya ${member.role || 'Rover/Explorer'} Crew!</h2>
      <p>Dear <strong>${displayName}</strong>,</p>
      <p>On behalf of the Arabiyya Rover Council, I am thrilled to officially welcome you as an active member of our scout crew! Your membership application and account have been fully approved and activated.</p>
      
      <p>You can now participate in all scout activities, log attendance, track your award milestones, and connect with fellow crew members through the portal.</p>

      <div class="data-table-card">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.06em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Your Account Details</div>
        <table class="data-table">
          <tr>
            <td class="data-label">Full Name:</td>
            <td class="data-value">${member.fullName}</td>
          </tr>
          <tr>
            <td class="data-label">Username:</td>
            <td class="data-value">${member.username}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${appUrl}/signin" class="btn" style="background-color: #800000; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Sign In to Portal
        </a>
      </div>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Arabiyya Rover Council\n\nDear ${displayName},\n\nWelcome to the Arabiyya ${member.role || 'Rover/Explorer'} Crew! Your membership application has been approved and activated.\n\nFull Name: ${member.fullName}\nUsername: ${member.username}\n\nYou can now sign in at ${appUrl}/signin using your username and password.\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to: member.email, subject, text, html });
}

// 9. Send Welcome Back Email upon Reactivation from Suspension
export async function sendWelcomeBackEmail(member: {
  fullName: string;
  role: string;
  email: string;
  username: string;
  commonName?: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const secName = getSecretaryName();
  const subject = `⚜️ [Arabiyya Rovers] Welcome Back to the Crew, ${member.fullName}!`;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';
  const displayName = member.commonName || member.fullName.split(' ')[0] || member.fullName;

  const html = wrapEmailHtml({
    title: 'Welcome Back to Arabiyya Crew',
    badgeText: 'Membership Reactivation',
    badgeBg: '#f0fdf4',
    badgeColor: '#15803d',
    content: `
      <h2>Welcome Back to the Arabiyya ${member.role || 'Rover/Explorer'} Crew!</h2>
      <p>Dear <strong>${displayName}</strong>,</p>
      <p>On behalf of the Arabiyya Rover Council, I am delighted to welcome you back as an active member following the lifting of your suspension.</p>
      
      <p>Your portal access has been fully restored. You can now participate in all scout activities, log attendance, and connect with fellow crew members.</p>

      <div class="data-table-card">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.06em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Your Account Details</div>
        <table class="data-table">
          <tr>
            <td class="data-label">Full Name:</td>
            <td class="data-value">${member.fullName}</td>
          </tr>
          <tr>
            <td class="data-label">Username:</td>
            <td class="data-value">${member.username}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${appUrl}/signin" class="btn" style="background-color: #800000; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Sign In to Portal
        </a>
      </div>

      ${renderSecretarySignatureHtml(secName)}
    `
  });

  const text = `Arabiyya Rover Council\n\nDear ${displayName},\n\nWelcome Back to the Arabiyya ${member.role || 'Rover/Explorer'} Crew! Your membership has been reactivated.\n\nFull Name: ${member.fullName}\nUsername: ${member.username}\n\nYou can sign in at ${appUrl}/signin.\n\n${renderSecretarySignatureText(secName)}`;

  return sendEmail({ to: member.email, subject, text, html });
}


