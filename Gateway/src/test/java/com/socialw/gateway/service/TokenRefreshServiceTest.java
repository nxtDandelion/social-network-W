package com.socialw.gateway.service;

import com.socialw.gateway.model.RefreshTokenResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.http.HttpStatus;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.URI;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenRefreshServiceTest {

    @Mock
    private RouteLocator routeLocator;

    @Mock
    private Route route;

    private TokenRefreshService tokenRefreshService;
    private WebClient webClient;
    private ExchangeFunction exchangeFunction;

    @BeforeEach
    void setUp() {
        // Создаем WebClient с моком ExchangeFunction
        exchangeFunction = mock(ExchangeFunction.class);
        webClient = WebClient.builder()
                .exchangeFunction(exchangeFunction)
                .build();

        tokenRefreshService = new TokenRefreshService(webClient, routeLocator);
    }

    @Test
    void refreshToken_shouldSuccessfullyRefreshToken() {
        // Arrange
        String refreshToken = "refresh-token";
        String authServiceUrl = "http://auth-service";

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create(authServiceUrl));

        // Создаем полноценный мок ClientResponse
        ClientResponse clientResponse = createMockClientResponse(HttpStatus.OK);

        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        // Настраиваем ответ
        RefreshTokenResponse expectedResponse = new RefreshTokenResponse();
        expectedResponse.setAccess_token("new-access-token");
        expectedResponse.setRefresh_token("new-refresh-token");
        expectedResponse.setToken_type("Bearer");

        when(clientResponse.bodyToMono(RefreshTokenResponse.class))
                .thenReturn(Mono.just(expectedResponse));

        // Act
        Mono<RefreshTokenResponse> result = tokenRefreshService.refreshToken(refreshToken);

        // Assert
        StepVerifier.create(result)
                .expectNextMatches(response ->
                        response.getAccess_token().equals("new-access-token") &&
                                response.getRefresh_token().equals("new-refresh-token")
                )
                .verifyComplete();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void refreshToken_shouldReturnErrorWhenAuthServiceNotFound() {
        // Arrange
        String refreshToken = "refresh-token";

        when(routeLocator.getRoutes()).thenReturn(Flux.empty());

        // Act
        Mono<RefreshTokenResponse> result = tokenRefreshService.refreshToken(refreshToken);

        // Assert
        StepVerifier.create(result)
                .expectErrorMatches(throwable ->
                        throwable instanceof RuntimeException &&
                                throwable.getMessage().contains("Auth service route not found")
                )
                .verify();

        verify(exchangeFunction, never()).exchange(any());
    }

    @Test
    void refreshToken_shouldHandleWebClientError() {
        // Arrange
        String refreshToken = "refresh-token";
        String authServiceUrl = "http://auth-service";

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create(authServiceUrl));

        // Настраиваем ошибку
        when(exchangeFunction.exchange(any()))
                .thenReturn(Mono.error(new RuntimeException("Network error")));

        // Act
        Mono<RefreshTokenResponse> result = tokenRefreshService.refreshToken(refreshToken);

        // Assert
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    @Test
    void refreshToken_shouldHandleHttpErrorResponse() {
        // Arrange
        String refreshToken = "refresh-token";
        String authServiceUrl = "http://auth-service";

        when(routeLocator.getRoutes()).thenReturn(Flux.just(route));
        when(route.getId()).thenReturn("auth-service");
        when(route.getUri()).thenReturn(URI.create(authServiceUrl));

        // Создаем мок ClientResponse с ошибкой 401
        ClientResponse clientResponse = createMockClientResponse(HttpStatus.UNAUTHORIZED);

        when(exchangeFunction.exchange(any())).thenReturn(Mono.just(clientResponse));

        // Настраиваем ответ с ошибкой
        when(clientResponse.bodyToMono(RefreshTokenResponse.class))
                .thenReturn(Mono.error(new RuntimeException("Unauthorized")));

        // Act
        Mono<RefreshTokenResponse> result = tokenRefreshService.refreshToken(refreshToken);

        // Assert
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();

        verify(exchangeFunction, times(1)).exchange(any());
    }

    private ClientResponse createMockClientResponse(HttpStatus status) {
        ClientResponse clientResponse = mock(ClientResponse.class);

        // Настраиваем обязательные методы ClientResponse
        when(clientResponse.statusCode()).thenReturn(status);



        return clientResponse;
    }
}