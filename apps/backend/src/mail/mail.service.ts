import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('smtp.host') || process.env.SMTP_HOST,
      port: this.config.get<number>('smtp.port') || Number(process.env.SMTP_PORT || 1025),
      secure: this.config.get<boolean>('smtp.secure') || false,
      auth: this.config.get('smtp.user')
        ? { user: this.config.get<string>('smtp.user'), pass: this.config.get<string>('smtp.pass') }
        : undefined,
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    const from = this.config.get<string>('smtp.from') || 'Mi Campus <noreply@micampus.local>';
    return this.transporter.sendMail({ from, to, subject, text });
  }
}

