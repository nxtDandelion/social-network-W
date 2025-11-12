package com.socialw.search.repository.elastic;

import com.socialw.search.model.elastic.ProfileDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfileRepository extends ElasticsearchRepository<ProfileDocument, String> {
}