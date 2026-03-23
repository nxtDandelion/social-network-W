package com.socialw.search.integration;

import com.github.tomakehurst.wiremock.client.WireMock;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.containers.*;
import org.testcontainers.containers.output.Slf4jLogConsumer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.elasticsearch.ElasticsearchContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import redis.clients.jedis.Jedis;

import java.sql.*;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class PostSearchIntegrationTest {

    private static final Network network = Network.newNetwork();

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("postdb")
            .withUsername("test")
            .withPassword("test")
            .withNetwork(network)
            .withNetworkAliases("postgres")
            .waitingFor(Wait.forListeningPort());

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
            .withNetwork(network)
            .withNetworkAliases("redis")
            .withExposedPorts(6379)
            .waitingFor(Wait.forListeningPort())
            .withLogConsumer(new Slf4jLogConsumer(LoggerFactory.getLogger("redis")));

    @Container
    static RabbitMQContainer rabbitMQ = new RabbitMQContainer("rabbitmq:3-management")
            .withNetwork(network)
            .withNetworkAliases("rabbitmq")
            .withExposedPorts(5672, 15672)
            .withLogConsumer(new Slf4jLogConsumer(LoggerFactory.getLogger("rabbitmq")));

    @Container
    static ElasticsearchContainer elasticsearch = new ElasticsearchContainer(
            "docker.elastic.co/elasticsearch/elasticsearch:8.10.2")
            .withNetwork(network)
            .withNetworkAliases("elasticsearch")
            .withEnv("discovery.type", "single-node")
            .withEnv("xpack.security.enabled", "false")
            .withEnv("xpack.security.enrollment.enabled", "false")
            .withEnv("xpack.security.http.ssl.enabled", "false")
            .withEnv("xpack.security.transport.ssl.enabled", "false")
            .withEnv("ingest.geoip.downloader.enabled", "false")
            .withExposedPorts(9200)
            .withLogConsumer(new Slf4jLogConsumer(LoggerFactory.getLogger("elasticsearch")))
            .waitingFor(Wait.forHttp("/")
                    .forPort(9200)
                    .forStatusCode(200)
                    .withStartupTimeout(Duration.ofMinutes(3)));

    @Container
    static GenericContainer<?> wiremock = new GenericContainer<>("wiremock/wiremock:latest")
            .withNetwork(network)
            .withNetworkAliases("wiremock")
            .withExposedPorts(8080)
            .waitingFor(Wait.forHttp("/__admin").forPort(8080));

    @Container
    static GenericContainer<?> postService = new GenericContainer<>("socialw/post-service:latest")
            .withNetwork(network)
            .withNetworkAliases("post-service")
            .dependsOn(postgres, rabbitMQ, wiremock)
            .withEnv("DATABASE_URL", "postgresql+asyncpg://test:test@postgres:5432/postdb")
            .withEnv("RABBITMQ_HOST", "rabbitmq")
            .withEnv("RABBITMQ_PORT", "5672")
            .withEnv("RABBITMQ_USER", "guest")
            .withEnv("RABBITMQ_PASSWORD", "guest")
            .withEnv("PROFILE_SERVICE_URL", "http://wiremock:8080")
            .withEnv("PORT", "8002")
            .withExposedPorts(8002)
            .waitingFor(Wait.forLogMessage(".*Application startup complete.*", 1)
                    .withStartupTimeout(Duration.ofMinutes(3)))
            .withLogConsumer(new Slf4jLogConsumer(LoggerFactory.getLogger("post-service")));

    @LocalServerPort
    private int searchServicePort;

    @Autowired
    private TestRestTemplate restTemplate;

    private String postServiceBaseUrl;

    private String generateProfileId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    @BeforeEach
    void setUp() {
        postServiceBaseUrl = "http://" + postService.getHost() + ":" + postService.getMappedPort(8002);
        System.out.println("Post service base URL: " + postServiceBaseUrl);

        await().atMost(10, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1)).ignoreExceptions()
                .untilAsserted(() -> {
                    ResponseEntity<String> response = restTemplate.getForEntity(postServiceBaseUrl + "/", String.class);
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
                });

        WireMock.configureFor("localhost", wiremock.getMappedPort(8080));
        WireMock.reset();
    }

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        System.out.println("RabbitMQ mapped port: " + rabbitMQ.getMappedPort(5672));
        System.out.println("Elasticsearch mapped port: " + elasticsearch.getMappedPort(9200));
        System.out.println("Redis mapped port: " + redis.getMappedPort(6379));

        String esUri = "http://localhost:" + elasticsearch.getMappedPort(9200);
        await().atMost(30, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1)).untilAsserted(() -> {
            RestTemplate template = new RestTemplate();
            ResponseEntity<String> response = template.getForEntity(esUri, String.class);
            assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        });
        System.out.println("Elasticsearch is ready at " + esUri);

        await().atMost(15, TimeUnit.SECONDS).pollInterval(Duration.ofMillis(500)).untilAsserted(() -> {
            for (int i = 0; i < 3; i++) {
                try (Jedis jedis = new Jedis(redis.getHost(), redis.getMappedPort(6379))) {
                    String pong = jedis.ping();
                    assertThat(pong).isEqualTo("PONG");
                }
                Thread.sleep(100);
            }
        });
        System.out.println("Redis is ready and stable at " + redis.getHost() + ":" + redis.getMappedPort(6379));

        registry.add("spring.rabbitmq.host", rabbitMQ::getHost);
        registry.add("spring.rabbitmq.port", () -> String.valueOf(rabbitMQ.getMappedPort(5672)));
        registry.add("spring.elasticsearch.uris", () -> esUri);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> String.valueOf(redis.getMappedPort(6379)));
    }

    static {
        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("PostgreSQL JDBC Driver not found. Add dependency 'org.postgresql:postgresql' to test scope.", e);
        }
    }

    private void createProfileInDb(String profileId) {
        String jdbcUrl = postgres.getJdbcUrl();

        String username = "user_" + profileId.substring(0, 8);
        String sql = "INSERT INTO profile (uuid, username) VALUES (?, ?) ON CONFLICT (uuid) DO NOTHING";
        try (Connection conn = DriverManager.getConnection(jdbcUrl, postgres.getUsername(), postgres.getPassword());
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, profileId);
            stmt.setString(2, username);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to create profile", e);
        }
    }

    private ResponseEntity<String> createPost(String text, String profileId) {
        Map<String, Object> body = new HashMap<>();
        body.put("text", text);
        body.put("profile_id", profileId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.postForEntity(postServiceBaseUrl + "/", entity, String.class);
    }

    private ResponseEntity<String> updatePost(Integer postId, String newText, String profileId) {
        Map<String, Object> body = new HashMap<>();
        body.put("text", newText);
        body.put("profile_id", profileId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange(postServiceBaseUrl + "/" + postId, HttpMethod.PUT, entity, String.class);
    }

    private void deletePost(Integer postId, String profileId) {
        restTemplate.delete(postServiceBaseUrl + "/" + postId + "?profile_id=" + profileId);
    }

    private Integer extractPostId(ResponseEntity<String> response) {
        return com.jayway.jsonpath.JsonPath.parse(response.getBody()).read("$.id", Integer.class);
    }

    @Test
    void INT08_createPostIndexedInSearch() {
        System.out.println(">>> Running test: INT08_createPostIndexedInSearch");
        String uniqueWord = "unique_" + UUID.randomUUID();
        String profileId = generateProfileId();
        createProfileInDb(profileId);

        ResponseEntity<String> createResponse = createPost(uniqueWord, profileId);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        await().atMost(10, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    String searchUrl = "http://localhost:" + searchServicePort + "/?query=" + uniqueWord + "&exact=true";
                    ResponseEntity<String> searchResponse = restTemplate.getForEntity(searchUrl, String.class);
                    assertThat(searchResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
                    List<Map<String, Object>> results = com.jayway.jsonpath.JsonPath.parse(searchResponse.getBody()).read("$.results");
                    assertThat(results).anyMatch(r -> uniqueWord.equals(r.get("text")));
                });
    }

    @Test
    void INT09_updatePostUpdatesSearch() {
        System.out.println(">>> Running test: INT09_updatePostUpdatesSearch");
        String originalWord = "original_" + UUID.randomUUID();
        String updatedWord = "updated_" + UUID.randomUUID();
        String profileId = generateProfileId();
        createProfileInDb(profileId);

        ResponseEntity<String> createResponse = createPost(originalWord, profileId);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        Integer postId = extractPostId(createResponse);

        await().atMost(10, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    String searchUrl = "http://localhost:" + searchServicePort + "/?query=" + originalWord + "&exact=true";
                    ResponseEntity<String> searchResponse = restTemplate.getForEntity(searchUrl, String.class);
                    assertThat(searchResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
                    List<Map<String, Object>> results = com.jayway.jsonpath.JsonPath.parse(searchResponse.getBody()).read("$.results");
                    assertThat(results).anyMatch(r -> originalWord.equals(r.get("text")));
                });

        ResponseEntity<String> updateResponse = updatePost(postId, updatedWord, profileId);
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        await().atMost(10, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    String searchNewUrl = "http://localhost:" + searchServicePort + "/?query=" + updatedWord + "&exact=true";
                    ResponseEntity<String> searchNewResponse = restTemplate.getForEntity(searchNewUrl, String.class);
                    assertThat(searchNewResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
                    List<Map<String, Object>> resultsNew = com.jayway.jsonpath.JsonPath.parse(searchNewResponse.getBody()).read("$.results");
                    assertThat(resultsNew).anyMatch(r -> updatedWord.equals(r.get("text")));

                    String searchOldUrl = "http://localhost:" + searchServicePort + "/?query=" + originalWord + "&exact=true";
                    ResponseEntity<String> searchOldResponse = restTemplate.getForEntity(searchOldUrl, String.class);
                    if (searchOldResponse.getStatusCode() == HttpStatus.NOT_FOUND) {
                        return;
                    }
                    List<Map<String, Object>> resultsOld = com.jayway.jsonpath.JsonPath.parse(searchOldResponse.getBody()).read("$.results");
                    assertThat(resultsOld).noneMatch(r -> originalWord.equals(r.get("text")));
                });
    }

    @Test
    void INT10_deletePostRemovesFromSearch() {
        System.out.println(">>> Running test: INT10_deletePostRemovesFromSearch");
        String uniqueWord = "delete_" + UUID.randomUUID();
        String profileId = generateProfileId();
        createProfileInDb(profileId);

        ResponseEntity<String> createResponse = createPost(uniqueWord, profileId);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        Integer postId = extractPostId(createResponse);

        await().atMost(10, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    String searchUrl = "http://localhost:" + searchServicePort + "/?query=" + uniqueWord + "&exact=true";
                    ResponseEntity<String> searchResponse = restTemplate.getForEntity(searchUrl, String.class);
                    assertThat(searchResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
                    List<Map<String, Object>> results = com.jayway.jsonpath.JsonPath.parse(searchResponse.getBody()).read("$.results");
                    assertThat(results).anyMatch(r -> uniqueWord.equals(r.get("text")));
                });

        deletePost(postId, profileId);

        await().atMost(10, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    String searchUrl = "http://localhost:" + searchServicePort + "/?query=" + uniqueWord + "&exact=true";
                    ResponseEntity<String> searchResponse = restTemplate.getForEntity(searchUrl, String.class);
                    if (searchResponse.getStatusCode() == HttpStatus.NOT_FOUND) {
                        return;
                    }
                    List<Map<String, Object>> results = com.jayway.jsonpath.JsonPath.parse(searchResponse.getBody()).read("$.results");
                    assertThat(results).noneMatch(r -> uniqueWord.equals(r.get("text")));
                });
    }

    @Test
    void INT11_createPostWithNonExistingAuthor_Returns400_AndNoEvent() {
        System.out.println(">>> Running test: INT11_createPostWithNonExistingAuthor_Returns400_AndNoEvent");
        String nonExistingProfileId = generateProfileId();

        WireMock.stubFor(WireMock.get(WireMock.urlEqualTo("/profiles/" + nonExistingProfileId))
                .willReturn(WireMock.aResponse().withStatus(404)));

        String uniqueWord = "nonexistent_" + UUID.randomUUID();
        ResponseEntity<String> createResponse = createPost(uniqueWord, nonExistingProfileId);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);

        await().atMost(5, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    String searchUrl = "http://localhost:" + searchServicePort + "/?query=" + uniqueWord + "&exact=true";
                    ResponseEntity<String> searchResponse = restTemplate.getForEntity(searchUrl, String.class);
                    if (searchResponse.getStatusCode() == HttpStatus.NOT_FOUND) {
                        return;
                    }
                    List<Map<String, Object>> results = com.jayway.jsonpath.JsonPath.parse(searchResponse.getBody()).read("$.results");
                    assertThat(results).noneMatch(r -> uniqueWord.equals(r.get("text")));
                });
    }

    @Test
    void INT12_createPostWithExceedingLimit_Returns400_AndNoEvent() {
        System.out.println(">>> Running test: INT12_createPostWithExceedingLimit_Returns400_AndNoEvent");
        String uniqueFragment = "fragment_" + UUID.randomUUID();
        String longText = "a".repeat(1001) + uniqueFragment;
        String profileId = generateProfileId();
        createProfileInDb(profileId);

        ResponseEntity<String> createResponse = createPost(longText, profileId);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);

        await().atMost(5, TimeUnit.SECONDS).pollInterval(Duration.ofSeconds(1))
                .untilAsserted(() -> {
                    String searchUrl = "http://localhost:" + searchServicePort + "/?query=" + uniqueFragment + "&exact=true";
                    ResponseEntity<String> searchResponse = restTemplate.getForEntity(searchUrl, String.class);
                    if (searchResponse.getStatusCode() == HttpStatus.NOT_FOUND) {
                        return;
                    }
                    List<Map<String, Object>> results = com.jayway.jsonpath.JsonPath.parse(searchResponse.getBody()).read("$.results");
                    assertThat(results).noneMatch(r -> ((String) r.get("text")).contains(uniqueFragment));
                });
    }
}
