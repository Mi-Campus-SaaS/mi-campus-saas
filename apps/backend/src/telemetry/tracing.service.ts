import { Injectable } from '@nestjs/common';
import { trace, context, SpanStatusCode, Span, propagation } from '@opentelemetry/api';
import { Request } from 'express';

@Injectable()
export class TracingService {
  private readonly tracer = trace.getTracer('mi-campus-backend');

  getCurrentSpan(): Span | undefined {
    return trace.getActiveSpan();
  }

  getTraceId(): string | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext().traceId;
  }

  getSpanId(): string | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext().spanId;
  }

  startSpan(name: string, attributes?: Record<string, any>): Span {
    return this.tracer.startSpan(name, { attributes });
  }

  async runInSpan<T>(name: string, fn: (span: Span) => Promise<T>, attributes?: Record<string, any>): Promise<T> {
    return this.tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  setAttributes(attributes: Record<string, any>): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }

  extractTraceFromRequest(req: Request): void {
    const traceparent = req.headers['traceparent'] as string;
    const tracestate = req.headers['tracestate'] as string;

    if (traceparent) {
      const spanContext = propagation.extract(context.active(), {
        traceparent,
        tracestate,
      });
      context.with(spanContext, () => {
        // Context is now active for this request
      });
    }
  }
}
