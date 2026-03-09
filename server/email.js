const brevoModule = require('@getbrevo/brevo')
const brevo = brevoModule.default || brevoModule
const apiInstance = new brevo.TransactionalEmailsApi()
require('dotenv').config()

const APP_URL = process.env.APP_URL || 'https://talongguard-v2-oakf.vercel.app'

function getClient() {
  apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY
  return apiInstance
}

function buildEmail({ to, subject, html }) {
  return {
    sender: { name: 'TalongGuard System', email: 'owenespiritu323@gmail.com' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  }
}

// ── Send welcome email with temp password ────────────────────────────
async function sendWelcomeEmail({ to, name, email, tempPassword }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#15803d,#7e22ce);padding:40px;text-align:center;">
                <div style="font-size:40px;margin-bottom:12px;">🍆</div>
                <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">TalongGuard</h1>
                <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Eggplant Disease Detection System</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="color:#111;font-size:20px;margin:0 0 8px;">Welcome, ${name}! 👋</h2>
                <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                  Your Agriculturist account has been created by the system administrator.
                </p>
                <div style="background:#f8faf8;border:2px solid #e5f0e5;border-radius:12px;padding:24px;margin-bottom:28px;">
                  <p style="color:#15803d;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Your Login Credentials</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5f0e5;">
                        <span style="color:#888;font-size:13px;">Email</span><br>
                        <strong style="color:#111;font-size:15px;">${email}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:12px 0 0;">
                        <span style="color:#888;font-size:13px;">Temporary Password</span><br>
                        <strong style="color:#111;font-size:18px;letter-spacing:2px;font-family:monospace;background:#fff;border:1px solid #ddd;padding:6px 12px;border-radius:6px;display:inline-block;margin-top:4px;">${tempPassword}</strong>
                      </td>
                    </tr>
                  </table>
                </div>
                <div style="background:#fff8ed;border-left:4px solid #f59e0b;padding:16px;border-radius:0 8px 8px 0;margin-bottom:28px;">
                  <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">⚠️ Important</p>
                  <p style="color:#92400e;font-size:13px;margin:6px 0 0;">You will be asked to change your password after your first login.</p>
                </div>
                <div style="text-align:center;margin-bottom:28px;">
                  <a href="${APP_URL}/login" style="background:linear-gradient(135deg,#15803d,#166534);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;display:inline-block;">
                    Log In to TalongGuard →
                  </a>
                </div>
                <p style="color:#aaa;font-size:12px;text-align:center;margin:0;">If you did not expect this email, please contact your system administrator.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8faf8;padding:20px;text-align:center;border-top:1px solid #eee;">
                <p style="color:#aaa;font-size:12px;margin:0;">© 2026 TalongGuard — Nueva Ecija, Philippines</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
  await getClient().sendTransacEmail(
    buildEmail({ to, subject: '🍆 Your TalongGuard Account is Ready', html })
  )
}

// ── Send password reset email ────────────────────────────────────────
async function sendPasswordResetEmail({ to, name, resetToken }) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#15803d,#7e22ce);padding:40px;text-align:center;">
                <div style="font-size:40px;margin-bottom:12px;">🍆</div>
                <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">TalongGuard</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="color:#111;font-size:20px;margin:0 0 12px;">Password Reset Request</h2>
                <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                  Hi ${name}, click the button below to reset your password. This link expires in <strong>1 hour</strong>.
                </p>
                <div style="text-align:center;margin-bottom:28px;">
                  <a href="${resetUrl}" style="background:linear-gradient(135deg,#15803d,#166534);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;display:inline-block;">
                    Reset My Password →
                  </a>
                </div>
                <p style="color:#aaa;font-size:12px;text-align:center;">If you didn't request this, ignore this email.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
  await getClient().sendTransacEmail(
    buildEmail({ to, subject: '🔐 Reset Your TalongGuard Password', html })
  )
}

// ── Send email verification code ─────────────────────────────────────
async function sendVerificationCode({ to, name, code }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#15803d,#7e22ce);padding:36px;text-align:center;">
                <div style="font-size:36px;margin-bottom:10px;">🍆</div>
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">TalongGuard</h1>
                <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">Email Verification</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 36px;">
                <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px;">
                  An admin is creating an account for you on TalongGuard. Use the verification code below.
                </p>
                <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
                  <p style="color:#15803d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your Verification Code</p>
                  <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#111827;font-family:monospace;">${code}</div>
                  <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">Expires in <strong>10 minutes</strong></p>
                </div>
                <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
                  <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">⚠️ Do not share this code</p>
                </div>
                <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">© 2026 TalongGuard — Nueva Ecija, Philippines</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
  await getClient().sendTransacEmail(
    buildEmail({ to, subject: `🔐 Your TalongGuard Verification Code: ${code}`, html })
  )
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendVerificationCode }
