package com.socialw.search.controller;

import com.socialw.search.service.ElasticsearchHealthService;
import com.socialw.search.service.RedisHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping
    public ResponseEntity<Map<String, Object>> welcome() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello from Search Service!");
        response.put("service", "search-service");
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "healthy");
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
}