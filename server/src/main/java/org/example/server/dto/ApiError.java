package org.example.server.dto;

import java.time.Instant;

/**
 * Clean JSON error body returned to clients instead of a stack trace.
 */
public record ApiError(
        int status,
        String error,
        String message,
        String timestamp) {

    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message, Instant.now().toString());
    }
}
