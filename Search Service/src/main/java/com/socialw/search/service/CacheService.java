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
    private static final long DEFAULT_TTL_MINUTES = 30;

    public void saveSearchResult(String query, boolean exact, int page, int size,
                                 Map<String, Object> result) {
        String key = generateSearchKey(query, exact, page, size);
        saveToCache(key, result, DEFAULT_TTL_MINUTES, TimeUnit.MINUTES);
        log.debug("Cached search result for key: {}", key);
    }

    public void saveHashtagResult(String query, boolean exact, int page, int size,
                                  Map<String, Object> result) {
        String key = generateHashtagKey(query, exact, page, size);
        saveToCache(key, result, DEFAULT_TTL_MINUTES, TimeUnit.MINUTES);
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

    public void deleteSearchCache(String query, boolean exact, int page, int size) {
        String key = generateSearchKey(query, exact, page, size);
        redisTemplate.delete(key);
        log.debug("Deleted search cache for key: {}", key);
    }

    public void deleteHashtagCache(String query, boolean exact, int page, int size) {
        String key = generateHashtagKey(query, exact, page, size);
        redisTemplate.delete(key);
        log.debug("Deleted hashtag cache for key: {}", key);
    }

    public void clearAllSearchCache() {
        clearCacheByPattern(SEARCH_PREFIX + "*");
        log.info("Cleared all search cache");
    }

    public void clearAllHashtagCache() {
        clearCacheByPattern(HASHTAG_PREFIX + "*");
        log.info("Cleared all hashtag cache");
    }

    public void invalidatePostCache(Integer postId) {
        clearAllSearchCache();
        clearAllHashtagCache();
        log.info("Invalidated all search and hashtag cache due to post update: {}", postId);
    }

    public void invalidateUserCache(String profileId) {
        clearAllSearchCache();
        clearAllHashtagCache();
        log.info("Invalidated all search and hashtag cache due to user update: {}", profileId);
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
                long deleted = redisTemplate.delete(keys);
                log.info("Deleted {} cache keys with pattern: {} (examples: {})",
                        deleted,
                        pattern,
                        keys.stream().limit(5).collect(Collectors.toList()));
            } else {
                log.debug("No keys found for pattern: {}", pattern);
            }
        } catch (Exception e) {
            log.error("Failed to clear cache with pattern: {}", pattern, e);
        }
    }
}