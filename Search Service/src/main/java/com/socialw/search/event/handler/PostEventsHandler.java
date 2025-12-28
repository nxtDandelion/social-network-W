package com.socialw.search.event.handler;

import com.socialw.search.event.dto.PostEvent;
import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Slf4j
@Component
@RequiredArgsConstructor
public class PostEventsHandler {

    private final PostService postService;

    @RabbitListener(queues = "search_post_events_queue")
    public void handlePostEvent(PostEvent event) {
        log.info("Received post event: {} for post ID: {}", event.getEventType(), event.getPostId());

        try {
            processPostEvent(event);
            log.info("Successfully processed event for post ID: {}", event.getPostId());
        } catch (Exception e) {
            log.error("Failed to process post event for ID: {}", event.getPostId(), e);
            throw new AmqpRejectAndDontRequeueException("Failed to process post event", e);
        }
    }

    private void processPostEvent(PostEvent event) {
        log.info("Processing post event: {} for post ID: {}", event.getEventType(), event.getPostId());

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
                handlePostLiked(event);
                break;
            case "post_unliked":
                handlePostUnliked(event);
                break;
            default:
                log.warn("Unhandled post event type: {}", event.getEventType());
                throw new IllegalArgumentException("Unhandled event type: " + event.getEventType());
        }
    }

    private void handlePostCreated(PostEvent event) {
        PostDocument post = convertToPostDocument(event);
        postService.create(post);
        log.info("Post created in Elasticsearch: {}", event.getPostId());
    }

    private void handlePostUpdated(PostEvent event) {
        PostDocument post = convertToPostDocument(event);
        postService.update(post);
        log.info("Post updated in Elasticsearch: {}", event.getPostId());
    }

    private void handlePostDeleted(PostEvent event) {
        postService.delete(event.getPostId());
        log.info("Post deleted from Elasticsearch: {}", event.getPostId());
    }

    private void handlePostLiked(PostEvent event) {
        String profileId = event.getProfileId();
        if (profileId == null || profileId.trim().isEmpty()) {
            log.error("Profile ID is missing for like event on post ID: {}", event.getPostId());
            return;
        }

        postService.addLiker(event.getPostId(), profileId);
        log.info("User {} liked post {} in Elasticsearch", profileId, event.getPostId());
    }

    private void handlePostUnliked(PostEvent event) {
        String profileId = event.getProfileId();
        if (profileId == null || profileId.trim().isEmpty()) {
            log.error("Profile ID is missing for unlike event on post ID: {}", event.getPostId());
            return;
        }

        postService.removeLiker(event.getPostId(), profileId);
        log.info("User {} unliked post {} in Elasticsearch", profileId, event.getPostId());
    }

    private PostDocument convertToPostDocument(PostEvent event) {
        PostDocument post = new PostDocument();
        post.setId(event.getPostId());
        post.setText(event.getText());
        post.setProfileId(event.getProfileId());
        post.setLikesAmount(event.getLikesAmount() != null ? event.getLikesAmount() : 0);
        post.setCreateDate(event.getCreateDate());
        post.setEdited(event.getEdited() != null ? event.getEdited() : false);
        post.setLikers(event.getLikers() != null ? event.getLikers() : new ArrayList<>());
        post.setCommentsAmount(event.getCommentsAmount() != null ? event.getCommentsAmount() : 0);
        return post;
    }
}