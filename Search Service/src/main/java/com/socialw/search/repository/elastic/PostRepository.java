package com.socialw.search.repository.elastic;

import com.socialw.search.model.elastic.PostDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends ElasticsearchRepository<PostDocument, String> {

    @Query("{\"match\": {\"text\": {\"query\": \"?0\", \"operator\": \"and\"}}}")
    Page<PostDocument> searchByText(String query, Pageable pageable);

    @Query("""
        {
          "query_string": {
            "query": "*?0*",
            "fields": ["text"],
            "analyze_wildcard": true
          }
        }
        """)
    Page<PostDocument> searchByPartialText(String query, Pageable pageable);

    Page<PostDocument> findByProfileId(String profileId, Pageable pageable);
}