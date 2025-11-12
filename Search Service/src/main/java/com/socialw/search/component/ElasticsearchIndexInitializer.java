package com.socialw.search.component;

import com.socialw.search.model.elastic.PostDocument;
import com.socialw.search.model.elastic.ProfileDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ElasticsearchIndexInitializer implements CommandLineRunner {

    private final ElasticsearchOperations elasticsearchOperations;

    @Override
    public void run(String... args) {
        try {

            IndexOperations postIndexOps = elasticsearchOperations.indexOps(PostDocument.class);
            if (!postIndexOps.exists()) {
                postIndexOps.create();
                log.info("Created Elasticsearch index for posts");
            } else {
                log.info("Posts index already exists");
            }

            IndexOperations profileIndexOps = elasticsearchOperations.indexOps(ProfileDocument.class);
            if (!profileIndexOps.exists()) {
                profileIndexOps.create();
                log.info("Created Elasticsearch index for profiles");
            } else {
                log.info("Profiles index already exists");
            }

            log.info("Elasticsearch indexes initialized successfully");

        } catch (Exception e) {
            log.error("Failed to initialize Elasticsearch indexes", e);
        }
    }
}