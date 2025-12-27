package com.socialw.search.event.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostEvent {

    @JsonProperty("event_type")
    private String eventType;

    @JsonProperty("id")
    private Integer postId;

    @JsonProperty("text")
    private String text;

    @JsonProperty("profile_id")
    private String profileId;

    @JsonProperty("likes_amount")
    private Integer likesAmount;

    @JsonProperty("create_date")
    private LocalDateTime createDate;

    @JsonProperty("edited")
    private Boolean edited;

    @JsonProperty("likers")
    private List<String> likers;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    @JsonProperty("comments_amount")
    private Integer commentsAmount;
}