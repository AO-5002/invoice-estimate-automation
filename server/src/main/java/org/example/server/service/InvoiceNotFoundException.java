package org.example.server.service;

/**
 * Thrown when a lookup targets an invoice that has no matching row in the sheet — a write against an
 * unknown {@code id}, or a PDF request for an unknown {@code invoiceNumber}. Mapped to a clean 404
 * response by the global exception handler.
 */
public class InvoiceNotFoundException extends RuntimeException {

    public InvoiceNotFoundException(String identifier) {
        super("No invoice found with identifier '" + identifier + "'.");
    }
}
