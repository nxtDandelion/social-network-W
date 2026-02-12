package com.socialw.search.event.handler;

import com.socialw.search.event.dto.ProfileEvent;
import com.socialw.search.model.elastic.ProfileDocument;
import com.socialw.search.service.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileEventsHandlerTest {

    @Mock
    private ProfileService profileService;

    @InjectMocks
    private ProfileEventsHandler profileEventsHandler;

    private ProfileEvent testEvent;

    @BeforeEach
    void setUp() {
        testEvent = new ProfileEvent();
        testEvent.setUuid("user-123");
        testEvent.setEventType("profile_created");
        testEvent.setUsername("john_doe");
        testEvent.setPhoto("photo_data");
    }

    @ParameterizedTest
    @CsvSource({
            "profile_created, create",
            "profile_updated, update"
    })
    void handleProfileEvent_CreatesOrUpdatesProfile(String eventType, String methodName) {
        testEvent.setEventType(eventType);

        profileEventsHandler.handleProfileEvent(testEvent);

        ArgumentCaptor<ProfileDocument> captor = ArgumentCaptor.forClass(ProfileDocument.class);
        if (methodName.equals("create")) {
            verify(profileService).create(captor.capture());
        } else {
            verify(profileService).update(captor.capture());
        }

        ProfileDocument doc = captor.getValue();
        assertEquals("user-123", doc.getUuid());
        assertEquals("john_doe", doc.getUsername());
        assertEquals("photo_data", doc.getPhoto());
    }

    @Test
    void handleProfileEvent_DeletesProfile() {
        testEvent.setEventType("profile_deleted");

        profileEventsHandler.handleProfileEvent(testEvent);

        verify(profileService).delete("user-123");
        verifyNoMoreInteractions(profileService);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void handleProfileEvent_HandlesNullAndEmptyFields(String value) {
        testEvent.setUsername(value);
        testEvent.setPhoto(value);

        profileEventsHandler.handleProfileEvent(testEvent);

        ArgumentCaptor<ProfileDocument> captor = ArgumentCaptor.forClass(ProfileDocument.class);
        verify(profileService).create(captor.capture());

        ProfileDocument doc = captor.getValue();
        assertEquals(value, doc.getUsername());
        assertEquals(value, doc.getPhoto());
    }

    @Test
    void handleProfileEvent_HandlesNullUuid() {
        testEvent.setUuid(null);

        profileEventsHandler.handleProfileEvent(testEvent);

        ArgumentCaptor<ProfileDocument> captor = ArgumentCaptor.forClass(ProfileDocument.class);
        verify(profileService).create(captor.capture());

        ProfileDocument doc = captor.getValue();
        assertNull(doc.getUuid());
    }

    @Test
    void handleProfileEvent_ServiceException_ThrowsAmqpException() {
        testEvent.setEventType("profile_created");
        doThrow(new RuntimeException("DB error")).when(profileService).create(any(ProfileDocument.class));

        assertThrows(AmqpRejectAndDontRequeueException.class, () -> {
            profileEventsHandler.handleProfileEvent(testEvent);
        });

        verify(profileService).create(any(ProfileDocument.class));
    }

    @Test
    void handleProfileEvent_DeleteException_ThrowsAmqpException() {
        testEvent.setEventType("profile_deleted");
        doThrow(new RuntimeException("Delete error")).when(profileService).delete("user-123");

        assertThrows(AmqpRejectAndDontRequeueException.class, () -> {
            profileEventsHandler.handleProfileEvent(testEvent);
        });

        verify(profileService).delete("user-123");
    }

    @Test
    void handleProfileEvent_UnknownEventType_ThrowsAmqpException() {
        testEvent.setEventType("unknown_event");

        assertThrows(AmqpRejectAndDontRequeueException.class, () -> {
            profileEventsHandler.handleProfileEvent(testEvent);
        });

        verifyNoInteractions(profileService);
    }

    @Test
    void handleProfileEvent_MinimalData() {
        ProfileEvent minimalEvent = new ProfileEvent();
        minimalEvent.setUuid("minimal");
        minimalEvent.setEventType("profile_created");

        profileEventsHandler.handleProfileEvent(minimalEvent);

        ArgumentCaptor<ProfileDocument> captor = ArgumentCaptor.forClass(ProfileDocument.class);
        verify(profileService).create(captor.capture());

        ProfileDocument doc = captor.getValue();
        assertEquals("minimal", doc.getUuid());
        assertNull(doc.getUsername());
        assertNull(doc.getPhoto());
    }
}