# Observability Setup

This project includes OpenTelemetry tracing for both frontend and backend to provide comprehensive observability.

## Architecture

- **Frontend**: React app with OpenTelemetry Web SDK
- **Backend**: NestJS app with OpenTelemetry Node SDK
- **Collector**: OpenTelemetry Collector for processing and routing traces
- **Jaeger**: Distributed tracing backend for visualization

## Local Development Setup

### 1. Start Observability Infrastructure

```bash
# Start OTEL collector and Jaeger
docker-compose -f docker-compose.otel.yml up -d
```

### 2. Access Jaeger UI

Open <http://localhost:16686> to view traces in the Jaeger UI.

### 3. Environment Variables

#### Backend (.env)

```bash
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=mi-campus-backend
OTEL_SERVICE_VERSION=1.0.0
```

#### Frontend (.env)

```bash
VITE_OTEL_ENDPOINT=http://localhost:4318/v1/traces
```

## Features

### Request Correlation

- Request IDs are propagated from frontend to backend
- Trace context is automatically injected into HTTP headers
- Spans are correlated across frontend and backend services

### Automatic Instrumentation

- HTTP requests (fetch/axios)
- User interactions (clicks, navigation)
- Document load events
- Express.js middleware
- NestJS controllers and services

### Manual Tracing

Use the `TracingService` in backend or tracing utilities in frontend:

```typescript
// Backend
@Injectable()
export class MyService {
  constructor(private tracingService: TracingService) {}

  async myMethod() {
    return this.tracingService.runInSpan("my-operation", async (span) => {
      span.setAttributes({ "custom.attribute": "value" });
      // Your business logic here
    });
  }
}

// Frontend
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-component");
tracer.startActiveSpan("user-action", (span) => {
  span.setAttributes({ "action.type": "button-click" });
  // Your code here
  span.end();
});
```

## Production Deployment

For production, configure the OTEL endpoint to point to your observability platform:

- **Jaeger**: `http://jaeger:14250`
- **Zipkin**: `http://zipkin:9411/api/v2/spans`
- **Cloud platforms**: AWS X-Ray, Google Cloud Trace, Azure Monitor

## Sentry (Errors + Source Maps)

This repo supports optional Sentry error reporting for both frontend and backend, with:

- **Error capture**: React errors (ErrorBoundary) + backend unhandled exceptions / 5xx responses.
- **PII scrubbing**: tokens/cookies/passwords/emails are filtered via `beforeSend`.
- **Release tags**: `release` and `environment` are set from env vars.
- **Source maps**: sourcemaps are generated and can be uploaded via Sentry CLI.

### Environment variables

#### Runtime (frontend)

```bash
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_RELEASE=
```

#### Runtime (backend)

```bash
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=
```

#### CI/CD (upload source maps)

```bash
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT_FRONTEND=
SENTRY_PROJECT_BACKEND=
SENTRY_RELEASE=
```

### Upload source maps

After building, run:

```bash
yarn sentry:upload:frontend
yarn sentry:upload:backend
```

## Troubleshooting

### Traces not appearing

1. Check OTEL collector logs: `docker-compose -f docker-compose.otel.yml logs otel-collector`
1. Verify endpoints are accessible
1. Check browser console for CORS errors

### Performance impact

- Tracing is disabled in test environments
- Batch processing reduces overhead
- Sampling can be configured for high-traffic scenarios
