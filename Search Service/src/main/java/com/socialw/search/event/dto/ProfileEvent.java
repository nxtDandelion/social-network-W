package com.socialw.search.event.dto;

import lombok.Data;

@Data
public class ProfileEvent {
    private String eventType;  // "profile_updated", "profile_created" и т.д.
    private String userId;
    private String username;
    private byte[] photo;
    private String tag;
    private Long timestamp;
}