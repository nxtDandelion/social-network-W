package com.socialw.gateway.integration;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class GatewayIntegrationTest {

    private static WireMockServer wireMockServer;

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private RouteLocator routeLocator;

    private final String validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    private final String userUuid = "123e4567-e89b-12d3-a456-426614174000";

    static {
        wireMockServer = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMockServer.start();
        WireMock.configureFor("localhost", wireMockServer.port());
    }

    @BeforeEach
    void setUp() {
        WireMock.reset();

        stubFor(post(urlEqualTo("/verify-token"))
                .withHeader("Content-Type", containing("application/json"))
                .withRequestBody(containing(validToken))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"valid\": true, \"user_uuid\": \"" + userUuid + "\", \"login\": \"testuser\"}")));

        stubFor(post(urlEqualTo("/verify-token"))
                .withHeader("Content-Type", containing("application/json"))
                .withRequestBody(not(containing(validToken)))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"valid\": false}")));

        stubFor(post(urlEqualTo("/posts"))
                .withHeader("Content-Type", containing("application/json"))
                .withRequestBody(containing("\"profile_id\":\"" + userUuid + "\""))
                .willReturn(aResponse()
                        .withStatus(201)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"id\": 1, \"text\": \"test post\", \"profile_id\": \"" + userUuid + "\"}")));

        stubFor(get(urlPathEqualTo("/search"))
                .withQueryParam("q", equalTo("test"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"results\": []}")));
    }

    @AfterAll
    static void tearDown() {
        wireMockServer.stop();
    }

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        String wireMockUrl = "http://localhost:" + wireMockServer.port();

        // Маршрут для постов (POST /post/posts → /posts)
        registry.add("spring.cloud.gateway.routes[0].id", () -> "posts_route");
        registry.add("spring.cloud.gateway.routes[0].uri", () -> wireMockUrl);
        registry.add("spring.cloud.gateway.routes[0].predicates[0]", () -> "Path=/post/posts");
        registry.add("spring.cloud.gateway.routes[0].filters[0]", () -> "StripPrefix=1");

        // Маршрут для поиска (GET /search?q=... → /search?q=...)
        registry.add("spring.cloud.gateway.routes[1].id", () -> "search-service");
        registry.add("spring.cloud.gateway.routes[1].uri", () -> wireMockUrl);
        registry.add("spring.cloud.gateway.routes[1].predicates[0]", () -> "Path=/search/**");
        // Без фильтра StripPrefix – чтобы путь оставался /search

        // Маршрут для проверки токена (POST /verify-token)
        registry.add("spring.cloud.gateway.routes[2].id", () -> "auth-service");
        registry.add("spring.cloud.gateway.routes[2].uri", () -> wireMockUrl);
        registry.add("spring.cloud.gateway.routes[2].predicates[0]", () -> "Path=/verify-token");
    }

    @Test
    void INT17_accessToProtectedResourceWithValidToken_shouldSucceed() {
        webTestClient.post()
                .uri("/post/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"text\": \"test post\"}")
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.id").isEqualTo(1)
                .jsonPath("$.profile_id").isEqualTo(userUuid);
    }

    @Test
    void INT17_accessToProtectedResourceWithoutToken_shouldReturn401() {
        webTestClient.post()
                .uri("/post/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"text\": \"test post\"}")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().valueEquals("X-Auth-Redirect", "http://localhost:5173/auth")
                .expectHeader().valueEquals("X-Auth-Error", "JWT token required in Authorization header");
    }

    @Test
    void INT17_accessToProtectedResourceWithInvalidToken_shouldReturn401() {
        webTestClient.post()
                .uri("/post/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.token.here")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue("{\"text\": \"test post\"}")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().valueEquals("X-Auth-Redirect", "http://localhost:5173/auth")
                .expectHeader().valueEquals("X-Auth-Error", "Token validation failed");
    }

    @Test
    void INT18_accessToPublicResourceWithoutToken_shouldSucceed() {
        webTestClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search")
                        .queryParam("q", "test")
                        .build())
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.results").exists();
    }

    @Test
    void INT19_requestToNonExistentEndpoint_shouldReturn404() {
        webTestClient.get()
                .uri("/nonexistent")
                .exchange()
                .expectStatus().isNotFound();
    }
}