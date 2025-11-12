package com.socialw.search.repository.elastic;

import com.socialw.search.model.elastic.PostDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends ElasticsearchRepository<PostDocument, String> {
}