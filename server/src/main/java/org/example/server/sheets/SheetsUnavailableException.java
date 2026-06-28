package org.example.server.sheets;

/**
 * Thrown when a real read from Google Sheets fails (network/API/auth error at request time).
 * Mapped to a clean 503 response by the global exception handler.
 */
public class SheetsUnavailableException extends RuntimeException {

    public SheetsUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
