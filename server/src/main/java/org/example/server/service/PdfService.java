package org.example.server.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.example.server.dto.EstimateRecord;
import org.example.server.dto.InvoiceRecord;
import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;

/**
 * Renders a single invoice/estimate record into a print-ready PDF: resolves the record by its
 * human-facing number (reusing the cached services), fills the matching Thymeleaf template, then
 * converts that HTML to PDF bytes with openhtmltopdf. The bytes are streamed straight back to the
 * caller — nothing is persisted (object storage comes later).
 */
@Service
public class PdfService {

    private final InvoiceService invoiceService;
    private final EstimateService estimateService;
    private final ITemplateEngine templateEngine;

    public PdfService(
            InvoiceService invoiceService,
            EstimateService estimateService,
            ITemplateEngine templateEngine) {
        this.invoiceService = invoiceService;
        this.estimateService = estimateService;
        this.templateEngine = templateEngine;
    }

    /**
     * Builds the PDF for the invoice identified by {@code invoiceNumber}.
     *
     * @throws InvoiceNotFoundException if no invoice has the given invoiceNumber.
     */
    public byte[] invoicePdf(String invoiceNumber) {
        InvoiceRecord record = invoiceService.findByInvoiceNumber(invoiceNumber);
        return toPdf(render("invoice", "invoice", record));
    }

    /**
     * Builds the PDF for the estimate identified by {@code estimateNumber}.
     *
     * @throws EstimateNotFoundException if no estimate has the given estimateNumber.
     */
    public byte[] estimatePdf(String estimateNumber) {
        EstimateRecord record = estimateService.findByEstimateNumber(estimateNumber);
        return toPdf(render("estimate", "estimate", record));
    }

    /** Renders the classpath template {@code templates/<template>.html} with the record bound as {@code variable}. */
    private String render(String template, String variable, Object record) {
        Context context = new Context();
        context.setVariable(variable, record);
        return templateEngine.process(template, context);
    }

    /**
     * Converts a well-formed XHTML string to PDF bytes. No base URI is configured — the templates
     * are fully self-contained (all CSS inline, no external images or stylesheets).
     */
    private byte[] toPdf(String html) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to generate PDF.", e);
        }
    }
}
