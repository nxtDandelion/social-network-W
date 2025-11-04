package com.socialw.gateway.service;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@ConfigurationProperties(prefix = "services")
public class HealthCheckService {

    private final WebClient webClient;
    // Spring Boot автоматически свяжет свойства из application.yml
    @Getter
    private final Map<String, ServiceConfig> services = new HashMap<>();

    public HealthCheckService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public void setServices(Map<String, ServiceConfig> services) {
        this.services.putAll(services);
    }

    public Mono<Map<String, String>> checkAllServicesHealth() {
        Map<String, String> healthStatus = new HashMap<>();

        if (services.isEmpty()) {
            log.warn("No services configured for health checks");
            return Mono.just(fallbackHealthStatus());
        }

        Mono<Map<String, String>> healthCheckMono = Mono.just(healthStatus);

        for (Map.Entry<String, ServiceConfig> entry : services.entrySet()) {
            String serviceName = entry.getKey();
            String serviceUrl = entry.getValue().getUrl();

            healthCheckMono = healthCheckMono
                    .then(checkServiceHealth(serviceUrl, serviceName)
                            .doOnNext(status -> healthStatus.put(serviceName, status))
                            .thenReturn(healthStatus));
        }

        return healthCheckMono
                .onErrorReturn(fallbackHealthStatus());
    }

    private Mono<String> checkServiceHealth(String serviceUrl, String serviceName) {
        return webClient.get()
                .uri(serviceUrl)
                .exchangeToMono(response -> {
                    if (response.statusCode().equals(HttpStatus.OK)) {
                        log.debug("Service {} is healthy", serviceName);
                        return Mono.just("healthy");
                    } else {
                        log.warn("Service {} returned status: {}", serviceName, response.statusCode());
                        return Mono.just("unhealthy");
                    }
                })
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(throwable -> {
                    log.warn("Service {} is unreachable: {}", serviceName, throwable.getMessage());
                    return Mono.just("unhealthy");
                });
    }

    private Map<String, String> fallbackHealthStatus() {
        Map<String, String> fallback = new HashMap<>();
        // Автоматически создаем fallback для всех зарегистрированных сервисов
        services.keySet().forEach(service -> fallback.put(service, "unhealthy"));
        return fallback;
    }

    // Вспомогательный класс для конфигурации сервисов
    public static class ServiceConfig {
        private String url;
        private String name;

        // геттеры и сеттеры
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}