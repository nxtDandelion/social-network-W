package com.socialw.search.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisHealthService {

    private final RedisConnectionFactory redisConnectionFactory;

    public Map<String, Object> checkHealth() {
        Map<String, Object> healthInfo = new HashMap<>();

        try {
            var connection = redisConnectionFactory.getConnection();
            String pong = connection.ping();
            connection.close();

            healthInfo.put("status", "connected");
            healthInfo.put("response", pong);

            log.info("Redis health check passed");

        } catch (Exception e) {
            log.error("Redis health check failed", e);
            healthInfo.put("status", "error");
            healthInfo.put("error", e.getMessage());
        }

        return healthInfo;
    }
}