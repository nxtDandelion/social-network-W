package com.socialw.search.service;

import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.repository.elastic.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final CacheService cacheService; // Добавляем CacheService

    private static final String POST_CACHE_PREFIX = "post:";

    public PostDocument create(PostDocument post) {
        PostDocument saved = postRepository.save(post);
        log.info("Post created with ID: {}", saved.getId());

        // Инвалидируем поисковые кэши при создании нового поста
        cacheService.invalidatePostCache(saved.getId());

        return saved;
    }

    public Optional<PostDocument> findById(Integer postId) {
        return postRepository.findById(String.valueOf(postId));
    }

    public PostDocument update(PostDocument post) {
        redisTemplate.delete(POST_CACHE_PREFIX + post.getId());
        PostDocument updated = postRepository.save(post);
        log.info("Post updated with ID: {}", post.getId());

        // Инвалидируем поисковые кэши при обновлении поста
        cacheService.invalidatePostCache(post.getId());

        return updated;
    }

    public void delete(Integer postId) {
        postRepository.deleteById(String.valueOf(postId));
        redisTemplate.delete(POST_CACHE_PREFIX + postId);
        log.info("Post deleted with ID: {}", postId);

        // Инвалидируем поисковые кэши при удалении поста
        cacheService.invalidatePostCache(postId);
    }

    public void updateLikers(Integer postId, List<String> likers) {
        Optional<PostDocument> postOpt = postRepository.findById(String.valueOf(postId));
        if (postOpt.isPresent()) {
            PostDocument post = postOpt.get();
            post.setLikers(likers != null ? new ArrayList<>(likers) : new ArrayList<>());
            post.setLikesAmount(likers != null ? likers.size() : 0);
            postRepository.save(post);
            redisTemplate.delete(POST_CACHE_PREFIX + postId);
            log.info("Post likers updated for ID: {}", postId);

            // Инвалидируем поисковые кэши при изменении лайков
            cacheService.invalidatePostCache(postId);
        }
    }

    public void addLiker(Integer postId, String profileId) {
        if (profileId == null || profileId.trim().isEmpty()) {
            log.warn("Profile ID is null or empty for adding liker to post ID: {}", postId);
            return;
        }

        Optional<PostDocument> postOpt = postRepository.findById(String.valueOf(postId));
        if (postOpt.isPresent()) {
            PostDocument post = postOpt.get();
            List<String> likers = post.getLikers() != null ?
                    new ArrayList<>(post.getLikers()) : new ArrayList<>();

            if (!likers.contains(profileId)) {
                likers.add(profileId);
                post.setLikers(likers);
                post.setLikesAmount(likers.size());
                postRepository.save(post);
                redisTemplate.delete(POST_CACHE_PREFIX + postId);
                log.info("Added liker {} to post {}", profileId, postId);

                // Инвалидируем поисковые кэши при добавлении лайка
                cacheService.invalidatePostCache(postId);
            }
        }
    }

    public void removeLiker(Integer postId, String profileId) {
        if (profileId == null || profileId.trim().isEmpty()) {
            log.warn("Profile ID is null or empty for removing liker from post ID: {}", postId);
            return;
        }

        Optional<PostDocument> postOpt = postRepository.findById(String.valueOf(postId));
        if (postOpt.isPresent()) {
            PostDocument post = postOpt.get();
            List<String> likers = post.getLikers() != null ?
                    new ArrayList<>(post.getLikers()) : new ArrayList<>();

            if (likers.remove(profileId)) {
                post.setLikers(likers);
                post.setLikesAmount(likers.size());
                postRepository.save(post);
                redisTemplate.delete(POST_CACHE_PREFIX + postId);
                log.info("Removed liker {} from post {}", profileId, postId);

                // Инвалидируем поисковые кэши при удалении лайка
                cacheService.invalidatePostCache(postId);
            }
        }
    }
}