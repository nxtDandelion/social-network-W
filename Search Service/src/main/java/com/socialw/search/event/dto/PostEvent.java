package com.socialw.search.event.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
public class PostEvent {
    private String eventType;  // "post_created", "post_updated", "post_deleted", "post_liked", "post_unliked"
    private String postId;
    private String text;
    private String profileId;
    private Integer likesAmount;
    private LocalDateTime createDate;
    private Boolean edited;
    private Map<String, Object> likers;
    private Long timestamp;
}