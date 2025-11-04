package com.socialw.gateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthCheckService {

    private final WebClient webClient;
    private final RouteLocator routeLocator;

    public Mono<Map<String, String>> checkAllServicesHealth() {
        return getServiceUrlsFromRoutes()
                .collectList()
                .flatMap(serviceEntries -> {
                    if (serviceEntries.isEmpty()) {
                        log.warn("No routes found for health checks");
                        return Mono.just(getFallbackStatus());
                    }

                    Map<String, String> healthStatus = new LinkedHashMap<>();
                    Mono<Map<String, String>> result = Mono.just(healthStatus);

                    for (Map.Entry<String, String> entry : serviceEntries) {
                        String serviceName = entry.getKey();
                        String healthUrl = getHealthUrlFromServiceUrl(entry.getValue());

                        result = result.flatMap(statusMap ->
                                checkServiceHealth(healthUrl, serviceName)
                                        .doOnNext(status -> statusMap.put(serviceName, status))
                                        .thenReturn(statusMap)
                        );
                    }

                    return result;
                })
                .onErrorReturn(getFallbackStatus());
    }

    private Flux<Map.Entry<String, String>> getServiceUrlsFromRoutes() {
        return routeLocator.getRoutes()
                .filter(route -> route.getUri().getHost() != null)
                .map(route -> {
                    String routeId = route.getId();
                    String serviceUrl = route.getUri().toString();

                    String serviceName = routeId.replace("-service", "");

                    return Map.entry(serviceName, serviceUrl);
                });
    }

    private String getHealthUrlFromServiceUrl(String serviceUrl) {
        return serviceUrl + "/health";
    }

    private Mono<String> checkServiceHealth(String serviceUrl, String serviceName) {
        log.info("Checking health for {} at {}", serviceName, serviceUrl);

        return webClient.get()
                .uri(serviceUrl)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> {
                    log.warn("Service {} returned error: {}", serviceName, response.statusCode());
                    return Mono.empty();
                })
                .bodyToMono(String.class)
                .map(body -> {
                    log.debug("Service {} response: {}", serviceName, body);
                    if (body != null && body.toLowerCase().contains("healthy")) {
                        return "healthy";
                    }
                    return "unhealthy";
                })
                .timeout(Duration.ofSeconds(3))
                .onErrorResume(throwable -> {
                    log.warn("Service {} unreachable: {}", serviceName, throwable.getMessage());
                    return Mono.just("unhealthy");
                })
                .defaultIfEmpty("unhealthy");
    }

    private Map<String, String> getFallbackStatus() {
        Map<String, String> fallback = new LinkedHashMap<>();
        fallback.put("auth", "unhealthy");
        fallback.put("post", "unhealthy");
        fallback.put("profile", "unhealthy");
        fallback.put("search", "unhealthy");
        return fallback;
    }
}