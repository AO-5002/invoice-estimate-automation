package org.example.server.dto;

/**
 * Inbound payload for a single-cell estimate update (PATCH /api/estimates/{id}). {@code key} is a
 * read-DTO field name (e.g. "costToClient"); {@code value} is the new cell value as a string.
 */
public record EstimateCellUpdate(
        String key,
        String value) {
}
