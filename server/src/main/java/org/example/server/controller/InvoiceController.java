package org.example.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.server.dto.InvoiceCellUpdate;
import org.example.server.dto.InvoiceCreateRequest;
import org.example.server.dto.InvoiceRecord;
import org.example.server.service.InvoiceService;
import org.example.server.service.PdfService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@Tag(name = "Invoices", description = "Read and write access to invoice records in Google Sheets.")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final PdfService pdfService;

    public InvoiceController(InvoiceService invoiceService, PdfService pdfService) {
        this.invoiceService = invoiceService;
        this.pdfService = pdfService;
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

    @PostMapping("/append")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Append a new invoice",
            description = "Writes a new invoice row to the sheet with a server-generated id and "
                    + "PENDING payment status, then returns the created record.")
    public InvoiceRecord append(@RequestBody InvoiceCreateRequest request) {
        return invoiceService.append(request);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Update a single invoice cell",
            description = "Resolves the row for the given id and writes exactly one cell "
                    + "(body: { key, value }) to the sheet, leaving the rest of the row untouched.")
    public void updateCell(@PathVariable String id, @RequestBody InvoiceCellUpdate update) {
        invoiceService.updateField(id, update.key(), update.value());
    }

    @GetMapping("/{invoiceNumber}/pdf")
    @Operation(
            summary = "Generate an invoice PDF",
            description = "Resolves the invoice for the given invoiceNumber, renders it into an HTML "
                    + "template, and streams back a generated PDF as an attachment. The PDF is not "
                    + "persisted. Returns 404 if no invoice has the invoiceNumber.")
    public ResponseEntity<byte[]> invoicePdf(@PathVariable String invoiceNumber) {
        InvoiceRecord record = invoiceService.findByInvoiceNumber(invoiceNumber);
        byte[] pdf = pdfService.invoicePdf(invoiceNumber);
        String filename = "invoice-" + PdfFilenames.slug(record.invoiceNumber(), record.id()) + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(pdf);
    }
}
