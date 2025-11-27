package com.socialw.search.event.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialw.search.event.dto.PostEvent;
import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class PostEventsHandler {

    private final PostService postService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "search_post_events_queue")
    public void handlePostEvent(Message message) {
        try {
            String messageBody = new String(message.getBody());
            log.info("Received raw message: {}", messageBody);

            PostEvent event = objectMapper.readValue(messageBody, PostEvent.class);
            processPostEvent(event);

        } catch (JsonProcessingException e) {
            log.error("Failed to parse PostEvent from message: {}", new String(message.getBody()), e);
        } catch (Exception e) {
            log.error("Error processing post event", e);
        }
    }

    private void processPostEvent(PostEvent event) {
        try {
            log.info("Processing post event: {} for post: {}", event.getEventType(), event.getPostId());

            switch (event.getEventType()) {
                case "post_created":
                    handlePostCreated(event);
                    break;
                case "post_updated":
                    handlePostUpdated(event);
                    break;
                case "post_deleted":
                    handlePostDeleted(event);
                    break;
                case "post_liked":
                case "post_unliked":
                    handlePostLike(event);
                    break;
                default:
                    log.warn("Unhandled post event type: {}", event.getEventType());
            }

        } catch (Exception e) {
            log.error("Error processing post event: {}", event.getEventType(), e);
        }
    }

    private void handlePostCreated(PostEvent event) {
        PostDocument post = convertToPostDocument(event);
        postService.create(post);
        log.info("Post created: {}", event.getPostId());
    }

    private void handlePostUpdated(PostEvent event) {
        PostDocument post = convertToPostDocument(event);
        postService.update(post);
        log.info("Post updated: {}", event.getPostId());
    }

    private void handlePostDeleted(PostEvent event) {
        postService.delete(event.getPostId());
        log.info("Post deleted: {}", event.getPostId());
    }

    private void handlePostLike(PostEvent event) {
        postService.updateLikers(event.getPostId(), event.getLikers());
        log.info("Post likers updated: {}", event.getPostId());
    }

    private PostDocument convertToPostDocument(PostEvent event) {
        PostDocument post = new PostDocument();
        post.setId(event.getPostId());
        post.setText(event.getText());
        post.setProfileId(event.getProfileId());
        post.setLikesAmount(event.getLikesAmount() != null ? event.getLikesAmount() : 0);
        post.setCreateDate(event.getCreateDate());
        post.setEdited(event.getEdited() != null ? event.getEdited() : false);
        post.setLikers(event.getLikers());
        return post;
    }
}