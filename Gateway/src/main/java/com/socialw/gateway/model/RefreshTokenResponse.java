package com.socialw.gateway.model;

import lombok.Data;

@Data
public class RefreshTokenResponse {
    private String access_token;
    private String refresh_token;
    private String token_type;
}