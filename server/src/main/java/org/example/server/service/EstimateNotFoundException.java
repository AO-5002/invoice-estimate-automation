package org.example.server.service;

/**
 * Thrown when a lookup targets an estimate that has no matching row in the sheet — a write against
 * an unknown {@code id}, or a PDF request for an unknown {@code estimateNumber}. Mapped to a clean
 * 404 response by the global exception handler.
 */
public class EstimateNotFoundException extends RuntimeException {

    public EstimateNotFoundException(String identifier) {
        super("No estimate found with identifier '" + identifier + "'.");
    }
}
