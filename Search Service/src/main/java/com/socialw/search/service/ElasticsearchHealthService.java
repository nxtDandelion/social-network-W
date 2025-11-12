package com.socialw.search.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.cluster.HealthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ElasticsearchHealthService {

    private final ElasticsearchClient elasticsearchClient;

    public Map<String, Object> checkHealth() {
        Map<String, Object> healthInfo = new HashMap<>();

        try {
            HealthResponse healthResponse = elasticsearchClient.cluster().health();

            healthInfo.put("status", "connected");
            healthInfo.put("cluster_name", healthResponse.clusterName());
            healthInfo.put("cluster_status", healthResponse.status() != null ? healthResponse.status().jsonValue() : "unknown");
            healthInfo.put("number_of_nodes", healthResponse.numberOfNodes());
            healthInfo.put("number_of_data_nodes", healthResponse.numberOfDataNodes());
            healthInfo.put("active_shards", healthResponse.activeShards());
            healthInfo.put("active_primary_shards", healthResponse.activePrimaryShards());
            healthInfo.put("initializing_shards", healthResponse.initializingShards());
            healthInfo.put("unassigned_shards", healthResponse.unassignedShards());
            healthInfo.put("timed_out", healthResponse.timedOut());

            log.info("Elasticsearch health check passed: {}", healthResponse.status());

        } catch (Exception e) {
            log.error("Elasticsearch health check failed", e);
            healthInfo.put("status", "error");
            healthInfo.put("error", e.getMessage());
        }

        return healthInfo;
    }
}