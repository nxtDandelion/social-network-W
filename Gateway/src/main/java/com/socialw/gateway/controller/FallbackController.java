package com.socialw.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class FallbackController {

    @RequestMapping("/fallback/posts")
    public Mono<ResponseEntity<String>> postServiceFallback() {
        return Mono.just(
                ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("Post service temporarily unavailable")
        );
    }

    @RequestMapping("/fallback/auth")
    public Mono<ResponseEntity<String>> authServiceFallback() {
        return Mono.just(
                ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("Auth service temporarily unavailable")
        );
    }

    @RequestMapping("/fallback/profiles")
    public Mono<ResponseEntity<String>> profileServiceFallback() {
        return Mono.just(
                ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("Profile service temporarily unavailable")
        );
    }

    @RequestMapping("/fallback/search")
    public Mono<ResponseEntity<String>> searchServiceFallback() {
        return Mono.just(
                ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("Search service temporarily unavailable")
        );
    }
}