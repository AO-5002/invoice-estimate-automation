package org.example.server.controller;

import org.example.server.dto.ApiError;
import org.example.server.sheets.SheetsUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates backend failures into clean JSON error bodies (never a stack trace to the client).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Upstream Google Sheets read failed → 503 Service Unavailable. */
    @ExceptionHandler(SheetsUnavailableException.class)
    public ResponseEntity<ApiError> handleSheetsUnavailable(SheetsUnavailableException ex) {
        log.error("Google Sheets read failed: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiError.of(HttpStatus.SERVICE_UNAVAILABLE.value(), "Sheets Unavailable",
                        "Could not retrieve data from Google Sheets. Please try again shortly."));
    }
}
