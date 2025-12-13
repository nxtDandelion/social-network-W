package com.socialw.search.event.handler;

import com.socialw.search.event.dto.ProfileEvent;
import com.socialw.search.model.elastic.ProfileDocument;
import com.socialw.search.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProfileEventsHandler {

    private final ProfileService profileService;

    @RabbitListener(queues = "search_profile_events_queue")
    public void handleProfileEvent(ProfileEvent event) {
        log.info("Received profile event: {} for user ID: {}", event.getEventType(), event.getUserId());

        try {
            processProfileEvent(event);
            log.info("Successfully processed profile event for user ID: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Failed to process profile event for ID: {}", event.getUserId(), e);
            throw new AmqpRejectAndDontRequeueException("Failed to process profile event", e);
        }
    }

    private void processProfileEvent(ProfileEvent event) {
        log.info("Processing profile event: {} for user: {}", event.getEventType(), event.getUserId());

        switch (event.getEventType()) {
            case "profile_created":
                handleProfileCreated(event);
                break;
            case "profile_updated":
                handleProfileUpdated(event);
                break;
            case "profile_deleted":
                handleProfileDeleted(event);
                break;
            default:
                log.warn("Unhandled profile event type: {}", event.getEventType());
                throw new IllegalArgumentException("Unhandled event type: " + event.getEventType());
        }
    }

    private void handleProfileCreated(ProfileEvent event) {
        ProfileDocument profile = convertToProfileDocument(event);
        profileService.create(profile);
        log.info("Profile created in Elasticsearch: {}", event.getUserId());
    }

    private void handleProfileUpdated(ProfileEvent event) {
        ProfileDocument profile = convertToProfileDocument(event);
        profileService.update(profile);
        log.info("Profile updated in Elasticsearch: {}", event.getUserId());
    }

    private void handleProfileDeleted(ProfileEvent event) {
        profileService.delete(event.getUserId());
        log.info("Profile deleted from Elasticsearch: {}", event.getUserId());
    }

    private ProfileDocument convertToProfileDocument(ProfileEvent event) {
        ProfileDocument profile = new ProfileDocument();
        profile.setUuid(event.getUserId());
        profile.setUsername(event.getUsername());
        profile.setTag(event.getTag());
        profile.setPhoto(event.getPhoto());

        if (event.getPhoto() != null) {
            log.debug("📸 Photo size for user {}: {} bytes",
                    event.getUserId(), event.getPhoto().length);
        } else {
            log.debug("📸 No photo for user: {}", event.getUserId());
        }

        return profile;
    }
}