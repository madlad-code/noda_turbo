// packages/opentelemetry-config/src/index.ts
import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

// Optional: For troubleshooting, set the log level to DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const otelCollectorEndpoint = 'http://otel-collector:4318';

const sdk = new NodeSDK({
  // Service name is passed in from the application's instrumentation file
  // serviceName: 'your-service-name' is set dynamically below
  traceExporter: new OTLPTraceExporter({
    url: `${otelCollectorEndpoint}/v1/traces`,
  }),
  logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter({
    url: `${otelCollectorEndpoint}/v1/logs`,
  })),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${otelCollectorEndpoint}/v1/metrics`,
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

// Main function to initialize telemetry for a specific service
export const initTelemetry = (serviceName: string) => {
  // Set the service name for all telemetry data
  process.env.OTEL_SERVICE_NAME = serviceName;
  
  sdk.start();
  console.log(`Telemetry for [${serviceName}] has started.`);

  // Gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log(`Telemetry for [${serviceName}] terminated.`))
      .catch((error) => console.error('Error terminating telemetry', error))
      .finally(() => process.exit(0));
  });
};