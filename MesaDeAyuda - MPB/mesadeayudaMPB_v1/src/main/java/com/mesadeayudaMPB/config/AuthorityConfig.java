package com.mesadeayudaMPB.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.core.GrantedAuthorityDefaults;

@Configuration
public class AuthorityConfig {
    
    @Bean
    GrantedAuthorityDefaults grantedAuthorityDefaults() {
        // Aqui se deshabilito el prefijo por defecto "ROLE_" del spring security
        return new GrantedAuthorityDefaults("");
    }
}