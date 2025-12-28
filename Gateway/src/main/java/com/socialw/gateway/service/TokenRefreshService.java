package com.socialw.gateway.service;

import com.socialw.gateway.model.RefreshTokenResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenRefreshService {

    private final WebClient webClient;
    private final RouteLocator routeLocator;

    public Mono<RefreshTokenResponse> refreshToken(String refreshToken) {
        return getAuthServiceUrl()
                .flatMap(authServiceUrl -> {
                    String refreshUrl = authServiceUrl + "/refresh";

                    return webClient.post()
                            .uri(refreshUrl)
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("Authorization", "Bearer " + refreshToken)
                            .retrieve()
                            .bodyToMono(RefreshTokenResponse.class)
                            .doOnSuccess(response -> log.info("Token refreshed successfully"))
                            .doOnError(error -> log.error("Token refresh failed: {}", error.getMessage()));
                });
    }

    private Mono<String> getAuthServiceUrl() {
        return routeLocator.getRoutes()
                .filter(route -> "auth-service".equals(route.getId()))
                .next()
                .map(route -> {
                    String baseUrl = route.getUri().toString();
                    log.debug("Discovered auth-service URL for refresh: {}", baseUrl);
                    return baseUrl;
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Auth service route not found for token refresh")));
    }
}