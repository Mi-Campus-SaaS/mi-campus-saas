import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/configuration';

export function initializeTracing(configService: ConfigService) {
  const otelConfig = configService.get<AppConfig['otel']>('otel');

  if (!otelConfig?.enabled) {
    return null;
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': otelConfig.serviceName,
      'service.version': otelConfig.serviceVersion,
      environment: configService.get<string>('nodeEnv') || 'development',
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
