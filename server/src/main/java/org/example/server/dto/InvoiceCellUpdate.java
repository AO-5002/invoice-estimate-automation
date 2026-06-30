package org.example.server.dto;

/**
 * Inbound payload for a single-cell invoice update (PATCH /api/invoices/{id}). {@code key} is a
 * read-DTO field name (e.g. "costToClient"); {@code value} is the new cell value as a string.
 */
public record InvoiceCellUpdate(
        String key,
        String value) {
}
