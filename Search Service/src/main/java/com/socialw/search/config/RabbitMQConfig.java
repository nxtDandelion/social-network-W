package com.socialw.search.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {

    @Bean
    public FanoutExchange postEventsExchange() {
        return new FanoutExchange("post_events");
    }

    @Bean
    public FanoutExchange profileEventsExchange() {
        return new FanoutExchange("profile_events");
    }

    @Bean
    public Queue searchPostEventsQueue() {
        return new Queue("search_post_events_queue", true);
    }

    @Bean
    public Queue searchProfileEventsQueue() {
        return new Queue("search_profile_events_queue", true);
    }

    @Bean
    public Binding searchPostEventsBinding() {
        return BindingBuilder.bind(searchPostEventsQueue())
                .to(postEventsExchange());
    }

    @Bean
    public Binding searchProfileEventsBinding() {
        return BindingBuilder.bind(searchProfileEventsQueue())
                .to(profileEventsExchange());
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}