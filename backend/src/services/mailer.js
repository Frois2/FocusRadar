const nodemailer = require('nodemailer');
const isDev = process.env.NODE_ENV !== 'production';

function createTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: false,
    auth: { 
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASS 
    },
    tls: {
      rejectUnauthorized: false 
    },
    connectionTimeout: 10000, 
    greetingTimeout: 10000
  });
}

async function sendMail(opts) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('\n── [DEV MAIL] ─────────────────────────');
    console.log('To:', opts.to);
    console.log('Subject:', opts.subject);
    if (opts._devCode) console.log('Code:', opts._devCode);
    if (opts._devLink) console.log('Link:', opts._devLink);
    console.log('────────────────────────────────────────\n');
    return;
  }
  await transporter.sendMail({ from: process.env.SMTP_FROM || 'FocusRadar <no-reply@focusradar.app>', ...opts });
}

async function sendVerificationEmail(to, { code, token }) {
  const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  await sendMail({
    to,
    subject: 'Seu código de verificação — FocusRadar',
    _devCode: code,
    _devLink: link,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f1120;padding:40px;border-radius:16px;border:1px solid #1e2236">
        <p style="color:#8892b0;font-size:13px;margin:0 0 4px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em">FocusRadar</p>
        <h2 style="color:#ccd6f6;font-size:22px;margin:0 0 24px;font-weight:800">Confirme seu e-mail</h2>
        <p style="color:#8892b0;font-size:14px;margin:0 0 28px">Use o código abaixo para verificar sua conta. Ele expira em 24 horas.</p>
        <div style="background:#161929;border:1px solid #252a42;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <p style="color:#8892b0;font-size:11px;font-family:monospace;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em">Código de verificação</p>
          <p style="color:#60a5fa;font-size:36px;font-weight:900;letter-spacing:0.3em;margin:0;font-family:monospace">${code}</p>
        </div>
        <p style="color:#4a5280;font-size:12px;margin:0">Se você não criou uma conta no FocusRadar, ignore este e-mail.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(to, token) {
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  await sendMail({
    to,
    subject: 'Redefinir senha — FocusRadar',
    _devLink: url,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f1120;padding:40px;border-radius:16px;border:1px solid #1e2236">
        <p style="color:#8892b0;font-size:13px;margin:0 0 4px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em">FocusRadar</p>
        <h2 style="color:#ccd6f6;font-size:22px;margin:0 0 24px;font-weight:800">Redefinir senha</h2>
        <p style="color:#8892b0;font-size:14px;margin:0 0 28px">Clique no botão para criar uma nova senha. O link expira em 1 hora.</p>
        <a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px">Redefinir senha →</a>
        <p style="color:#4a5280;font-size:12px;margin-top:28px">Se você não solicitou isso, ignore este e-mail.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
