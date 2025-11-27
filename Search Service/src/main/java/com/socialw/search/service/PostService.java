package com.socialw.search.service;

import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.repository.elastic.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String POST_CACHE_PREFIX = "post:";

    public PostDocument create(PostDocument post) {
        PostDocument saved = postRepository.save(post);
        log.info("Post created with ID: {}", saved.getId());
        return saved;
    }

    public Optional<PostDocument> findById(String id) {
        return postRepository.findById(id);
    }

    public PostDocument update(PostDocument post) {
        redisTemplate.delete(POST_CACHE_PREFIX + post.getId());
        PostDocument updated = postRepository.save(post);
        log.info("Post updated with ID: {}", post.getId());
        return updated;
    }

    public void delete(String id) {
        postRepository.deleteById(id);
        redisTemplate.delete(POST_CACHE_PREFIX + id);
        log.info("Post deleted with ID: {}", id);
    }

    public void updateLikers(String postId, List<String> likers) {
        Optional<PostDocument> postOpt = postRepository.findById(postId);
        if (postOpt.isPresent()) {
            PostDocument post = postOpt.get();
            post.setLikers(likers);
            post.setLikesAmount(likers.size());
            postRepository.save(post);
            redisTemplate.delete(POST_CACHE_PREFIX + postId);
            log.info("Post likers updated for ID: {}", postId);
        }
    }
}