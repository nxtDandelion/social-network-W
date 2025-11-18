package com.socialw.gateway.model;

import lombok.Data;

@Data
public class TokenVerificationResponse {
    private boolean valid;
    private String user_uuid;
    private String login;
    private String role;
    private Long expires_at;
}