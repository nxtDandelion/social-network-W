package com.socialw.search.event.handler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MessageFormatAnalyzer {

    @RabbitListener(queues = "search_post_events_queue")
    public void analyzePostMessage(Message message) {
        log.info("=== POST MESSAGE ANALYSIS ===");
        log.info("Content type: {}", message.getMessageProperties().getContentType());
        log.info("Headers: {}", message.getMessageProperties().getHeaders());
        log.info("Body: {}", new String(message.getBody()));
        log.info("=============================");
    }

    @RabbitListener(queues = "search_profile_events_queue")
    public void analyzeProfileMessage(Message message) {
        log.info("=== PROFILE MESSAGE ANALYSIS ===");
        log.info("Content type: {}", message.getMessageProperties().getContentType());
        log.info("Headers: {}", message.getMessageProperties().getHeaders());
        log.info("Body: {}", new String(message.getBody()));
        log.info("================================");
    }
}