package com.socialw.search.controller;

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
public class SearchController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> welcome() {
        log.info("Received request to root endpoint");

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello from Search Service!");
        response.put("service", "search-service");

        return ResponseEntity.ok(response);
    }


    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        log.info("Health check requested");

        Map<String, Object> healthResponse = new HashMap<>();
        healthResponse.put("status", "healthy");

        return ResponseEntity.ok(healthResponse);
    }

}