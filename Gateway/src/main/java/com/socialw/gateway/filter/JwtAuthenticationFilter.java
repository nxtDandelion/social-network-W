package com.socialw.gateway.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.socialw.gateway.model.TokenVerificationRequest;
import com.socialw.gateway.model.TokenVerificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Set;

@Slf4j
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final WebClient webClient;
    private final RouteLocator routeLocator;
    private final ObjectMapper objectMapper;

    // Пути, которые НЕ требуют авторизации вообще (для любых HTTP методов)
    private final Set<String> excludedAnyMethodPaths = Set.of(
            "/health", "/auth/", "/verify-token", "/refresh"
    );

     // Паттерны путей, которые не требуют авторизации (только для GET запросов)
        private final Set<String> excludedGetPatterns = Set.of(
                "^/post/feed$",
                "^/post/[^/]+/comments$",           // /post/{id_post}/comments
                "^/profile/[^/]+$",                 // /profile/{username}
                "^/search$",                        // /search
                "^/search/hashtag$",                // /search/hashtag
                "^/post/[^/]+$"                    // /post/{id_post}
        );

    public JwtAuthenticationFilter(WebClient webClient, RouteLocator routeLocator, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.routeLocator = routeLocator;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        log.debug("Checking authentication for {} {}", method, path);

        if (isExcludedPath(path, method)) {
            log.debug("Path {} excluded from authentication for method {}", path, method);
            return chain.filter(exchange);
        }

        String token = extractTokenFromHeader(exchange.getRequest());

        if (token == null || token.isBlank()) {
            log.warn("No JWT token found in Authorization header for {}: {}", method, path);
            return unauthorizedResponse(exchange, "JWT token required in Authorization header");
        }

        return verifyAndProcessToken(exchange, chain, token, method);
    }

    private Mono<Void> verifyAndProcessToken(ServerWebExchange exchange, GatewayFilterChain chain,
                                             String token, String method) {
        return getAuthServiceUrl()
                .flatMap(authUrl -> webClient.post()
                        .uri(authUrl + "/verify-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(new TokenVerificationRequest(token))
                        .retrieve()
                        .bodyToMono(TokenVerificationResponse.class))
                .flatMap(response -> {
                    if (response.isValid()) {
                        log.info("User authenticated: {}", response.getLogin());
                        return createModifiedRequest(exchange, chain, response.getUser_uuid(), method);
                    } else {
                        return unauthorizedResponse(exchange, "Token validation failed");
                    }
                })
                .onErrorResume(e -> {
                    log.error("Token verification error: {}", e.getMessage());
                    return unauthorizedResponse(exchange, "Authentication service unavailable");
                });
    }

    private Mono<Void> createModifiedRequest(ServerWebExchange exchange, GatewayFilterChain chain,
                                             String userUuid, String method) {
        try {
            if ("GET".equalsIgnoreCase(method)) {
                log.debug("GET request, passing through without modifications");
                return chain.filter(exchange);
            }

            return readRequestBody(exchange)
                    .flatMap(body -> {
                        try {
                            String modifiedBody;

                            if (body.isEmpty()) {
                                modifiedBody = "{\"profile_id\":\"" + userUuid + "\"}";
                                log.debug("Created new body with profile_id={}", userUuid);
                            } else {
                                JsonNode jsonNode = objectMapper.readTree(body);
                                modifiedBody = modifyBodyWithProfileId(jsonNode, userUuid);
                                log.debug("Modified existing body with profile_id={}", userUuid);
                            }

                            ServerHttpRequest newRequest = createRequestWithBody(exchange.getRequest(), modifiedBody);
                            return chain.filter(exchange.mutate().request(newRequest).build());
                        } catch (Exception e) {
                            log.error("Error modifying request body: {}", e.getMessage());
                            String simpleBody = "{\"profile_id\":\"" + userUuid + "\"}";
                            ServerHttpRequest newRequest = createRequestWithBody(exchange.getRequest(), simpleBody);
                            return chain.filter(exchange.mutate().request(newRequest).build());
                        }
                    })
                    .switchIfEmpty(Mono.defer(() -> {
                        String simpleBody = "{\"profile_id\":\"" + userUuid + "\"}";
                        ServerHttpRequest newRequest = createRequestWithBody(exchange.getRequest(), simpleBody);
                        log.debug("Created new body with profile_id={} for empty request", userUuid);
                        return chain.filter(exchange.mutate().request(newRequest).build());
                    }));
        } catch (Exception e) {
            log.error("Failed to create modified request: {}", e.getMessage());
            return unauthorizedResponse(exchange, "Failed to process request");
        }
    }

    private String modifyBodyWithProfileId(JsonNode jsonNode, String userUuid) throws Exception {
        if (!jsonNode.isObject()) {
            throw new IllegalArgumentException("Request body must be a JSON object");
        }

        ObjectNode objectNode = (ObjectNode) jsonNode;
        objectNode.put("profile_id", userUuid);

        String result = objectMapper.writeValueAsString(objectNode);
        log.debug("Modified body: {}", result);
        return result;
    }

    private Mono<String> readRequestBody(ServerWebExchange exchange) {
        return DataBufferUtils.join(exchange.getRequest().getBody())
                .map(dataBuffer -> {
                    try {
                        byte[] bytes = new byte[dataBuffer.readableByteCount()];
                        dataBuffer.read(bytes);
                        DataBufferUtils.release(dataBuffer);
                        String body = new String(bytes, StandardCharsets.UTF_8);
                        log.debug("Original request body: {}", body);
                        return body;
                    } catch (Exception e) {
                        DataBufferUtils.release(dataBuffer);
                        return "";
                    }
                })
                .defaultIfEmpty("");
    }

    private ServerHttpRequest createRequestWithBody(ServerHttpRequest request, String body) {
        return new ServerHttpRequestDecorator(request) {
            @Override
            public Flux<DataBuffer> getBody() {
                byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
                DataBuffer buffer = new DefaultDataBufferFactory().wrap(bytes);
                return Flux.just(buffer);
            }

            @Override
            public HttpHeaders getHeaders() {
                HttpHeaders headers = new HttpHeaders();
                headers.putAll(super.getHeaders());

                byte[] bodyBytes = body.getBytes(StandardCharsets.UTF_8);
                headers.setContentLength(bodyBytes.length);

                headers.setContentType(new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8));

                return headers;
            }
        };
    }


    private String extractTokenFromHeader(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return token.isBlank() ? null : token;
        }
        return null;
    }

    private Mono<String> getAuthServiceUrl() {
        return routeLocator.getRoutes()
                .filter(route -> "auth-service".equals(route.getId()))
                .next()
                .map(route -> route.getUri().toString())
                .switchIfEmpty(Mono.error(new RuntimeException("Auth service route not found")));
    }

    private boolean isExcludedPath(String path, String method) {
        if (excludedAnyMethodPaths.stream().anyMatch(excluded -> {
            if (excluded.endsWith("/")) {
                return path.startsWith(excluded);
            } else {
                return path.equals(excluded) || path.startsWith(excluded + "/");
            }
        })) {
            return true;
        }

        if (!"GET".equalsIgnoreCase(method)) {
            return false;
        }

        return excludedGetPatterns.stream().anyMatch(pattern -> path.matches(pattern));
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