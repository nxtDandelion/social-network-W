package com.socialw.search.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialw.search.dto.PostWithProfileResponse;
import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.model.elastic.ProfileDocument;
import com.socialw.search.repository.elastic.PostRepository;
import com.socialw.search.repository.elastic.ProfileRepository;
import com.socialw.search.service.CacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
@DisplayName("SearchController Tests")
class SearchControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PostRepository postRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private CacheService cacheService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @InjectMocks
    private SearchController searchController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        searchController = new SearchController(postRepository, profileRepository, cacheService, redisTemplate, objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(searchController).build();
    }

    @Test
    @DisplayName("GET / - поиск постов с кэшированием")
    void searchPosts_withCache() throws Exception {
        // Arrange
        String query = "test";
        boolean exact = false;
        int page = 0;
        int size = 10;

        PostWithProfileResponse post1 = new PostWithProfileResponse();
        post1.setId(1);
        post1.setText("Test post 1");
        post1.setProfileId("user1");
        post1.setUsername("user1");

        List<PostWithProfileResponse> cachedResults = Arrays.asList(post1);
        Map<String, Object> cachedResponse = createSearchResponse(query, exact, cachedResults, page, size, true);

        when(cacheService.getSearchResult(eq(query), eq(exact), eq(page), eq(size)))
                .thenReturn(Optional.of(cachedResponse));

        // Act & Assert
        mockMvc.perform(get("/")
                        .param("query", query)
                        .param("exact", String.valueOf(exact))
                        .param("page", String.valueOf(page))
                        .param("size", String.valueOf(size)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query", is(query)))
                .andExpect(jsonPath("$.exact", is(exact)))
                .andExpect(jsonPath("$.results", hasSize(1)))
                .andExpect(jsonPath("$.cached", is(true)));
    }

    @Test
    @DisplayName("GET / - поиск постов без кэша (частичный поиск)")
    void searchPosts_withoutCache_partialSearch() throws Exception {
        // Arrange
        String query = "partial";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createDate"));

        List<PostDocument> posts = createTestPostDocuments();
        Page<PostDocument> postPage = new PageImpl<>(posts, pageable, posts.size());

        when(cacheService.getSearchResult(eq(query), eq(false), eq(0), eq(10)))
                .thenReturn(Optional.empty());
        when(postRepository.searchByPartialText(eq("*partial*"), any(Pageable.class)))
                .thenReturn(postPage);

        ProfileDocument profile1 = new ProfileDocument();
        profile1.setUuid("user1");
        profile1.setUsername("user1");
        when(profileRepository.findById("user1")).thenReturn(Optional.of(profile1));

        ProfileDocument profile2 = new ProfileDocument();
        profile2.setUuid("user2");
        profile2.setUsername("user2");
        when(profileRepository.findById("user2")).thenReturn(Optional.of(profile2));

        // Act & Assert
        mockMvc.perform(get("/")
                        .param("query", query)
                        .param("exact", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.query", is(query)))
                .andExpect(jsonPath("$.exact", is(false)))
                .andExpect(jsonPath("$.results", hasSize(2)))
                .andExpect(jsonPath("$.cached", is(false)));

        // Verify cache was saved
        verify(cacheService).saveSearchResult(eq(query), eq(false), eq(0), eq(10), anyMap(), anyList());
    }

    @Test
    @DisplayName("GET / - поиск постов без кэша (точный поиск)")
    void searchPosts_withoutCache_exactSearch() throws Exception {
        // Arrange
        String query = "exact";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createDate"));

        PostDocument post = new PostDocument();
        post.setId(3);
        post.setText("exact");
        post.setProfileId("user3");
        List<PostDocument> posts = Collections.singletonList(post);
        Page<PostDocument> postPage = new PageImpl<>(posts, pageable, 1);

        when(cacheService.getSearchResult(eq(query), eq(true), eq(0), eq(10)))
                .thenReturn(Optional.empty());
        when(postRepository.searchByText(eq(query), any(Pageable.class)))
                .thenReturn(postPage);

        ProfileDocument profile3 = new ProfileDocument();
        profile3.setUuid("user3");
        profile3.setUsername("user3");
        when(profileRepository.findById("user3")).thenReturn(Optional.of(profile3));

        // Act & Assert
        mockMvc.perform(get("/")
                        .param("query", query)
                        .param("exact", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exact", is(true)))
                .andExpect(jsonPath("$.results", hasSize(1)));
    }

    @Test
    @DisplayName("GET / - поиск постов с пустым результатом")
    void searchPosts_emptyResults() throws Exception {
        // Arrange
        String query = "empty";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createDate"));
        Page<PostDocument> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(cacheService.getSearchResult(eq(query), eq(false), eq(0), eq(10)))
                .thenReturn(Optional.empty());
        when(postRepository.searchByPartialText(eq("*empty*"), any(Pageable.class)))
                .thenReturn(emptyPage);

        // Act & Assert
        mockMvc.perform(get("/").param("query", query))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.totalElements", is(0)));
    }

    @Test
    @DisplayName("GET / - обработка исключения")
    void searchPosts_exception() throws Exception {
        // Arrange
        when(cacheService.getSearchResult(eq("error"), eq(false), eq(0), eq(10)))
                .thenThrow(new RuntimeException("Cache error"));

        // Act & Assert
        mockMvc.perform(get("/").param("query", "error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error", is("Search failed")));
    }

    @Test
    @DisplayName("GET /hashtag - поиск хэштегов с кэшем")
    void searchByHashtag_withCache() throws Exception {
        // Arrange
        String query = "#spring";
        String cleanedQuery = "spring";

        PostWithProfileResponse post1 = new PostWithProfileResponse();
        post1.setId(1);
        post1.setText("Learn #spring boot");
        post1.setProfileId("user1");
        post1.setUsername("user1");

        List<PostWithProfileResponse> cachedResults = Arrays.asList(post1);
        Map<String, Object> cachedResponse = createHashtagResponse(query, false, cachedResults, 0, 10, true);

        // Важно: теперь используем cleanedQuery для кэша!
        when(cacheService.getHashtagResult(eq(cleanedQuery), eq(false), eq(0), eq(10)))
                .thenReturn(Optional.of(cachedResponse));

        // Act & Assert
        mockMvc.perform(get("/hashtag")
                        .param("query", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hashtag", is("#spring")))
                .andExpect(jsonPath("$.results", hasSize(1)))
                .andExpect(jsonPath("$.cached", is(true)));
    }

    @Test
    @DisplayName("GET /hashtag - поиск хэштегов без кэша")
    void searchByHashtag_withoutCache() throws Exception {
        // Arrange
        String query = "#java";
        String cleanedQuery = "java";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createDate"));

        List<PostDocument> posts = Arrays.asList(
                createPostDocument(1, "Learn #java programming!", "user1"),
                createPostDocument(2, "I love #java!", "user2"),
                createPostDocument(3, "#javascript is different", "user3")
        );
        Page<PostDocument> postPage = new PageImpl<>(posts, pageable, posts.size());

        // Используем cleanedQuery для кэша
        when(cacheService.getHashtagResult(eq(cleanedQuery), eq(false), eq(0), eq(10)))
                .thenReturn(Optional.empty());
        when(postRepository.searchByPartialText(eq("*java*"), any(Pageable.class)))
                .thenReturn(postPage);

        ProfileDocument profile1 = new ProfileDocument();
        profile1.setUuid("user1");
        profile1.setUsername("user1");
        when(profileRepository.findById("user1")).thenReturn(Optional.of(profile1));

        ProfileDocument profile2 = new ProfileDocument();
        profile2.setUuid("user2");
        profile2.setUsername("user2");
        when(profileRepository.findById("user2")).thenReturn(Optional.of(profile2));

        // Act & Assert
        mockMvc.perform(get("/hashtag").param("query", query))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hashtag", is("#java")))
                .andExpect(jsonPath("$.results", hasSize(2))) // Только посты с #java
                .andExpect(jsonPath("$.initialResultsCount", is(3)));

        // Verify cache was saved with cleanedQuery
        verify(cacheService).saveHashtagResult(eq(cleanedQuery), eq(false), eq(0), eq(10), anyMap(), anyList());
    }

    @Test
    @DisplayName("GET /hashtag - точный поиск хэштегов")
    void searchByHashtag_exactSearch() throws Exception {
        // Arrange
        String query = "#spring";
        String cleanedQuery = "spring";
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createDate"));

        List<PostDocument> posts = Arrays.asList(
                createPostDocument(4, "Learn #spring boot", "user4"),
                createPostDocument(5, "#springframework is different", "user5")
        );
        Page<PostDocument> postPage = new PageImpl<>(posts, pageable, 2);

        // Используем cleanedQuery для кэша
        when(cacheService.getHashtagResult(eq(cleanedQuery), eq(true), eq(0), eq(10)))
                .thenReturn(Optional.empty());
        when(postRepository.searchByText(eq(cleanedQuery), any(Pageable.class)))
                .thenReturn(postPage);

        ProfileDocument profile4 = new ProfileDocument();
        profile4.setUuid("user4");
        profile4.setUsername("user4");
        when(profileRepository.findById("user4")).thenReturn(Optional.of(profile4));

        // Act & Assert
        mockMvc.perform(get("/hashtag")
                        .param("query", query)
                        .param("exact", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exact", is(true)))
                .andExpect(jsonPath("$.results", hasSize(1))); // Только пост с #spring (не #springframework)
    }

    @Test
    @DisplayName("GET /hashtag - поиск хэштега без # в запросе")
    void searchByHashtag_withoutHashInQuery() throws Exception {
        // Arrange
        String query = "java"; // Без #
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createDate"));
        Page<PostDocument> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        // Query уже без #, поэтому cleanedQuery = "java"
        when(cacheService.getHashtagResult(eq(query), eq(false), eq(0), eq(10)))
                .thenReturn(Optional.empty());
        when(postRepository.searchByPartialText(eq("*java*"), any(Pageable.class)))
                .thenReturn(emptyPage);

        // Act & Assert
        mockMvc.perform(get("/hashtag").param("query", query))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.hashtag", is("#java")));
    }

    @Test
    @DisplayName("GET /hashtag - обработка исключения")
    void searchByHashtag_exception() throws Exception {
        // Arrange
        when(cacheService.getHashtagResult(anyString(), anyBoolean(), anyInt(), anyInt()))
                .thenThrow(new RuntimeException("Hashtag search error"));

        // Act & Assert
        mockMvc.perform(get("/hashtag").param("query", "#error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error", is("Hashtag search failed")));
    }

    @ParameterizedTest
    @CsvSource({
            "'#java', 'I love #java', true",
            "'#java', 'This is #JAVA!', true",
            "'#java', '#java programming', true",
            "'#java', '#java#spring', true",
            "'#java', '#javascript is different', false",
            "'#java', 'The #java123 course', false",
            "'#java', 'Learn #javaScript', false",
            "'#java', 'My#java experience', false",
            "'#java', 'java is great', false",
            "'#java', '', false",
            "'#java', '#', false",
            "'#java', '# jav a', false",
            "'#java', null, false"
    })
    @DisplayName("containsHashtag - различные сценарии")
    void testContainsHashtagScenarios(String query, String text, boolean shouldContain) {
        String cleanedQuery = query.startsWith("#") ? query.substring(1) : query;

        // Используем reflection для тестирования приватного метода
        boolean result = invokePrivateContainsHashtag(text, cleanedQuery);

        if (shouldContain) {
            assertTrue(result, String.format("Текст '%s' должен содержать хэштег '%s'", text, query));
        } else {
            assertFalse(result, String.format("Текст '%s' не должен содержать хэштег '%s'", text, query));
        }
    }

    // Вспомогательные методы
    private List<PostDocument> createTestPostDocuments() {
        List<PostDocument> posts = new ArrayList<>();

        PostDocument post1 = new PostDocument();
        post1.setId(1);
        post1.setText("Test post content");
        post1.setProfileId("user1");
        post1.setLikesAmount(10);
        post1.setCommentsAmount(2);
        post1.setCreateDate(LocalDateTime.now());

        PostDocument post2 = new PostDocument();
        post2.setId(2);
        post2.setText("Another test post");
        post2.setProfileId("user2");
        post2.setLikesAmount(5);
        post2.setCommentsAmount(1);
        post2.setCreateDate(LocalDateTime.now());

        posts.add(post1);
        posts.add(post2);

        return posts;
    }

    private PostDocument createPostDocument(int id, String text, String profileId) {
        PostDocument post = new PostDocument();
        post.setId(id);
        post.setText(text);
        post.setProfileId(profileId);
        post.setLikesAmount(id * 10);
        post.setCommentsAmount(id * 2);
        post.setCreateDate(LocalDateTime.now().minusDays(id));
        return post;
    }

    private Map<String, Object> createSearchResponse(String query, boolean exact,
                                                     List<PostWithProfileResponse> results,
                                                     int page, int size, boolean cached) {
        Map<String, Object> response = new HashMap<>();
        response.put("query", query);
        response.put("exact", exact);
        response.put("results", results);
        response.put("page", page);
        response.put("size", size);
        response.put("totalPages", 1);
        response.put("totalElements", (long) results.size());
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("cached", cached);
        return response;
    }

    private Map<String, Object> createHashtagResponse(String query, boolean exact,
                                                      List<PostWithProfileResponse> results,
                                                      int page, int size, boolean cached) {
        Map<String, Object> response = new HashMap<>();
        response.put("query", query);
        response.put("hashtag", query.startsWith("#") ? query : "#" + query);
        response.put("exact", exact);
        response.put("results", results);
        response.put("page", page);
        response.put("size", size);
        response.put("totalPages", 1);
        response.put("totalElements", (long) results.size());
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("cached", cached);
        return response;
    }

    private boolean invokePrivateContainsHashtag(String text, String hashtag) {
        try {
            var method = SearchController.class.getDeclaredMethod("containsHashtag", String.class, String.class);
            method.setAccessible(true);
            return (boolean) method.invoke(searchController, text, hashtag);
        } catch (Exception e) {
            throw new RuntimeException("Failed to invoke containsHashtag method", e);
        }
    }
}