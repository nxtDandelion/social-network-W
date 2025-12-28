package com.socialw.search.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String SEARCH_PREFIX = "search:";
    private static final String HASHTAG_PREFIX = "hashtag:";
    private static final String POST_TO_CACHE_PREFIX = "post2cache:";
    private static final String PROFILE_TO_CACHE_PREFIX = "profile2cache:";
    private static final long DEFAULT_TTL_MINUTES = 30;

    // Сохраняем результат поиска и связь "пост -> ключи кэша"
    public void saveSearchResult(String query, boolean exact, int page, int size,
                                 Map<String, Object> result, List<Integer> postIds) {
        String key = generateSearchKey(query, exact, page, size);
        saveToCache(key, result, DEFAULT_TTL_MINUTES, TimeUnit.MINUTES);

        // Сохраняем связь "пост -> ключи кэша"
        for (Integer postId : postIds) {
            String postCacheKey = POST_TO_CACHE_PREFIX + postId;
            redisTemplate.opsForSet().add(postCacheKey, key);
            redisTemplate.expire(postCacheKey, DEFAULT_TTL_MINUTES, TimeUnit.MINUTES);
        }

        log.debug("Cached search result for key: {}", key);
    }

    // Сохраняем результат поиска хештега и связь "пост -> ключи кэша"
    public void saveHashtagResult(String query, boolean exact, int page, int size,
                                  Map<String, Object> result, List<Integer> postIds) {
        String key = generateHashtagKey(query, exact, page, size);
        saveToCache(key, result, DEFAULT_TTL_MINUTES, TimeUnit.MINUTES);

        // Сохраняем связь "пост -> ключи кэша"
        for (Integer postId : postIds) {
            String postCacheKey = POST_TO_CACHE_PREFIX + postId;
            redisTemplate.opsForSet().add(postCacheKey, key);
            redisTemplate.expire(postCacheKey, DEFAULT_TTL_MINUTES, TimeUnit.MINUTES);
        }

        log.debug("Cached hashtag result for key: {}", key);
    }

    public Optional<Map<String, Object>> getSearchResult(String query, boolean exact,
                                                         int page, int size) {
        String key = generateSearchKey(query, exact, page, size);
        return getFromCache(key);
    }

    public Optional<Map<String, Object>> getHashtagResult(String query, boolean exact,
                                                          int page, int size) {
        String key = generateHashtagKey(query, exact, page, size);
        return getFromCache(key);
    }

    // Инвалидируем только кэши, содержащие измененный пост
    public void invalidatePostCache(Integer postId) {
        String postCacheKey = POST_TO_CACHE_PREFIX + postId;
        Set<String> cacheKeys = redisTemplate.opsForSet().members(postCacheKey);

        if (cacheKeys != null && !cacheKeys.isEmpty()) {
            int deleted = 0;
            for (String cacheKey : cacheKeys) {
                if (redisTemplate.delete(cacheKey)) {
                    deleted++;
                }
            }
            redisTemplate.delete(postCacheKey);
            log.info("Invalidated {} cache entries for post: {}", deleted, postId);
        } else {
            log.debug("No cache entries found for post: {}", postId);
        }
    }

    // Инвалидируем только кэши, содержащие посты измененного профиля
    public void invalidateUserCache(String profileId) {
        // Для инвалидации профиля нам нужно:
        // 1. Найти все посты этого профиля
        // 2. Инвалидировать кэш для каждого поста
        // Это сложно без доступа к репозиторию, поэтому пока очищаем все

        clearAllSearchCache();
        clearAllHashtagCache();
        log.info("Invalidated all cache due to user update: {}", profileId);
    }

    public void clearAllSearchCache() {
        clearCacheByPattern(SEARCH_PREFIX + "*");
        // Также очищаем связи "пост -> кэш" для поиска
        clearCacheByPattern(POST_TO_CACHE_PREFIX + "*");
        log.info("Cleared all search cache");
    }

    public void clearAllHashtagCache() {
        clearCacheByPattern(HASHTAG_PREFIX + "*");
        log.info("Cleared all hashtag cache");
    }

    private String generateSearchKey(String query, boolean exact, int page, int size) {
        return String.format("%squery:%s:exact:%s:page:%d:size:%d",
                SEARCH_PREFIX, query.toLowerCase(), exact, page, size);
    }

    private String generateHashtagKey(String query, boolean exact, int page, int size) {
        String cleanedQuery = query.startsWith("#") ? query.substring(1) : query;
        return String.format("%squery:%s:exact:%s:page:%d:size:%d",
                HASHTAG_PREFIX, cleanedQuery.toLowerCase(), exact, page, size);
    }

    private void saveToCache(String key, Map<String, Object> data, long timeout, TimeUnit unit) {
        try {
            String json = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(key, json, timeout, unit);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize data for cache key: {}", key, e);
        }
    }

    private Optional<Map<String, Object>> getFromCache(String key) {
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = objectMapper.readValue(json, Map.class);
                log.debug("Cache hit for key: {}", key);
                return Optional.of(result);
            }
            log.debug("Cache miss for key: {}", key);
            return Optional.empty();
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize data from cache key: {}", key, e);
            return Optional.empty();
        }
    }

    private void clearCacheByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Deleted {} cache keys with pattern: {}", keys.size(), pattern);
            }
        } catch (Exception e) {
            log.error("Failed to clear cache with pattern: {}", pattern, e);
        }
    }

    // Метод для получения ID постов из кэшированного результата
    public List<Integer> extractPostIdsFromResult(Map<String, Object> result) {
        List<Integer> postIds = new ArrayList<>();
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> results = (List<Map<String, Object>>) result.get("results");
            if (results != null) {
                for (Map<String, Object> postData : results) {
                    Integer postId = (Integer) postData.get("id");
                    if (postId != null) {
                        postIds.add(postId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract post IDs from result", e);
        }
        return postIds;
    }
}