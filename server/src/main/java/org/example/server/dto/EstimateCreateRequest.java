package org.example.server.dto;

/**
 * Inbound payload for appending a new estimate row (POST /api/estimates/append). Matches the
 * agent's JSON (camelCase) and the client's create form.
 *
 * <p>Differs from the read {@link EstimateRecord} only by omitting {@code id} (the server
 * generates it). Unlike invoices there is no server-forced status — {@code approved} comes from
 * the request. {@code email} is EMAIL-ONLY / NON-SHEET and never appears here or on the write path.
 */
public record EstimateCreateRequest(
        String estimateNumber,
        String estimateDate,
        String client,
        String property,
        String projectDescription,
        String costToClient,
        String approved,
        String administrativeNotes) {
}
