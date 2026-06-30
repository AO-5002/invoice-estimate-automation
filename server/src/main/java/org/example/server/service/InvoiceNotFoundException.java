package org.example.server.service;

/**
 * Thrown when a write targets an invoice {@code id} that has no matching row in the sheet. Mapped
 * to a clean 404 response by the global exception handler.
 */
public class InvoiceNotFoundException extends RuntimeException {

    public InvoiceNotFoundException(String id) {
        super("No invoice found with id '" + id + "'.");
    }
}
