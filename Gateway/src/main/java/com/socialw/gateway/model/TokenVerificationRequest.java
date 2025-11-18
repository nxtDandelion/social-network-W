package com.socialw.gateway.model;

import lombok.Data;

@Data
public class TokenVerificationRequest {
    private String token;

    public TokenVerificationRequest() {}

    public TokenVerificationRequest(String token) {
        this.token = token;
    }
}