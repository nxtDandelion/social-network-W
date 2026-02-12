package com.socialw.search.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ValueOperations;

import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CacheServiceTest {

    @Mock private RedisTemplate<String, String> redisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;
    @Mock private SetOperations<String, String> setOperations;
    @Mock private ObjectMapper objectMapper;
    @InjectMocks private CacheService cacheService;

    private Map<String, Object> testResult;
    private List<Integer> testPostIds;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(redisTemplate.opsForSet()).thenReturn(setOperations);

        testResult = new HashMap<>();
        testResult.put("total", 2);
        testResult.put("results", Arrays.asList(
                Map.of("id", 1, "content", "Post 1"),
                Map.of("id", 2, "content", "Post 2")
        ));
        testPostIds = Arrays.asList(1, 2);
    }

    @ParameterizedTest
    @CsvSource({
            "test, true, 0, 10, search:query:test:exact:true:page:0:size:10",
            "#test, false, 1, 5, hashtag:query:test:exact:false:page:1:size:5",
            "test, false, 2, 20, search:query:test:exact:false:page:2:size:20"
    })
    void saveSearchResult_Success(String query, boolean exact, int page, int size, String expectedKey)
            throws Exception {
        String json = "{\"total\":2}";
        when(objectMapper.writeValueAsString(testResult)).thenReturn(json);

        if (query.startsWith("#")) {
            cacheService.saveHashtagResult(query, exact, page, size, testResult, testPostIds);
        } else {
            cacheService.saveSearchResult(query, exact, page, size, testResult, testPostIds);
        }

        verify(valueOperations).set(eq(expectedKey), eq(json), eq(30L), eq(TimeUnit.MINUTES));
    }

    @Test
    void saveSearchResult_EmptyPostIds() throws Exception {
        String json = "{\"total\":2}";
        when(objectMapper.writeValueAsString(testResult)).thenReturn(json);

        cacheService.saveSearchResult("test", true, 0, 10, testResult, Collections.emptyList());

        verify(valueOperations).set(anyString(), anyString(), anyLong(), any());
        verify(setOperations, never()).add(anyString(), anyString());
    }

    @Test
    void saveSearchResult_JsonException() throws Exception {
        when(objectMapper.writeValueAsString(testResult))
                .thenThrow(JsonProcessingException.class);

        assertDoesNotThrow(() ->
                cacheService.saveSearchResult("test", true, 0, 10, testResult, testPostIds));

        verify(valueOperations, never()).set(anyString(), anyString(), anyLong(), any());
    }

    @ParameterizedTest
    @CsvSource({
            "test, true, 0, 10, search:query:test:exact:true:page:0:size:10",
            "#test, false, 1, 5, hashtag:query:test:exact:false:page:1:size:5"
    })
    void getSearchResult_KeyExists(String query, boolean exact, int page, int size, String expectedKey)
            throws Exception {
        String json = "{\"total\":2}";
        when(valueOperations.get(expectedKey)).thenReturn(json);
        when(objectMapper.readValue(json, Map.class)).thenReturn(testResult);

        Optional<Map<String, Object>> result;
        if (query.startsWith("#")) {
            result = cacheService.getHashtagResult(query, exact, page, size);
        } else {
            result = cacheService.getSearchResult(query, exact, page, size);
        }

        assertTrue(result.isPresent());
    }

    @Test
    void getSearchResult_KeyNotExists() {
        when(valueOperations.get(anyString())).thenReturn(null);

        assertFalse(cacheService.getSearchResult("test", true, 0, 10).isPresent());
        verifyNoInteractions(objectMapper);
    }

    @Test
    void getSearchResult_JsonException() throws Exception {
        when(valueOperations.get(anyString())).thenReturn("invalid json");
        when(objectMapper.readValue(anyString(), eq(Map.class)))
                .thenThrow(JsonProcessingException.class);

        assertFalse(cacheService.getSearchResult("test", true, 0, 10).isPresent());
    }

    @Test
    void invalidatePostCache_Success() {
        String postCacheKey = "post2cache:123";
        Set<String> cacheKeys = Set.of("search:key1", "search:key2");

        when(setOperations.members(postCacheKey)).thenReturn(cacheKeys);

        cacheService.invalidatePostCache(123);

        verify(redisTemplate, times(3)).delete(anyString());
    }

    @ParameterizedTest
    @NullAndEmptySource
    void invalidatePostCache_NoKeys(Set<String> keys) {
        when(setOperations.members(anyString())).thenReturn(keys);

        cacheService.invalidatePostCache(123);

        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void extractPostIdsFromResult_ValidStructure() {
        List<Integer> ids = cacheService.extractPostIdsFromResult(testResult);

        assertEquals(2, ids.size());
        assertTrue(ids.contains(1));
        assertTrue(ids.contains(2));
    }

    @ParameterizedTest
    @CsvSource({
            "{}, true",
            "'{results:null}', true",
            "'{results:[]}', true",
            "'{results:[{text:test}]}', true",
            "'{results:[{id:not-int}]}', true"
    })
    void extractPostIdsFromResult_EdgeCases(String description, boolean shouldBeEmpty) {
        // Тесты для различных случаев возврата пустого списка
        Map<String, Object> result = new HashMap<>();

        if (description.equals("{}")) {
            // пустой мап
        } else if (description.equals("{results:null}")) {
            result.put("results", null);
        } else if (description.equals("{results:[]}")) {
            result.put("results", Collections.emptyList());
        } else if (description.equals("{results:[{text:test}]}")) {
            result.put("results", Collections.singletonList(Map.of("text", "test")));
        } else if (description.equals("{results:[{id:not-int}]}")) {
            result.put("results", Collections.singletonList(Map.of("id", "not-int")));
        }

        List<Integer> ids = cacheService.extractPostIdsFromResult(result);
        assertTrue(ids.isEmpty());
    }

    @Test
    void invalidateUserCache_Success() {
        Set<String> searchKeys = Set.of("search:key1");
        Set<String> hashtagKeys = Set.of("hashtag:key1");
        Set<String> post2cacheKeys = Set.of("post2cache:1");

        when(redisTemplate.keys("search:*")).thenReturn(searchKeys);
        when(redisTemplate.keys("hashtag:*")).thenReturn(hashtagKeys);
        when(redisTemplate.keys("post2cache:*")).thenReturn(post2cacheKeys);

        cacheService.invalidateUserCache("user-123");

        verify(redisTemplate, times(3)).delete(any(Collection.class));
    }

    @Test
    void clearAllSearchCache_Success() {
        Set<String> searchKeys = Set.of("search:key1");
        Set<String> post2cacheKeys = Set.of("post2cache:1");

        when(redisTemplate.keys("search:*")).thenReturn(searchKeys);
        when(redisTemplate.keys("post2cache:*")).thenReturn(post2cacheKeys);

        cacheService.clearAllSearchCache();

        verify(redisTemplate, times(2)).delete(any(Collection.class));
    }

    @Test
    void clearAllHashtagCache_Success() {
        Set<String> hashtagKeys = Set.of("hashtag:key1");

        when(redisTemplate.keys("hashtag:*")).thenReturn(hashtagKeys);

        cacheService.clearAllHashtagCache();

        verify(redisTemplate).delete(hashtagKeys);
    }

    @Test
    void clearAllCaches_ExceptionHandling() {
        when(redisTemplate.keys(anyString())).thenReturn(Set.of("key1"));
        doThrow(RuntimeException.class).when(redisTemplate).delete(any(Collection.class));

        // Проверяем, что исключения ловятся внутри методов
        assertDoesNotThrow(() -> cacheService.clearAllSearchCache());
        assertDoesNotThrow(() -> cacheService.clearAllHashtagCache());
        assertDoesNotThrow(() -> cacheService.invalidateUserCache("test"));
    }
}