import { Injectable } from '@nestjs/common';

type AuditEvent =
  | { type: 'auth.login'; userId?: string; requestId?: string; ip?: string }
  | { type: 'auth.refresh'; userId?: string; requestId?: string; ip?: string }
  | { type: 'auth.logout'; userId?: string; requestId?: string; ip?: string }
  | {
      type: 'user.role_change';
      actorId?: string;
      targetUserId: string;
      fromRole?: string;
      toRole: string;
      requestId?: string;
    }
  | {
      type: 'finance.create_fee';
      actorId?: string;
      studentId: string;
      amount: number;
      dueDate: string;
      requestId?: string;
    }
  | { type: 'finance.record_payment'; actorId?: string; invoiceId: string; amount: number; requestId?: string };

@Injectable()
export class AuditLogger {
  log(event: AuditEvent): void {
    const time = new Date().toISOString();
    // Minimal PII: ids and requestId only
    console.log(`[audit] ${time} ${JSON.stringify(event)}`);
  }
}
