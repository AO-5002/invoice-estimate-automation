package org.example.server.dto;

/**
 * Mirrors the client's {@code EstimateRecord} type
 * (client/app/hooks/useEstimates.ts). Field order matches the client exactly.
 *
 * <p>NOTE: {@code email} is intentionally absent — it is an email-only / non-sheet field on the
 * client and must never be read from or returned by this API.
 *
 * <p>{@code id} is the stable primary key, read from column A. It is server-owned (generated on
 * append) and used to locate the physical row for single-cell updates.
 */
public record EstimateRecord(
        String id,
        String estimateNumber,
        String estimateDate,
        String client,
        String property,
        String projectDescription,
        String costToClient,
        String approved,
        String administrativeNotes) {
}
