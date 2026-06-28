package org.example.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Single binding point for all runtime configuration of the Sheets read path.
 *
 * <p>Every value is sourced from {@code application.properties}, which in turn reads from
 * environment variables via {@code ${ENV_VAR:default}} placeholders. Nothing is hardcoded and
 * no secrets live in source. See {@code .env.example} for the full list of variables.
 */
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Google google = new Google();
    private final Sheets sheets = new Sheets();
    private final Cache cache = new Cache();
    private final Cors cors = new Cors();

    public Google getGoogle() {
        return google;
    }

    public Sheets getSheets() {
        return sheets;
    }

    public Cache getCache() {
        return cache;
    }

    public Cors getCors() {
        return cors;
    }

    /** Service-account credentials. Provide exactly ONE of the two. */
    public static class Google {
        /** Filesystem path to the service-account JSON key file. */
        private String credentialsPath = "";
        /** The service-account key JSON supplied inline (for environments that can't mount a file). */
        private String credentialsJson = "";

        public String getCredentialsPath() {
            return credentialsPath;
        }

        public void setCredentialsPath(String credentialsPath) {
            this.credentialsPath = credentialsPath;
        }

        public String getCredentialsJson() {
            return credentialsJson;
        }

        public void setCredentialsJson(String credentialsJson) {
            this.credentialsJson = credentialsJson;
        }
    }

    /** Which spreadsheet and tabs to read. */
    public static class Sheets {
        /** The spreadsheet ID (the long token in the Sheet URL). */
        private String spreadsheetId = "";
        /** Tab (worksheet) name holding invoice rows. */
        private String invoicesTab = "Invoices";
        /** Tab (worksheet) name holding estimate rows. */
        private String estimatesTab = "Estimates";

        public String getSpreadsheetId() {
            return spreadsheetId;
        }

        public void setSpreadsheetId(String spreadsheetId) {
            this.spreadsheetId = spreadsheetId;
        }

        public String getInvoicesTab() {
            return invoicesTab;
        }

        public void setInvoicesTab(String invoicesTab) {
            this.invoicesTab = invoicesTab;
        }

        public String getEstimatesTab() {
            return estimatesTab;
        }

        public void setEstimatesTab(String estimatesTab) {
            this.estimatesTab = estimatesTab;
        }
    }

    /** In-memory cache behavior. */
    public static class Cache {
        /** How long a fetched list is served before the next request re-fetches from Sheets. */
        private long ttlSeconds = 60;

        public long getTtlSeconds() {
            return ttlSeconds;
        }

        public void setTtlSeconds(long ttlSeconds) {
            this.ttlSeconds = ttlSeconds;
        }
    }

    /** Cross-origin access for the Next.js client. */
    public static class Cors {
        /** Allowed browser origin permitted to call the GET endpoints. */
        private String allowedOrigin = "http://localhost:3000";

        public String getAllowedOrigin() {
            return allowedOrigin;
        }

        public void setAllowedOrigin(String allowedOrigin) {
            this.allowedOrigin = allowedOrigin;
        }
    }
}
