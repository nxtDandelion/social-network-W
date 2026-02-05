package com.socialw.search.service;

import com.socialw.search.model.elastic.ProfileDocument;
import com.socialw.search.repository.elastic.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private ProfileRepository profileRepository;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private CacheService cacheService;
    @InjectMocks private ProfileService profileService;

    private ProfileDocument testProfile;

    @BeforeEach
    void setUp() {
        testProfile = new ProfileDocument();
        testProfile.setUuid("user-123");
        testProfile.setUsername("john_doe");
        testProfile.setPhoto("photo_data");
    }

    @Test
    void create_Success() {
        when(profileRepository.save(testProfile)).thenReturn(testProfile);

        ProfileDocument result = profileService.create(testProfile);

        assertNotNull(result);
        assertEquals("user-123", result.getUuid());
        verify(profileRepository).save(testProfile);
        verify(cacheService).invalidateUserCache("user-123");
    }

    @Test
    void create_Exception() {
        when(profileRepository.save(testProfile)).thenThrow(new RuntimeException("DB error"));

        assertThrows(RuntimeException.class, () -> profileService.create(testProfile));

        verify(cacheService, never()).invalidateUserCache(anyString());
    }

    @Test
    void findById_ProfileExists() {
        when(profileRepository.findById("user-123")).thenReturn(Optional.of(testProfile));

        Optional<ProfileDocument> result = profileService.findById("user-123");

        assertTrue(result.isPresent());
        assertEquals("user-123", result.get().getUuid());
        verify(profileRepository).findById("user-123");
    }

    @Test
    void findById_ProfileNotExists() {
        when(profileRepository.findById(anyString())).thenReturn(Optional.empty());

        Optional<ProfileDocument> result = profileService.findById("non-existent");

        assertFalse(result.isPresent());
        verify(profileRepository).findById("non-existent");
    }

    @Test
    void update_Success() {
        when(profileRepository.save(testProfile)).thenReturn(testProfile);

        ProfileDocument result = profileService.update(testProfile);

        assertNotNull(result);
        assertEquals("user-123", result.getUuid());
        verify(redisTemplate).delete("profile:user-123");
        verify(profileRepository).save(testProfile);
        verify(cacheService).invalidateUserCache("user-123");
    }

    @Test
    void update_Exception() {
        when(profileRepository.save(testProfile)).thenThrow(new RuntimeException("DB error"));

        assertThrows(RuntimeException.class, () -> profileService.update(testProfile));

        verify(redisTemplate).delete("profile:user-123");
        verify(cacheService, never()).invalidateUserCache(anyString());
    }

    @Test
    void delete_Success() {
        profileService.delete("user-123");

        verify(profileRepository).deleteById("user-123");
        verify(redisTemplate).delete("profile:user-123");
        verify(cacheService).invalidateUserCache("user-123");
    }

    @Test
    void updatePhoto_Success() {
        when(profileRepository.findById("user-123")).thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any())).thenReturn(testProfile);

        profileService.updatePhoto("user-123", "new_photo");

        verify(profileRepository).save(argThat(profile ->
                "new_photo".equals(profile.getPhoto())
        ));
        verify(redisTemplate).delete("profile:user-123");
        verify(cacheService).invalidateUserCache("user-123");
    }

    @Test
    void updatePhoto_ProfileNotFound() {
        when(profileRepository.findById(anyString())).thenReturn(Optional.empty());

        profileService.updatePhoto("non-existent", "new_photo");

        verify(profileRepository, never()).save(any());
        verify(redisTemplate, never()).delete(anyString());
        verify(cacheService, never()).invalidateUserCache(anyString());
    }

    @ParameterizedTest
    @NullAndEmptySource
    void updatePhoto_NullOrEmptyPhoto(String photo) {
        when(profileRepository.findById("user-123")).thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any())).thenReturn(testProfile);

        profileService.updatePhoto("user-123", photo);

        verify(profileRepository).save(any());
        verify(redisTemplate).delete("profile:user-123");
        verify(cacheService).invalidateUserCache("user-123");
    }

    @Test
    void updatePhoto_Exception() {
        when(profileRepository.findById("user-123")).thenReturn(Optional.of(testProfile));
        when(profileRepository.save(any())).thenThrow(new RuntimeException("DB error"));

        assertThrows(RuntimeException.class, () ->
                profileService.updatePhoto("user-123", "new_photo")
        );

        verify(redisTemplate, never()).delete(anyString());
        verify(cacheService, never()).invalidateUserCache(anyString());
    }
}