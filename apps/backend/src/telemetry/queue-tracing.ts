import { context, propagation, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Context } from '@opentelemetry/api';

export type OtelJobCarrier = Record<string, string>;

const OTEL_CARRIER_KEY = '__otel';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getCarrierFromJobData(data: unknown): OtelJobCarrier | undefined {
  if (!isRecord(data)) return undefined;
  const carrier = data[OTEL_CARRIER_KEY];
  if (!isRecord(carrier)) return undefined;
  const out: OtelJobCarrier = {};
  for (const [k, v] of Object.entries(carrier)) {
    if (typeof v === 'string') out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export function withOtelCarrier<T extends Record<string, unknown>>(data: T): T & { __otel: OtelJobCarrier } {
  const carrier: OtelJobCarrier = {};
  propagation.inject(context.active(), carrier);
  return { ...data, [OTEL_CARRIER_KEY]: carrier } as T & { __otel: OtelJobCarrier };
}

export async function runWithBullJobSpan<T>(params: {
  readonly queueName: string;
  readonly jobName: string;
  readonly jobId: string | number | undefined;
  readonly jobData: unknown;
  readonly operation: 'process' | 'enqueue';
  readonly fn: () => Promise<T>;
}): Promise<T> {
  const tracer = trace.getTracer('mi-campus-backend.queue');
  const carrier = getCarrierFromJobData(params.jobData);
  const parentContext: Context = carrier ? propagation.extract(context.active(), carrier) : context.active();

  const spanName =
    params.operation === 'enqueue'
      ? `queue ${params.queueName} enqueue ${params.jobName}`
      : `queue ${params.queueName} process ${params.jobName}`;

  return tracer.startActiveSpan(
    spanName,
    {
      kind: params.operation === 'enqueue' ? SpanKind.PRODUCER : SpanKind.CONSUMER,
      attributes: {
        'messaging.system': 'bull',
        'messaging.destination.name': params.queueName,
        'messaging.operation': params.operation,
        ...(params.jobId !== undefined ? { 'messaging.message_id': String(params.jobId) } : {}),
        'messaging.bull.job_name': params.jobName,
      },
    },
    parentContext,
    async (span) => {
      try {
        const result = await params.fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message });
        span.recordException(err as Error);
        throw err;
      } finally {
        span.end();
      }
    },
  );
}
