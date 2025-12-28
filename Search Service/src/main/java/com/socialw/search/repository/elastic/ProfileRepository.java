package com.socialw.search.repository.elastic;

import com.socialw.search.model.elastic.ProfileDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends ElasticsearchRepository<ProfileDocument, String> {

    Optional<ProfileDocument> findByUsername(String username);
}