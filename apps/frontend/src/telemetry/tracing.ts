import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { trace } from '@opentelemetry/api';

export function initializeTracing() {
  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: 'mi-campus-frontend',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      environment: import.meta.env.MODE || 'development',
    }),
  });

  provider.register();

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new UserInteractionInstrumentation(),
      new FetchInstrumentation({
        ignoreUrls: ['/health', '/metrics'],
        propagateTraceHeaderCorsUrls: [import.meta.env.VITE_API_URL || 'http://localhost:3000/api'],
      }),
    ],
  });

  return provider;
}

export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}

export function getSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().spanId;
}

export function injectTraceHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const span = trace.getActiveSpan();
  if (span) {
    const { traceId, spanId } = span.spanContext();
    headers['traceparent'] = `00-${traceId}-${spanId}-01`;
    headers['tracestate'] = '';
  }
  return headers;
}
