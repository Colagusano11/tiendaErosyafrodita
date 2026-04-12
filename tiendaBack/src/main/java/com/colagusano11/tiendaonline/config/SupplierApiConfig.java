package com.colagusano11.tiendaonline.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SupplierApiConfig {

    @Bean
    public BtsApiClient btsApiClient(@Value("${bts.api.jwt}") String jwt) {
        return new BtsApiClient(jwt);
    }

    @Bean
    public NovaApiClient novaApiClient(
            @Value("${novaengel.user}") String user,
            @Value("${novaengel.password}") String password
    ) {
        return new NovaApiClient(user, password);
    }

}
