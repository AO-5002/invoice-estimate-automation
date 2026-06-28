package org.example.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.server.dto.InvoiceRecord;
import org.example.server.service.InvoiceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@Tag(name = "Invoices", description = "Read-only access to invoice records from Google Sheets.")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    @Operation(
            summary = "List all invoices",
            description = "Returns every invoice row from the sheet (the client handles search, "
                    + "sort, and pagination). Served from an in-memory cache; only the first call "
                    + "or a call after the cache TTL expires hits Google Sheets.")
    public List<InvoiceRecord> listInvoices() {
        return invoiceService.getInvoices();
    }
}
