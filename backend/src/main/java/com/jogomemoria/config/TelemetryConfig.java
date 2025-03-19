package com.jogomemoria.config;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.exporter.jaeger.JaegerGrpcSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import io.opentelemetry.semconv.resource.attributes.ResourceAttributes;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TelemetryConfig {
    
    @Bean
    public SdkTracerProvider tracerProvider() {
        Resource resource = Resource.getDefault()
            .merge(Resource.create(Attributes.of(
                ResourceAttributes.SERVICE_NAME, "jogo-memoria-service")));
                
        return SdkTracerProvider.builder()
            .addSpanProcessor(BatchSpanProcessor.builder(
                JaegerGrpcSpanExporter.builder()
                    .setEndpoint("http://localhost:14250")
                    .build())
                .build())
            .setResource(resource)
            .build();
    }
    
    @Bean
    public OpenTelemetry openTelemetry() {
        return OpenTelemetrySdk.builder()
            .setTracerProvider(tracerProvider())
            .buildAndRegisterGlobal();
    }
} 