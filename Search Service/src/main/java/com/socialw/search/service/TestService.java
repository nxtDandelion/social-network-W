package com.socialw.search.service;

import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.model.elastic.ProfileDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class TestService implements CommandLineRunner {

    private final PostService postService;
    private final ProfileService profileService;

    @Override
    public void run(String... args) throws Exception {
        log.info("=== Starting CRUD operations test ===");

        testProfileCRUD();
        testPostCRUD();

        log.info("=== CRUD operations test completed ===");
    }

    private void testProfileCRUD() {
        try {
            log.info("Testing Profile CRUD operations...");

            // CREATE
            ProfileDocument profile = new ProfileDocument();
            profile.setUuid("test-uuid-123");
            profile.setUsername("testuser");
            profile.setTag("#testtag");
            profile.setPhoto("test-photo-data".getBytes());

            ProfileDocument createdProfile = profileService.create(profile);
            log.info("✅ Profile created: {}", createdProfile.getUuid());

            // READ
            var foundProfile = profileService.findById("test-uuid-123");
            if (foundProfile.isPresent()) {
                log.info("✅ Profile found: {}", foundProfile.get().getUsername());
            }

            // UPDATE
            profile.setUsername("updateduser");
            ProfileDocument updatedProfile = profileService.update(profile);
            log.info("✅ Profile updated: {}", updatedProfile.getUsername());

            // UPDATE PHOTO
            profileService.updatePhoto("test-uuid-123", "updated-photo".getBytes());
            log.info("✅ Profile photo updated");

            // DELETE
            profileService.delete("test-uuid-123");
            log.info("✅ Profile deleted");

        } catch (Exception e) {
            log.error("❌ Profile CRUD test failed", e);
        }
    }

    private void testPostCRUD() {
        try {
            log.info("Testing Post CRUD operations...");

            // CREATE
            PostDocument post = new PostDocument();
            post.setId(123);
            post.setText("This is a test post content");
            post.setProfileId("user-456");
            post.setLikesAmount(5);
            post.setCreateDate(LocalDateTime.now());
            post.setEdited(false);

            List<String> likers = new LinkedList<>();
            likers.add("jksmxchd");
            likers.add("kkkkkkk");
            post.setLikers(likers);

            PostDocument createdPost = postService.create(post);
            log.info("✅ Post created: {}", createdPost.getId());

            // READ
            var foundPost = postService.findById(123);
            if (foundPost.isPresent()) {
                log.info("✅ Post found: {}", foundPost.get().getText());
            }

            // UPDATE
            post.setText("Updated post content");
            PostDocument updatedPost = postService.update(post);
            log.info("✅ Post updated: {}", updatedPost.getText());

            // UPDATE LIKERS
            List<String> newLikers = new LinkedList<>();
            newLikers.add("user1");
            newLikers.add("user2");
            newLikers.add("user3");
            postService.updateLikers(123, newLikers);
            log.info("✅ Post likers updated");

            // DELETE
            postService.delete(123);
            log.info("✅ Post deleted");

        } catch (Exception e) {
            log.error("❌ Post CRUD test failed", e);
        }
    }
}