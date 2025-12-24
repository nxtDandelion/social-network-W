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

    @JsonProperty("uuid")
    private String uuid;

    @JsonProperty("username")
    private String username;

    @JsonProperty("photo")
    private String photo;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
}