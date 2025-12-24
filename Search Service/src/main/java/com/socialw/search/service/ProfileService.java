package com.socialw.search.service;

import com.socialw.search.model.elastic.ProfileDocument;
import com.socialw.search.repository.elastic.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String PROFILE_CACHE_PREFIX = "profile:";

    public ProfileDocument create(ProfileDocument profile) {
        ProfileDocument saved = profileRepository.save(profile);
        log.info("Profile created with UUID: {}", saved.getUuid());
        return saved;
    }

    public Optional<ProfileDocument> findById(String uuid) {
        return profileRepository.findById(uuid);
    }

    public ProfileDocument update(ProfileDocument profile) {
        redisTemplate.delete(PROFILE_CACHE_PREFIX + profile.getUuid());
        ProfileDocument updated = profileRepository.save(profile);
        log.info("Profile updated with UUID: {}", profile.getUuid());
        return updated;
    }

    public void delete(String uuid) {
        profileRepository.deleteById(uuid);
        redisTemplate.delete(PROFILE_CACHE_PREFIX + uuid);
        log.info("Profile deleted with UUID: {}", uuid);
    }

    public void updatePhoto(String uuid, String photo) {
        Optional<ProfileDocument> profileOpt = profileRepository.findById(uuid);
        if (profileOpt.isPresent()) {
            ProfileDocument profile = profileOpt.get();
            profile.setPhoto(photo);
            profileRepository.save(profile);
            redisTemplate.delete(PROFILE_CACHE_PREFIX + uuid);
            log.info("Profile photo updated for UUID: {}", uuid);
        }
    }
}