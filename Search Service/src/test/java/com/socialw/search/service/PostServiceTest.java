package com.socialw.search.service;

import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.repository.elastic.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private CacheService cacheService;
    @InjectMocks private PostService postService;

    private PostDocument testPost;

    @BeforeEach
    void setUp() {
        testPost = new PostDocument();
        testPost.setId(123);
        testPost.setText("Test content");
        testPost.setProfileId("user-456");
        testPost.setLikesAmount(0);
        testPost.setLikers(Collections.emptyList());
    }

    @Test
    void create_Success() {
        when(postRepository.save(testPost)).thenReturn(testPost);

        PostDocument result = postService.create(testPost);

        assertNotNull(result);
        assertEquals(123, result.getId());
        verify(postRepository).save(testPost);
        verify(cacheService).invalidatePostCache(123);
    }

    @Test
    void findById_PostExists() {
        when(postRepository.findById("123")).thenReturn(Optional.of(testPost));

        Optional<PostDocument> result = postService.findById(123);

        assertTrue(result.isPresent());
        assertEquals(123, result.get().getId());
        verify(postRepository).findById("123");
    }

    @Test
    void findById_PostNotExists() {
        when(postRepository.findById(anyString())).thenReturn(Optional.empty());

        Optional<PostDocument> result = postService.findById(999);

        assertFalse(result.isPresent());
        verify(postRepository).findById("999");
    }

    @Test
    void update_Success() {
        when(postRepository.save(testPost)).thenReturn(testPost);

        PostDocument result = postService.update(testPost);

        assertNotNull(result);
        assertEquals(123, result.getId());
        verify(redisTemplate).delete("post:123");
        verify(postRepository).save(testPost);
        verify(cacheService).invalidatePostCache(123);
    }

    @Test
    void update_ExceptionDuringSave() {
        when(postRepository.save(testPost)).thenThrow(new RuntimeException("DB error"));

        assertThrows(RuntimeException.class, () -> postService.update(testPost));

        verify(redisTemplate).delete("post:123");
        verify(postRepository).save(testPost);
        verify(cacheService, never()).invalidatePostCache(anyInt());
    }

    @Test
    void delete_Success() {
        postService.delete(123);

        verify(postRepository).deleteById("123");
        verify(redisTemplate).delete("post:123");
        verify(cacheService).invalidatePostCache(123);
    }

    @Test
    void updateLikers_Success() {
        List<String> newLikers = Arrays.asList("user1", "user2", "user3");
        when(postRepository.findById("123")).thenReturn(Optional.of(testPost));
        when(postRepository.save(any())).thenReturn(testPost);

        postService.updateLikers(123, newLikers);

        verify(postRepository).save(argThat(post ->
                post.getLikers().size() == 3 && post.getLikesAmount() == 3
        ));
        verify(redisTemplate).delete("post:123");
        verify(cacheService).invalidatePostCache(123);
    }

    @Test
    void updateLikers_NullLikers() {
        when(postRepository.findById("123")).thenReturn(Optional.of(testPost));
        when(postRepository.save(any())).thenReturn(testPost);

        postService.updateLikers(123, null);

        verify(postRepository).save(argThat(post ->
                post.getLikers().isEmpty() && post.getLikesAmount() == 0
        ));
    }

    @Test
    void updateLikers_PostNotFound() {
        when(postRepository.findById(anyString())).thenReturn(Optional.empty());

        postService.updateLikers(123, Arrays.asList("user1", "user2"));

        verify(postRepository, never()).save(any());
        verify(redisTemplate, never()).delete(anyString());
        verify(cacheService, never()).invalidatePostCache(anyInt());
    }

    @Test
    void addLiker_Success() {
        testPost.setLikers(Arrays.asList("existingUser"));
        when(postRepository.findById("123")).thenReturn(Optional.of(testPost));
        when(postRepository.save(any())).thenReturn(testPost);

        postService.addLiker(123, "newUser");

        verify(postRepository).save(argThat(post ->
                post.getLikers().contains("newUser") &&
                        post.getLikers().size() == 2 &&
                        post.getLikesAmount() == 2
        ));
        verify(redisTemplate).delete("post:123");
        verify(cacheService).invalidatePostCache(123);
    }

    @Test
    void addLiker_LikerAlreadyExists() {
        testPost.setLikers(Arrays.asList("existingUser"));
        testPost.setLikesAmount(1);
        when(postRepository.findById("123")).thenReturn(Optional.of(testPost));

        postService.addLiker(123, "existingUser");

        verify(postRepository, never()).save(any());
        verify(redisTemplate, never()).delete(anyString());
        verify(cacheService, never()).invalidatePostCache(anyInt());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "  "})
    void addLiker_InvalidProfileId(String profileId) {
        postService.addLiker(123, profileId);

        verifyNoInteractions(postRepository, redisTemplate, cacheService);
    }

    @Test
    void addLiker_PostNotFound() {
        when(postRepository.findById(anyString())).thenReturn(Optional.empty());

        postService.addLiker(123, "user123");

        verify(postRepository, never()).save(any());
        verify(redisTemplate, never()).delete(anyString());
        verify(cacheService, never()).invalidatePostCache(anyInt());
    }

    @Test
    void removeLiker_Success() {
        testPost.setLikers(Arrays.asList("userToRemove", "otherUser"));
        testPost.setLikesAmount(2);
        when(postRepository.findById("123")).thenReturn(Optional.of(testPost));
        when(postRepository.save(any())).thenReturn(testPost);

        postService.removeLiker(123, "userToRemove");

        verify(postRepository).save(argThat(post ->
                !post.getLikers().contains("userToRemove") &&
                        post.getLikers().size() == 1 &&
                        post.getLikesAmount() == 1
        ));
        verify(redisTemplate).delete("post:123");
        verify(cacheService).invalidatePostCache(123);
    }

    @Test
    void removeLiker_LikerNotFound() {
        testPost.setLikers(Arrays.asList("user1", "user2"));
        when(postRepository.findById("123")).thenReturn(Optional.of(testPost));

        postService.removeLiker(123, "nonExistent");

        verify(postRepository, never()).save(any());
        verify(redisTemplate, never()).delete(anyString());
        verify(cacheService, never()).invalidatePostCache(anyInt());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "  "})
    void removeLiker_InvalidProfileId(String profileId) {
        postService.removeLiker(123, profileId);

        verifyNoInteractions(postRepository, redisTemplate, cacheService);
    }

    @Test
    void removeLiker_PostNotFound() {
        when(postRepository.findById(anyString())).thenReturn(Optional.empty());

        postService.removeLiker(123, "user123");

        verify(postRepository, never()).save(any());
        verify(redisTemplate, never()).delete(anyString());
        verify(cacheService, never()).invalidatePostCache(anyInt());
    }
}