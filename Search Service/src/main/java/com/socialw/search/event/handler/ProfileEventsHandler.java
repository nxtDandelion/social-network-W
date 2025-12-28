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
        log.info("Received profile event: {} for user ID: {}", event.getEventType(), event.getUuid());

        try {
            processProfileEvent(event);
            log.info("Successfully processed profile event for user ID: {}", event.getUuid());
        } catch (Exception e) {
            log.error("Failed to process profile event for ID: {}", event.getUuid(), e);
            throw new AmqpRejectAndDontRequeueException("Failed to process profile event", e);
        }
    }

    private void processProfileEvent(ProfileEvent event) {
        log.info("Processing profile event: {} for user: {}", event.getEventType(), event.getUuid());

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
        log.info("Profile created in Elasticsearch: {}", event.getUuid());
    }

    private void handleProfileUpdated(ProfileEvent event) {
        ProfileDocument profile = convertToProfileDocument(event);
        profileService.update(profile);
        log.info("Profile updated in Elasticsearch: {}", event.getUuid());
    }

    private void handleProfileDeleted(ProfileEvent event) {
        profileService.delete(event.getUuid());
        log.info("Profile deleted from Elasticsearch: {}", event.getUuid());
    }

    private ProfileDocument convertToProfileDocument(ProfileEvent event) {
        ProfileDocument profile = new ProfileDocument();
        profile.setUuid(event.getUuid());
        profile.setUsername(event.getUsername());
        profile.setPhoto(event.getPhoto());

        return profile;
    }
}