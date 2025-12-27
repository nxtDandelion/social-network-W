package com.socialw.search.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostWithProfileResponse {
    @JsonProperty("id")
    private Integer id;

    @JsonProperty("text")
    private String text;

    @JsonProperty("profile_id")
    private String profileId;

    @JsonProperty("likes_amount")
    private Integer likesAmount;

    @JsonProperty("comments_amount")
    private Integer commentsAmount;

    @JsonProperty("create_date")
    private LocalDateTime createDate;

    @JsonProperty("edited")
    private Boolean edited;

    @JsonProperty("likers")
    private List<String> likers;

    @JsonProperty("username")
    private String username;

    @JsonProperty("photo")
    private String photo;
}