package com.socialw.gateway.controller;

import com.socialw.gateway.service.HealthCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class HealthController {

    private final HealthCheckService healthCheckService;

    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, String>>> getHealthStatus() {
        return healthCheckService.checkAllServicesHealth()
                .map(ResponseEntity::ok);
    }

    @GetMapping("/")
    public String welcome() {
        return "SocialW Gateway is running!";
    }
}