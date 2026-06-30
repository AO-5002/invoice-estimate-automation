package org.example.server.dto;

import java.util.List;

/**
 * Inbound payload for appending a new invoice row (POST /api/invoices/append). Matches the
 * agent's JSON (camelCase) and the client's create form.
 *
 * <p>Differs from the read {@link InvoiceRecord} on purpose: there is no {@code id} (the server
 * generates it) and no {@code paymentStatus} (the server sets it to PENDING on append), but it
 * does carry {@code completionStatus}. {@code email} is EMAIL-ONLY / NON-SHEET and never appears
 * here or on the write path.
 */
public record InvoiceCreateRequest(
        String invoiceDate,
        String dateWorkCompleted,
        String paymentDue,
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
        String completionStatus,
        List<String> serviceCategories) {
}
