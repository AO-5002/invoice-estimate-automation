package org.example.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows the Next.js dev client (configurable origin, default http://localhost:3000) to call the
 * read-only API endpoints from the browser.
 */
@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    private final AppProperties props;

    public WebCorsConfig(AppProperties props) {
        this.props = props;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(props.getCors().getAllowedOrigin())
                .allowedMethods("GET", "OPTIONS");
    }
}
