package com.socialw.gateway.filter;

import com.socialw.gateway.model.TokenVerificationRequest;
import com.socialw.gateway.model.TokenVerificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final WebClient webClient;
    private final RouteLocator routeLocator;

    // Более строгие проверки путей
    private final Set<String> excludedExactPaths = Set.of(
            "/health",
            "/"
    );

    private final Set<String> excludedPrefixes = Set.of(
            "/auth/",
            "/verify-token",
            "/refresh"
    );

    public JwtAuthenticationFilter(WebClient webClient, RouteLocator routeLocator) {
        this.webClient = webClient;
        this.routeLocator = routeLocator;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        log.debug("Checking authentication for {} {}", method, path);

        // Пропускаем исключенные пути
        if (isExcludedPath(path)) {
            log.debug("Path {} is excluded from authentication", path);
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // Детальная проверка Authorization header
        if (authHeader == null) {
            log.warn("Missing Authorization header for {} {}", method, path);
            return unauthorizedResponse(exchange, "Missing Authorization header");
        }

        if (!authHeader.startsWith("Bearer ")) {
            log.warn("Invalid Authorization header format for {} {}", method, path);
            return unauthorizedResponse(exchange, "Invalid Authorization header format");
        }

        String token = authHeader.substring(7);

        if (token.isBlank()) {
            log.warn("Empty token in Authorization header for {} {}", method, path);
            return unauthorizedResponse(exchange, "Empty token");
        }

        return getAuthServiceUrl()
                .flatMap(authServiceUrl -> verifyToken(token, authServiceUrl))
                .flatMap(verificationResponse -> {
                    if (verificationResponse.isValid()) {
                        log.info("User authenticated: {} for path {}", verificationResponse.getLogin(), path);
                        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                                .header("X-User-UUID", verificationResponse.getUser_uuid())
                                .header("X-User-Login", verificationResponse.getLogin())
                                .header("X-User-Role", verificationResponse.getRole())
                                .header("X-Token-Expires-At", String.valueOf(verificationResponse.getExpires_at()))
                                .build();

                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    } else {
                        log.warn("Token validation failed for {} {}", method, path);
                        return unauthorizedResponse(exchange, "Token validation failed");
                    }
                })
                .onErrorResume(throwable -> {
                    log.error("Token verification error for {} {}: {}", method, path, throwable.getMessage());
                    return unauthorizedResponse(exchange, "Authentication service unavailable");
                });
    }

    private boolean isExcludedPath(String path) {
        // Точное совпадение
        if (excludedExactPaths.contains(path)) {
            return true;
        }

        // Совпадение по префиксу (более строгая проверка)
        for (String prefix : excludedPrefixes) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }

        return false;
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

        log.debug("Verifying token with auth service: {}", verifyUrl);

        return webClient.post()
                .uri(verifyUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new TokenVerificationRequest(token))
                .retrieve()
                .bodyToMono(TokenVerificationResponse.class)
                .doOnError(error -> log.error("Failed to verify token: {}", error.getMessage()));
    }

    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String message) {
        log.warn("Returning 401 Unauthorized: {}", message);
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