package com.socialw.search.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialw.search.dto.PostWithProfileResponse;
import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.repository.elastic.PostRepository;
import com.socialw.search.repository.elastic.ProfileRepository;
import com.socialw.search.service.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/")
@RequiredArgsConstructor
public class SearchController {

    private final PostRepository postRepository;
    private final ProfileRepository profileRepository;
    private final CacheService cacheService;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> searchPosts(
            @RequestParam String query,
            @RequestParam(defaultValue = "false") boolean exact,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            log.info("Searching posts with query: '{}', exact: {}, page: {}, size: {}",
                    query, exact, page, size);

            Optional<Map<String, Object>> cachedResult =
                    cacheService.getSearchResult(query, exact, page, size);

            if (cachedResult.isPresent()) {
                Map<String, Object> cachedResponse = cachedResult.get();
                @SuppressWarnings("unchecked")
                List<PostWithProfileResponse> results = (List<PostWithProfileResponse>) cachedResponse.get("results");

                log.info("Returning cached result for query: '{}' with {} results",
                        query, results != null ? results.size() : 0);

                if (results == null || results.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(cachedResponse);
                }
                return ResponseEntity.ok(cachedResponse);
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createDate"));
            Page<PostDocument> postResults;

            if (exact) {
                postResults = postRepository.searchByText(query, pageable);
            } else {
                String wildcardQuery = "*" + query + "*";
                postResults = postRepository.searchByPartialText(wildcardQuery, pageable);
            }

            List<PostWithProfileResponse> results = postResults.getContent().stream()
                    .map(this::convertToPostWithProfile)
                    .collect(Collectors.toList());

            Map<String, Object> response = createSearchResponse(query, exact, postResults, results);

            // Извлекаем ID постов для сохранения связи
            List<Integer> postIds = results.stream()
                    .map(PostWithProfileResponse::getId)
                    .collect(Collectors.toList());

            cacheService.saveSearchResult(query, exact, page, size, response, postIds);
            log.info("Cached search result for query: '{}' with {} posts", query, postIds.size());

            if (results.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error searching posts with query: {}", query, e);
            return createErrorResponse("Search failed", e);
        }
    }

    @GetMapping("/hashtag")
    public ResponseEntity<Map<String, Object>> searchByHashtag(
            @RequestParam String query,
            @RequestParam(defaultValue = "false") boolean exact,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        try {
            String cleanedQuery = query.startsWith("#") ? query.substring(1) : query;
            log.info("Searching hashtag: '#{}', exact: {}, page: {}, size: {}",
                    cleanedQuery, exact, page, size);

            Optional<Map<String, Object>> cachedResult =
                    cacheService.getHashtagResult(cleanedQuery, exact, page, size);

            if (cachedResult.isPresent()) {
                Map<String, Object> cachedResponse = cachedResult.get();
                @SuppressWarnings("unchecked")
                List<PostWithProfileResponse> results = (List<PostWithProfileResponse>) cachedResponse.get("results");

                log.info("Returning cached result for hashtag: '#{}' with {} results",
                        cleanedQuery, results != null ? results.size() : 0);

                if (results == null || results.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(cachedResponse);
                }
                return ResponseEntity.ok(cachedResponse);
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createDate"));

            Page<PostDocument> textResults;
            if (exact) {
                textResults = postRepository.searchByText(cleanedQuery, pageable);
            } else {
                String wildcardQuery = "*" + cleanedQuery + "*";
                textResults = postRepository.searchByPartialText(wildcardQuery, pageable);
            }

            List<PostDocument> filteredResults = textResults.getContent().stream()
                    .filter(post -> post.getText() != null && containsHashtag(post.getText(), cleanedQuery))
                    .collect(Collectors.toList());

            Page<PostDocument> finalResults = createPage(filteredResults, pageable);

            List<PostWithProfileResponse> results = finalResults.getContent().stream()
                    .map(this::convertToPostWithProfile)
                    .collect(Collectors.toList());

            Map<String, Object> response = createHashtagResponse(
                    query, cleanedQuery, exact, finalResults, results, textResults.getTotalElements());

            // Извлекаем ID постов для сохранения связи
            List<Integer> postIds = results.stream()
                    .map(PostWithProfileResponse::getId)
                    .collect(Collectors.toList());

            // Важное исправление: используем cleanedQuery для кэша
            cacheService.saveHashtagResult(cleanedQuery, exact, page, size, response, postIds);
            log.info("Cached hashtag result for query: '#{}' with {} posts", cleanedQuery, postIds.size());

            if (results.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error searching hashtag with query: {}", query, e);
            return createErrorResponse("Hashtag search failed", e);
        }
    }

    private Map<String, Object> createSearchResponse(String query, boolean exact,
                                                     Page<PostDocument> postResults,
                                                     List<PostWithProfileResponse> results) {
        Map<String, Object> response = new HashMap<>();
        response.put("query", query);
        response.put("exact", exact);
        response.put("results", results);
        response.put("page", postResults.getNumber());
        response.put("size", postResults.getSize());
        response.put("totalPages", postResults.getTotalPages());
        response.put("totalElements", postResults.getTotalElements());
        response.put("timestamp", LocalDateTime.now());
        response.put("cached", false);
        return response;
    }

    private Map<String, Object> createHashtagResponse(String query, String cleanedQuery, boolean exact,
                                                      Page<PostDocument> finalResults,
                                                      List<PostWithProfileResponse> results,
                                                      long initialResultsCount) {
        Map<String, Object> response = new HashMap<>();
        response.put("query", query);
        response.put("hashtag", "#" + cleanedQuery);
        response.put("exact", exact);
        response.put("results", results);
        response.put("page", finalResults.getNumber());
        response.put("size", finalResults.getSize());
        response.put("totalPages", finalResults.getTotalPages());
        response.put("totalElements", finalResults.getTotalElements());
        response.put("initialResultsCount", initialResultsCount);
        response.put("timestamp", LocalDateTime.now());
        response.put("cached", false);
        return response;
    }

    private ResponseEntity<Map<String, Object>> createErrorResponse(String errorMessage, Exception e) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", errorMessage);
        error.put("message", e.getMessage());
        error.put("timestamp", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private Page<PostDocument> createPage(List<PostDocument> content, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), content.size());

        if (start > content.size()) {
            return new PageImpl<>(Collections.emptyList(), pageable, content.size());
        }

        return new PageImpl<>(
                content.subList(start, end),
                pageable,
                content.size()
        );
    }

    private boolean containsHashtag(String text, String hashtag) {
        if (text == null || hashtag == null || hashtag.isEmpty()) {
            return false;
        }

        String lowerText = text.toLowerCase();
        String lowerHashtag = hashtag.toLowerCase();

        int hashtagIndex = lowerText.indexOf("#" + lowerHashtag);
        if (hashtagIndex == -1) {
            return false;
        }

        if (hashtagIndex > 0) {
            char before = text.charAt(hashtagIndex - 1);
            if (Character.isLetterOrDigit(before)) {
                return false;
            }
        }

        int afterIndex = hashtagIndex + 1 + lowerHashtag.length();
        if (afterIndex < text.length()) {
            char after = text.charAt(afterIndex);
            if (Character.isLetterOrDigit(after)) {
                return false;
            }
        }

        return true;
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

        if (post.getProfileId() != null) {
            profileRepository.findById(post.getProfileId()).ifPresent(profile -> {
                response.setUsername(profile.getUsername());
                response.setPhoto(profile.getPhoto());
            });
        }

        return response;
    }
}