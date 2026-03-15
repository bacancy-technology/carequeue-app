import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private _transporter: Transporter | null = null;

  constructor(private config: ConfigService) {
    // Log SMTP config at startup (password masked) so misconfiguration is visible immediately
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<string>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.logger.log(
      `SMTP config — host: ${host ?? '(not set)'}, port: ${port ?? '(not set)'}, user: ${user ?? '(not set)'}, pass: ${pass ? '***set***' : '(not set)'}`,
    );
  }

  /** Lazy transporter — built on first use so .env values are always current. */
  private get transporter(): Transporter {
    if (this._transporter) return this._transporter;

    const host = this.config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com';
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this._transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,   // true for 465 (SSL), false for 587 (STARTTLS)
      requireTLS: port !== 465, // force STARTTLS upgrade on port 587
      auth: { user, pass },
      tls: { rejectUnauthorized: false }, // allow self-signed certs in dev
    });

    return this._transporter;
  }

  async send(options: SendMailOptions): Promise<boolean> {
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!user || !pass) {
      this.logger.warn(
        `Email skipped (no SMTP credentials) — would have sent to ${options.to}: "${options.subject}". Set SMTP_USER and SMTP_PASS in .env`,
      );
      return false;
    }

    try {
      const from = this.config.get<string>('SMTP_FROM') ?? 'CareQueue <no-reply@carequeue.app>';
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email sent → ${options.to} | "${options.subject}"`);
      return true;
    } catch (err) {
      // Reset transporter so next attempt rebuilds it with fresh credentials
      this._transporter = null;
      this.logger.error(
        `Failed to send email to ${options.to} | "${options.subject}"`,
        (err as Error).message,
      );
      return false;
    }
  }
}
