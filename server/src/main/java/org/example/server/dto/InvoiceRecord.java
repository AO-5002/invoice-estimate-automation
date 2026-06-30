package org.example.server.dto;

import java.util.List;

/**
 * Mirrors the client's {@code InvoiceRecord} type
 * (client/app/hooks/useInvoices.ts). Field order matches the client exactly.
 *
 * <p>NOTE: {@code email} is intentionally absent — it is an email-only / non-sheet field on the
 * client and must never be read from or returned by this API.
 *
 * <p>{@code id} is the stable primary key, read from column A. It is server-owned (generated on
 * append) and used to locate the physical row for single-cell updates.
 */
public record InvoiceRecord(
        String id,
        String invoiceDate,
        String dateWorkCompleted,
        String paymentDue,
        String paymentStatus,
        String estimateReference,
        String invoiceNumber,
        String client,
        String property,
        String projectDescription,
        String costToClient,
        String laborExpense,
        String equipmentExpense,
        String materialsExpense,
        String administrativeNotes,
        List<String> serviceCategories) {
}
