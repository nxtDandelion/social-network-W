package com.socialw.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialw.gateway.model.TokenVerificationResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private RouteLocator routeLocator;

    @Mock
    private Route route;

    private JwtAuthenticationFilter filter;
    private WebClient webClient;
    private ExchangeFunction exchangeFunction;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        exchangeFunction = mock(ExchangeFunction.class);
        webClient = WebClient.builder()
                .exchangeFunction(exchangeFunction)
                .build();

        filter = new JwtAuthenticationFilter(webClient, routeLocator, objectMapper);
    }

    @ParameterizedTest
    @MethodSource("excludedPathsProvider")
    void filter_shouldSkipExcludedPaths(String path, String method) {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.valueOf(method), path)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act & Assert
        StepVerifier.create(filter.filter(exchange, (e) -> Mono.empty()))
                .verifyComplete();
    }

    private static Stream<Arguments> excludedPathsProvider() {
        return Stream.of(
                Arguments.of("/auth/login", "POST"),
                Arguments.of("/auth/register", "POST"),
                Arguments.of("/auth/refresh", "POST"),
                Arguments.of("/verify-token", "POST"),
                Arguments.of("/refresh", "POST"),
                Arguments.of("/post/feed", "GET"),
                Arguments.of("/post/123/comments", "GET"),
                Arguments.of("/profile/username", "GET"),
                Arguments.of("/search", "GET"),
                Arguments.of("/search/hashtag", "GET"),
                Arguments.of("/post/456", "GET")
        );
    }

    @Test
    void filter_shouldProcessValidTokenForGetRequest() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/secure/get-endpoint")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://auth-service"));

        // Создаем полноценный мок ClientResponse
        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        // Настраиваем ответ
        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-123");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        // Act & Assert
        StepVerifier.create(filter.filter(exchange, (e) -> Mono.empty()))
                .verifyComplete();

        // Verify that WebClient was called
        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldModifyRequestBodyForPostWithJsonBody() throws Exception {
        // Arrange
        String requestBody = "{\"title\":\"Test Post\",\"content\":\"Hello World\"}";
        byte[] bodyBytes = requestBody.getBytes(StandardCharsets.UTF_8);
        DataBuffer dataBuffer = new DefaultDataBufferFactory().wrap(bodyBytes);

        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(Flux.just(dataBuffer));

        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://auth-service"));

        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-456");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        // Act & Assert - проверяем, что цепочка выполняется
        StepVerifier.create(filter.filter(exchange, (e) -> {
                    assertThat(e.getRequest().getHeaders().getContentType())
                            .isEqualTo(MediaType.APPLICATION_JSON);
                    return Mono.empty();
                }))
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldCreateBodyWhenEmptyForPostRequest() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();

        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://auth-service"));

        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));


        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-789");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        // Act & Assert
        StepVerifier.create(filter.filter(exchange, (e) -> {
                    return Mono.empty();
                }))
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldHandleInvalidJsonBody() throws Exception {
        // Arrange
        String invalidJson = "{invalid json}";
        byte[] bodyBytes = invalidJson.getBytes(StandardCharsets.UTF_8);
        DataBuffer dataBuffer = new DefaultDataBufferFactory().wrap(bodyBytes);

        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(Flux.just(dataBuffer));

        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://auth-service"));

        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-999");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        // Act & Assert
        StepVerifier.create(filter.filter(exchange, (e) -> {
                    return Mono.empty();
                }))
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldHandleArrayJsonBody() throws Exception {
        // Arrange
        String arrayJson = "[{\"name\":\"item1\"}, {\"name\":\"item2\"}]";
        byte[] bodyBytes = arrayJson.getBytes(StandardCharsets.UTF_8);
        DataBuffer dataBuffer = new DefaultDataBufferFactory().wrap(bodyBytes);

        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(Flux.just(dataBuffer));

        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://auth-service"));

        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-111");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        // Act & Assert
        StepVerifier.create(filter.filter(exchange, (e) -> {
                    return Mono.empty();
                }))
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldHandleNullAuthorizationHeader() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, (String) null)
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(filter.filter(exchange, (e) -> Mono.empty()))
                .expectComplete()
                .verify();

        // Assert
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(exchange.getResponse().getHeaders().getFirst("X-Auth-Error"))
                .contains("JWT token required");
    }

    @Test
    void filter_shouldHandleNonBearerToken() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNz")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(filter.filter(exchange, (e) -> Mono.empty()))
                .expectComplete()
                .verify();

        // Assert
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(exchange.getResponse().getHeaders().getFirst("X-Auth-Error"))
                .contains("JWT token required");
    }

    @Test
    void filter_shouldHandleEmptyBearerToken() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(filter.filter(exchange, (e) -> Mono.empty()))
                .expectComplete()
                .verify();

        // Assert
        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(exchange.getResponse().getHeaders().getFirst("X-Auth-Error"))
                .contains("JWT token required");
    }

    @Test
    void filter_shouldHandleGetForNonExcludedPath() {
        // Arrange - GET запрос на защищенный путь
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/secure")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://auth-service"));

        // Создаем полноценный мок ClientResponse
        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        // Настраиваем ответ
        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-222");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        // Act & Assert
        StepVerifier.create(filter.filter(exchange, (e) -> {
                    // GET запрос не должен модифицировать тело
                    return Mono.empty();
                }))
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldHandlePostForExcludedPatternButNotGet() {
        // Arrange - POST запрос на путь, который исключен только для GET
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/post/feed")  // Для GET исключен, для POST - нет
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://auth-service"));

        // Создаем полноценный мок ClientResponse
        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        // Настраиваем ответ
        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-333");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        // Act & Assert - должен пройти аутентификацию
        StepVerifier.create(filter.filter(exchange, (e) -> Mono.empty()))
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldHandleDifferentAuthServiceUrls() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://different-auth:8080"));

        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-444");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        // Act & Assert
        StepVerifier.create(filter.filter(exchange, (e) -> Mono.empty()))
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldHandleExceptionInCreateModifiedRequest() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create("http://auth-service"));

        // Создаем полноценный мок ClientResponse
        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);
        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        TokenVerificationResponse tokenResponse = new TokenVerificationResponse();
        tokenResponse.setValid(true);
        tokenResponse.setUser_uuid("test-uuid-555");
        tokenResponse.setLogin("testuser");

        when(clientResponse.bodyToMono(TokenVerificationResponse.class))
                .thenReturn(Mono.just(tokenResponse));

        MockServerHttpRequest faultyRequest = MockServerHttpRequest
                .post("/api/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .body(Flux.error(new RuntimeException("Body read error")));

        ServerWebExchange faultyExchange = MockServerWebExchange.from(faultyRequest);

        // Act & Assert
        StepVerifier.create(filter.filter(faultyExchange, (e) -> Mono.empty()))
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void filter_shouldSkipAuthPathsWithTrailingSlash() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/auth/any/subpath")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act & Assert
        StepVerifier.create(filter.filter(exchange, (e) -> Mono.empty()))
                .verifyComplete();
    }


    private ClientResponse createMockClientResponse(HttpStatus status) {
        ClientResponse clientResponse = mock(ClientResponse.class);

        when(clientResponse.statusCode()).thenReturn(status);

        return clientResponse;
    }
}