package com.socialw.gateway.filter;

import com.socialw.gateway.model.TokenVerificationRequest;
import com.socialw.gateway.model.TokenVerificationResponse;
import com.socialw.gateway.service.TokenRefreshService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final WebClient webClient;
    private final RouteLocator routeLocator;
    private final TokenRefreshService tokenRefreshService;

    private final List<String> excludedPaths = List.of(
            "/auth/",
            "/verify-token",
            "/refresh",
            "/health",
            "/"
    );

    public JwtAuthenticationFilter(WebClient webClient, RouteLocator routeLocator, TokenRefreshService tokenRefreshService) {
        this.webClient = webClient;
        this.routeLocator = routeLocator;
        this.tokenRefreshService = tokenRefreshService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Пропускаем исключенные пути
        if (excludedPaths.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Missing or invalid Authorization header for path: {}", path);
            return unauthorizedResponse(exchange, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        String refreshToken = extractRefreshToken(exchange);

        return getAuthServiceUrl()
                .flatMap(authServiceUrl -> verifyToken(token, authServiceUrl)
                        .flatMap(verificationResponse -> {
                            if (verificationResponse.isValid()) {
                                // Токен валиден - пропускаем запрос
                                return processValidToken(exchange, chain, verificationResponse);
                            } else if (refreshToken != null) {
                                // Токен невалиден, но есть refresh token - пробуем обновить
                                log.info("Access token expired, attempting refresh...");
                                return attemptTokenRefresh(exchange, chain, refreshToken, authServiceUrl);
                            } else {
                                // Токен невалиден и нет refresh token
                                log.warn("Token validation failed and no refresh token available for path: {}", path);
                                return unauthorizedResponse(exchange, "Token validation failed");
                            }
                        })
                )
                .onErrorResume(throwable -> {
                    log.error("Authentication error for path {}: {}", path, throwable.getMessage());
                    return unauthorizedResponse(exchange, "Authentication service unavailable");
                });
    }

    private Mono<Void> processValidToken(ServerWebExchange exchange, GatewayFilterChain chain, TokenVerificationResponse verificationResponse) {
        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header("X-User-UUID", verificationResponse.getUser_uuid())
                .header("X-User-Login", verificationResponse.getLogin())
                .header("X-User-Role", verificationResponse.getRole())
                .header("X-Token-Expires-At", String.valueOf(verificationResponse.getExpires_at()))
                .build();

        log.debug("User authenticated: {} ({})", verificationResponse.getLogin(), verificationResponse.getUser_uuid());
        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private Mono<Void> attemptTokenRefresh(ServerWebExchange exchange, GatewayFilterChain chain, String refreshToken, String authServiceUrl) {
        return tokenRefreshService.refreshToken(refreshToken)
                .flatMap(refreshResponse -> {
                    // Успешно обновили токены
                    String newAccessToken = refreshResponse.getAccess_token();
                    String newRefreshToken = refreshResponse.getRefresh_token();

                    log.info("Tokens refreshed successfully");

                    // Добавляем новые токены в заголовки ответа для клиента
                    ServerHttpResponse response = exchange.getResponse();
                    response.getHeaders().add("X-New-Access-Token", newAccessToken);
                    response.getHeaders().add("X-New-Refresh-Token", newRefreshToken);

                    // Получаем информацию о пользователе из нового access token
                    return verifyToken(newAccessToken, authServiceUrl)
                            .flatMap(verificationResponse -> {
                                if (verificationResponse.isValid()) {
                                    // Продолжаем исходный запрос с новым токеном
                                    ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                                            .header("X-User-UUID", verificationResponse.getUser_uuid())
                                            .header("X-User-Login", verificationResponse.getLogin())
                                            .header("X-User-Role", verificationResponse.getRole())
                                            .header("X-Token-Expires-At", String.valueOf(verificationResponse.getExpires_at()))
                                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + newAccessToken) // Обновляем Authorization header
                                            .build();

                                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                                } else {
                                    log.error("Newly refreshed token is invalid");
                                    return unauthorizedResponse(exchange, "Token refresh failed");
                                }
                            });
                })
                .onErrorResume(throwable -> {
                    log.error("Token refresh failed: {}", throwable.getMessage());
                    return unauthorizedResponse(exchange, "Token refresh failed");
                });
    }

    private String extractRefreshToken(ServerWebExchange exchange) {
        // Ищем refresh token в разных местах:

        // 1. В специальном заголовке
        String refreshHeader = exchange.getRequest().getHeaders().getFirst("X-Refresh-Token");
        if (refreshHeader != null && refreshHeader.startsWith("Bearer ")) {
            return refreshHeader.substring(7);
        }

        // 2. В cookies
        String refreshCookie = exchange.getRequest().getCookies().getFirst("refresh_token") != null
                ? exchange.getRequest().getCookies().getFirst("refresh_token").getValue()
                : null;

        return refreshCookie;
    }

    private Mono<String> getAuthServiceUrl() {
        return routeLocator.getRoutes()
                .filter(route -> "auth-service".equals(route.getId()))
                .next()
                .map(route -> {
                    String baseUrl = route.getUri().toString();
                    log.debug("Discovered auth-service URL: {}", baseUrl);
                    return baseUrl;
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Auth service route not found")));
    }

    private Mono<TokenVerificationResponse> verifyToken(String token, String authServiceBaseUrl) {
        String verifyUrl = authServiceBaseUrl + "/verify-token";

        return webClient.post()
                .uri(verifyUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new TokenVerificationRequest(token))
                .retrieve()
                .bodyToMono(TokenVerificationResponse.class)
                .doOnError(error -> log.error("Failed to verify token: {}", error.getMessage()));
    }

    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("X-Auth-Redirect", "http://localhost:5173/auth");
        exchange.getResponse().getHeaders().add("X-Auth-Error", message);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}