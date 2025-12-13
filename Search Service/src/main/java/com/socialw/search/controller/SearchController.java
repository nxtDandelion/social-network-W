package com.socialw.search.controller;

import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.model.elastic.ProfileDocument;
import com.socialw.search.repository.elastic.PostRepository;
import com.socialw.search.repository.elastic.ProfileRepository;
import com.socialw.search.service.ElasticsearchHealthService;
import com.socialw.search.service.RedisHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/")
@RequiredArgsConstructor
public class SearchController {

    private final ElasticsearchHealthService elasticsearchHealthService;
    private final RedisHealthService redisHealthService;
    private final PostRepository postRepository;
    private final ProfileRepository profileRepository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "healthy");
        healthResponse.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(healthResponse);
    }

    @GetMapping("/elastic_health")
    public ResponseEntity<Map<String, Object>> elasticsearchHealth() {
        Map<String, Object> healthInfo = elasticsearchHealthService.checkHealth();

        if ("error".equals(healthInfo.get("status"))) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(healthInfo);
        }

        return ResponseEntity.ok(healthInfo);
    }

    @GetMapping("/redis_health")
    public ResponseEntity<Map<String, Object>> redisHealth() {
        Map<String, Object> healthInfo = redisHealthService.checkHealth();

        if ("error".equals(healthInfo.get("status"))) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(healthInfo);
        }

        return ResponseEntity.ok(healthInfo);
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> searchPosts(
            @RequestParam String query,
            @RequestParam(defaultValue = "false") boolean exact,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            log.info("Searching posts with query: '{}', exact: {}, page: {}, size: {}",
                    query, exact, page, size);

            Pageable pageable = PageRequest.of(page, size);
            Page<PostDocument> results;

            if (exact) {
                // Поиск по полным словам
                results = postRepository.searchByText(query, pageable);
            } else {
                // Поиск по части слова (по умолчанию)
                results = postRepository.searchByPartialText(query, pageable);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("query", query);
            response.put("exact", exact);
            response.put("results", results.getContent());
            response.put("page", results.getNumber());
            response.put("size", results.getSize());
            response.put("totalPages", results.getTotalPages());
            response.put("totalElements", results.getTotalElements());
            response.put("timestamp", LocalDateTime.now());

            if (results.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error searching posts with query: {}", query, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Search failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<Map<String, Object>> searchPostsByUsername(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            log.info("Searching posts for username: {}, page: {}, size: {}", username, page, size);

            // 1. Находим профиль по username
            var profileOpt = profileRepository.findByUsername(username);
            if (profileOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "User not found");
                error.put("message", "User with username '" + username + "' does not exist");
                error.put("timestamp", LocalDateTime.now());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            ProfileDocument profile = profileOpt.get();

            // 2. Ищем посты по profileId (UUID профиля)
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createDate"));
            Page<PostDocument> results = postRepository.findByProfileId(profile.getUuid(), pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("username", username);
            response.put("userId", profile.getUuid());
            response.put("results", results.getContent());
            response.put("page", results.getNumber());
            response.put("size", results.getSize());
            response.put("totalPages", results.getTotalPages());
            response.put("totalElements", results.getTotalElements());
            response.put("timestamp", LocalDateTime.now());

            if (results.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error searching posts for username: {}", username, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Search failed");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPosts", postRepository.count());
        stats.put("totalProfiles", profileRepository.count());
        stats.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(stats);
    }

}