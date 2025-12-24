package com.socialw.search.model.elastic;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(indexName = "posts")
public class PostDocument {

    @Id
    private Integer id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String text;

    @Field(type = FieldType.Keyword)
    private String profileId;

    @Field(type = FieldType.Integer)
    private Integer likesAmount;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second)
    private LocalDateTime createDate;

    @Field(type = FieldType.Boolean)
    private Boolean edited;

    @Field(type = FieldType.Keyword)
    private List<String> likers;

    @Field(type = FieldType.Integer)
    private Integer commentsAmount;
}