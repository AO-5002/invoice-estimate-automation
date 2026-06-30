package org.example.server.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.List;

/**
 * Builds the single, shared {@link Sheets} client bean used for all reads.
 *
 * <p>The client is created once at startup (one HTTP transport, one credential) and reused for
 * every request — never one client per request.
 */
@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class SheetsClientConfig {

    private static final String APPLICATION_NAME = "invoice-automation-server";

    @Bean
    public Sheets sheetsClient(AppProperties props) throws IOException, GeneralSecurityException {
        GoogleCredentials credentials = loadCredentials(props.getGoogle())
                .createScoped(List.of(SheetsScopes.SPREADSHEETS));

        HttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();
        return new Sheets.Builder(transport, GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    /**
     * Loads service-account credentials, preferring inline JSON over a file path. Fails with a
     * clear, actionable message (not a vague NPE) when neither is configured or the source is
     * unreadable.
     */
    private GoogleCredentials loadCredentials(AppProperties.Google google) throws IOException {
        if (StringUtils.hasText(google.getCredentialsJson())) {
            try (InputStream in = new ByteArrayInputStream(
                    google.getCredentialsJson().getBytes(StandardCharsets.UTF_8))) {
                return GoogleCredentials.fromStream(in);
            } catch (IOException e) {
                throw new IOException(
                        "Failed to parse inline service-account JSON from GOOGLE_CREDENTIALS_JSON. "
                                + "Ensure the variable contains the full, valid key JSON.", e);
            }
        }

        if (StringUtils.hasText(google.getCredentialsPath())) {
            try (InputStream in = new FileInputStream(google.getCredentialsPath())) {
                return GoogleCredentials.fromStream(in);
            } catch (IOException e) {
                throw new IOException(
                        "Failed to read service-account key file at GOOGLE_CREDENTIALS_PATH='"
                                + google.getCredentialsPath() + "'. Check the path and permissions.", e);
            }
        }

        throw new IllegalStateException(
                "No Google service-account credentials configured. Set GOOGLE_CREDENTIALS_PATH "
                        + "(path to the JSON key file) OR GOOGLE_CREDENTIALS_JSON (the key JSON inline). "
                        + "See .env.example.");
    }
}
