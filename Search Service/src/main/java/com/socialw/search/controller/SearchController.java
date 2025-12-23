package com.socialw.search.controller;

import com.socialw.search.dto.PostWithProfileResponse;
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
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

            Map<String, Object> response = searchPostsInternal(query, exact, page, size);

            @SuppressWarnings("unchecked")
            List<PostWithProfileResponse> results = (List<PostWithProfileResponse>) response.get("results");

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

    @GetMapping("/hashtag")
    public ResponseEntity<Map<String, Object>> searchByHashtag(
            @RequestParam String query,
            @RequestParam(defaultValue = "false") boolean exact,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            // Добавляем # к запросу если его нет
            String hashtagQuery = query.startsWith("#") ? query : "#" + query;
            log.info("Searching hashtag with query: '{}', processed: '{}', exact: {}, page: {}, size: {}",
                    query, hashtagQuery, exact, page, size);

            Map<String, Object> response = searchPostsInternal(hashtagQuery, exact, page, size);
            response.put("query", query);
            response.put("hashtag", hashtagQuery);

            @SuppressWarnings("unchecked")
            List<PostWithProfileResponse> results = (List<PostWithProfileResponse>) response.get("results");

            if (results.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error searching hashtag with query: {}", query, e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Hashtag search failed");
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

    // Общий метод для поиска постов
    private Map<String, Object> searchPostsInternal(String query, boolean exact, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createDate"));
        Page<PostDocument> postResults;

        if (exact) {
            // Поиск по полным словам
            postResults = postRepository.searchByText(query, pageable);
        } else {
            // Поиск по части слова (по умолчанию)
            postResults = postRepository.searchByPartialText(query, pageable);
        }

        // Преобразуем посты в DTO с информацией о профиле
        List<PostWithProfileResponse> results = postResults.getContent().stream()
                .map(this::convertToPostWithProfile)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("query", query);
        response.put("exact", exact);
        response.put("results", results);
        response.put("page", postResults.getNumber());
        response.put("size", postResults.getSize());
        response.put("totalPages", postResults.getTotalPages());
        response.put("totalElements", postResults.getTotalElements());
        response.put("timestamp", LocalDateTime.now());

        return response;
    }

    private PostWithProfileResponse convertToPostWithProfile(PostDocument post) {
        PostWithProfileResponse response = new PostWithProfileResponse();
        response.setId(post.getId());
        response.setText(post.getText());
        response.setProfileId(post.getProfileId());
        response.setLikesAmount(post.getLikesAmount());
        response.setCommentsAmount(post.getCommentsAmount());
        response.setCreateDate(post.getCreateDate());
        response.setEdited(post.getEdited());
        response.setLikers(post.getLikers());

        // Получаем информацию о профиле
        if (post.getProfileId() != null) {
            // Используем findById для получения профиля
            profileRepository.findById(post.getProfileId()).ifPresent(profile -> {
                response.setUsername(profile.getUsername());
                response.setPhoto(profile.getPhoto());
            });
        }

        return response;
    }
}