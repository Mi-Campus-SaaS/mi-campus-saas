import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ConfigService } from '@nestjs/config';

export function initializeTracing(configService: ConfigService) {
  const otelConfig = configService.get('otel');

  if (!otelConfig.enabled) {
    return null;
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: otelConfig.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: otelConfig.serviceVersion,
      environment: configService.get('nodeEnv') || 'development',
    }),
    spanProcessor: new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: otelConfig.endpoint,
        headers: {},
      }),
    ),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  return sdk;
}
