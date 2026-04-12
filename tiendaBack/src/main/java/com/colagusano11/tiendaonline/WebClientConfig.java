package com.colagusano11.tiendaonline;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;


@Configuration
public class WebClientConfig {

  @Value("${config.baseurl.endpoint.mcsv-usuario}")
  private String url;

  @Bean
  @LoadBalanced
  WebClient.Builder webClient(){
    return WebClient.builder().baseUrl(url);
  }
}

