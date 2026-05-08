import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
    console.log('✅ Using configured Ethereal credentials');
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✅ Auto-created Ethereal account:', testAccount.user);
    console.log('   Add to .env: ETHEREAL_USER=' + testAccount.user);
    console.log('   Add to .env: ETHEREAL_PASS=' + testAccount.pass);
  }

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<string> {
  const t = await getTransporter();

  const info = await t.sendMail({
    from: options.from || '"Email Scheduler" <scheduler@example.com>',
    to: options.to,
    subject: options.subject,
    html: options.body,
    text: options.body.replace(/<[^>]*>/g, ''),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('📧 Preview URL:', previewUrl);
  }

  return info.messageId;
}