package com.socialw.search.event.handler;

import com.socialw.search.event.dto.PostEvent;
import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.service.PostService;
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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostEventsHandlerTest {

    @Mock
    private PostService postService;

    @InjectMocks
    private PostEventsHandler postEventsHandler;

    private PostEvent testEvent;

    @BeforeEach
    void setUp() {
        testEvent = new PostEvent();
        testEvent.setPostId(123);
        testEvent.setEventType("post_created");
        testEvent.setText("Test content");
        testEvent.setProfileId("user-456");
        testEvent.setLikesAmount(5);
        testEvent.setCreateDate(LocalDateTime.now());
        testEvent.setEdited(false);
        testEvent.setLikers(Arrays.asList("user1", "user2"));
        testEvent.setCommentsAmount(3);
    }

    @ParameterizedTest
    @CsvSource({
            "post_created, create",
            "post_updated, update"
    })
    void handlePostEvent_CreatesOrUpdatesPost(String eventType, String methodName) {
        testEvent.setEventType(eventType);

        postEventsHandler.handlePostEvent(testEvent);

        ArgumentCaptor<PostDocument> captor = ArgumentCaptor.forClass(PostDocument.class);
        if (methodName.equals("create")) {
            verify(postService).create(captor.capture());
        } else {
            verify(postService).update(captor.capture());
        }

        PostDocument doc = captor.getValue();
        assertEquals(123, doc.getId());
        assertEquals("Test content", doc.getText());
        assertEquals("user-456", doc.getProfileId());
        assertEquals(5, doc.getLikesAmount());
        assertEquals(2, doc.getLikers().size());
        assertEquals(3, doc.getCommentsAmount());
        assertFalse(doc.getEdited());
    }

    @Test
    void handlePostEvent_DeletesPost() {
        testEvent.setEventType("post_deleted");

        postEventsHandler.handlePostEvent(testEvent);

        verify(postService).delete(123);
        verifyNoMoreInteractions(postService);
    }

    @Test
    void handlePostEvent_HandlesLike() {
        testEvent.setEventType("post_liked");

        postEventsHandler.handlePostEvent(testEvent);

        verify(postService).addLiker(123, "user-456");
        verifyNoMoreInteractions(postService);
    }

    @Test
    void handlePostEvent_HandlesUnlike() {
        testEvent.setEventType("post_unliked");

        postEventsHandler.handlePostEvent(testEvent);

        verify(postService).removeLiker(123, "user-456");
        verifyNoMoreInteractions(postService);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void handlePostEvent_LikeEventsWithEmptyProfileId_DoNothing(String profileId) {
        testEvent.setEventType("post_liked");
        testEvent.setProfileId(profileId);

        postEventsHandler.handlePostEvent(testEvent);

        verifyNoInteractions(postService);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void handlePostEvent_UnlikeEventsWithEmptyProfileId_DoNothing(String profileId) {
        testEvent.setEventType("post_unliked");
        testEvent.setProfileId(profileId);

        postEventsHandler.handlePostEvent(testEvent);

        verifyNoInteractions(postService);
    }

    @Test
    void handlePostEvent_ConvertsNullFieldsToDefaults() {
        PostEvent event = new PostEvent();
        event.setPostId(999);
        event.setEventType("post_created");
        event.setText(null);
        event.setProfileId(null);
        event.setLikesAmount(null);
        event.setCreateDate(null);
        event.setEdited(null);
        event.setLikers(null);
        event.setCommentsAmount(null);

        postEventsHandler.handlePostEvent(event);

        ArgumentCaptor<PostDocument> captor = ArgumentCaptor.forClass(PostDocument.class);
        verify(postService).create(captor.capture());

        PostDocument doc = captor.getValue();
        assertEquals(999, doc.getId());
        assertNull(doc.getText());
        assertNull(doc.getProfileId());
        assertEquals(0, doc.getLikesAmount());
        assertNull(doc.getCreateDate());
        assertFalse(doc.getEdited());
        assertNotNull(doc.getLikers());
        assertTrue(doc.getLikers().isEmpty());
        assertEquals(0, doc.getCommentsAmount());
    }

    @Test
    void handlePostEvent_ServiceException_ThrowsAmqpException() {
        testEvent.setEventType("post_created");
        doThrow(new RuntimeException("DB error")).when(postService).create(any(PostDocument.class));

        assertThrows(AmqpRejectAndDontRequeueException.class, () -> {
            postEventsHandler.handlePostEvent(testEvent);
        });

        verify(postService).create(any(PostDocument.class));
    }

    @Test
    void handlePostEvent_UnknownEventType_ThrowsAmqpException() {
        testEvent.setEventType("unknown_event");

        assertThrows(AmqpRejectAndDontRequeueException.class, () -> {
            postEventsHandler.handlePostEvent(testEvent);
        });

        verifyNoInteractions(postService);
    }

    @Test
    void handlePostEvent_WithMaxValues() {
        testEvent.setLikesAmount(Integer.MAX_VALUE);
        testEvent.setCommentsAmount(Integer.MAX_VALUE);
        testEvent.setLikers(Collections.nCopies(1000, "user"));
        testEvent.setEdited(true);

        postEventsHandler.handlePostEvent(testEvent);

        ArgumentCaptor<PostDocument> captor = ArgumentCaptor.forClass(PostDocument.class);
        verify(postService).create(captor.capture());

        PostDocument doc = captor.getValue();
        assertEquals(Integer.MAX_VALUE, doc.getLikesAmount());
        assertEquals(Integer.MAX_VALUE, doc.getCommentsAmount());
        assertEquals(1000, doc.getLikers().size());
        assertTrue(doc.getEdited());
    }
}