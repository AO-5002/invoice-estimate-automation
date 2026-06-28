package org.example.server.dto;

/**
 * Mirrors the client's {@code EstimateRecord} type
 * (client/app/hooks/useEstimates.ts). Field order matches the client exactly.
 *
 * <p>NOTE: {@code email} is intentionally absent — it is an email-only / non-sheet field on the
 * client and must never be read from or returned by this API.
 */
public record EstimateRecord(
        String estimateNumber,
        String estimateDate,
        String client,
        String property,
        String projectDescription,
        String costToClient,
        String approved,
        String administrativeNotes) {
}
