import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { AuditEventEntity } from './audit.entity';
import { QueryAuditDto } from './dto/query-audit.dto';

export interface PersistedAuditEvent {
  readonly id: string;
  readonly createdAt: Date;
  readonly type: string;
  readonly requestId?: string | null;
  readonly ip?: string | null;
  readonly actorUserId?: string | null;
  readonly targetUserId?: string | null;
  readonly objectId?: string | null;
  readonly meta?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditEventEntity) private readonly repo: Repository<AuditEventEntity>) {}

  async append(event: Omit<PersistedAuditEvent, 'id' | 'createdAt'>): Promise<PersistedAuditEvent> {
    const entity = this.repo.create({
      type: event.type,
      requestId: event.requestId ?? null,
      ip: event.ip ?? null,
      actorUserId: event.actorUserId ?? null,
      targetUserId: event.targetUserId ?? null,
      objectId: event.objectId ?? null,
      meta: event.meta ?? null,
    });
    const saved = await this.repo.save(entity);
    return saved;
  }

  async query(
    params: QueryAuditDto,
  ): Promise<{ data: PersistedAuditEvent[]; total: number; page: number; limit: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: FindOptionsWhere<AuditEventEntity> = {};
    if (params.type) where.type = params.type;
    if (params.actorUserId) where.actorUserId = params.actorUserId;
    if (params.targetUserId) where.targetUserId = params.targetUserId;
    if (params.from || params.to) {
      const fromDate = params.from ? new Date(params.from) : new Date(0);
      const toDate = params.to ? new Date(params.to) : new Date();
      where.createdAt = Between(fromDate, toDate);
    }
    const [rows, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: (params.sortDir ?? 'desc').toUpperCase() as 'ASC' | 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data: rows, total, page, limit };
  }
}
