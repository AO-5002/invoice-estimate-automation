package org.example.server.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata. Swagger UI is served at {@code /swagger-ui.html} and the raw spec at
 * {@code /v3/api-docs}.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI invoiceAutomationOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Invoice Automation API")
                .version("v1")
                .description("Read-only access to invoices and estimates sourced from Google Sheets "
                        + "and served from an in-memory, time-based cache."));
    }
}
