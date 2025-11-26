package com.socialw.search.event.handler;

import com.socialw.search.event.dto.ProfileEvent;
import com.socialw.search.model.elastic.ProfileDocument;
import com.socialw.search.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProfileEventsHandler {

    private final ProfileService profileService;

    @RabbitListener(queues = "search_profile_events_queue")
    public void handleProfileEvent(ProfileEvent event) {
        try {
            log.info("Received profile event: {} for user: {}", event.getEventType(), event.getUserId());

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
            }

        } catch (Exception e) {
            log.error("Error processing profile event: {}", event.getEventType(), e);
        }
    }

    private void handleProfileCreated(ProfileEvent event) {
        ProfileDocument profile = new ProfileDocument();
        profile.setUuid(event.getUserId());
        profile.setUsername(event.getUsername());
        profile.setTag(event.getTag());

        if (event.getPhoto() != null) {
            profile.setPhoto(event.getPhoto());
        }

        profileService.create(profile);
        log.info("Profile created: {}", event.getUserId());
    }

    private void handleProfileUpdated(ProfileEvent event) {
        ProfileDocument profile = new ProfileDocument();
        profile.setUuid(event.getUserId());
        profile.setUsername(event.getUsername());
        profile.setTag(event.getTag());

        if (event.getPhoto() != null) {
            profile.setPhoto(event.getPhoto());
        }

        profileService.update(profile);
        log.info("Profile updated: {}", event.getUserId());
    }

    private void handleProfileDeleted(ProfileEvent event) {
        profileService.delete(event.getUserId());
        log.info("Profile deleted: {}", event.getUserId());
    }
}