import { Injectable, Optional } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

type AuditEvent =
  | { type: 'auth.login'; userId?: string; requestId?: string; ip?: string }
  | { type: 'auth.refresh'; userId?: string; requestId?: string; ip?: string }
  | { type: 'auth.logout'; userId?: string; requestId?: string; ip?: string }
  | { type: 'auth.account_locked'; userId?: string; requestId?: string; ip?: string; metadata?: Record<string, any> }
  | { type: 'auth.login_success'; userId?: string; requestId?: string; ip?: string }
  | { type: 'auth.account_unlocked'; userId?: string; requestId?: string; metadata?: Record<string, any> }
  | {
      type: 'auth.email_verification_requested';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.email_verification_success';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.email_verification_replay_attempt';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.email_verification_expired';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.email_verification_resent';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.password_reset_requested';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.password_reset_success';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.password_reset_replay_attempt';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.password_reset_expired';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
  | {
      type: 'auth.password_reset_policy_violation';
      userId?: string;
      requestId?: string;
      ip?: string;
      metadata?: Record<string, any>;
    }
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
  constructor(@Optional() private readonly auditService?: AuditService) {}

  async log(event: AuditEvent & { requestId?: string; actorId?: string; targetUserId?: string }): Promise<void> {
    const time = new Date().toISOString();
    // Minimal PII: ids and requestId only (still log to stdout for shipping if needed)
    console.log(`[audit] ${time} ${JSON.stringify(event)}`);
    if (!this.auditService) return;
    const base = {
      type: event.type,
      requestId: event.requestId ?? undefined,
      actorUserId: 'actorId' in event ? event.actorId : undefined,
      targetUserId: 'targetUserId' in event ? event.targetUserId : undefined,
    } as const;

    switch (event.type) {
      case 'auth.login':
      case 'auth.refresh':
      case 'auth.logout':
      case 'auth.login_success':
        await this.auditService.append({ ...base, actorUserId: event.userId, ip: event.ip });
        break;
      case 'auth.account_locked':
      case 'auth.email_verification_requested':
      case 'auth.email_verification_success':
      case 'auth.email_verification_replay_attempt':
      case 'auth.email_verification_expired':
      case 'auth.email_verification_resent':
      case 'auth.password_reset_requested':
      case 'auth.password_reset_success':
      case 'auth.password_reset_replay_attempt':
      case 'auth.password_reset_expired':
      case 'auth.password_reset_policy_violation':
        await this.auditService.append({
          ...base,
          actorUserId: event.userId,
          ip: event.ip,
          meta: event.metadata,
        });
        break;
      case 'auth.account_unlocked':
        await this.auditService.append({
          ...base,
          actorUserId: event.userId,
          meta: event.metadata,
        });
        break;
      case 'user.role_change':
        await this.auditService.append({
          ...base,
          actorUserId: event.actorId,
          targetUserId: event.targetUserId,
          meta: {
            fromRole: event.fromRole,
            toRole: event.toRole,
          },
        });
        break;
      case 'finance.create_fee':
        await this.auditService.append({
          ...base,
          objectId: event.studentId,
          meta: { amount: event.amount, dueDate: event.dueDate },
        });
        break;
      case 'finance.record_payment':
        await this.auditService.append({ ...base, objectId: event.invoiceId, meta: { amount: event.amount } });
        break;
      default:
        await this.auditService.append({ ...base });
    }
  }
}
