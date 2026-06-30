package org.example.server.service;

/**
 * Thrown when a write targets an estimate {@code id} that has no matching row in the sheet. Mapped
 * to a clean 404 response by the global exception handler.
 */
public class EstimateNotFoundException extends RuntimeException {

    public EstimateNotFoundException(String id) {
        super("No estimate found with id '" + id + "'.");
    }
}
