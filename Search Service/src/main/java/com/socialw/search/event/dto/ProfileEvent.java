package com.socialw.search.event.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProfileEvent {

    @JsonProperty("event_type")
    private String eventType;

    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("username")
    private String username;

    @JsonProperty("photo")
    private byte[] photo;

    @JsonProperty("tag")
    private String tag;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
}