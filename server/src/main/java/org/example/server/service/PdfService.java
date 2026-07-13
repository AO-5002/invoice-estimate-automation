package org.example.server.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.example.server.config.ClientRegistry;
import org.example.server.dto.EstimateRecord;
import org.example.server.dto.InvoiceRecord;
import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URL;
import java.util.Optional;

/**
 * Renders a single invoice/estimate record into a print-ready PDF: resolves the record by its
 * human-facing number (reusing the cached services), fills the matching Thymeleaf template, then
 * converts that HTML to PDF bytes with openhtmltopdf. The bytes are streamed straight back to the
 * caller — nothing is persisted (object storage comes later).
 */
@Service
public class PdfService {

    /**
     * Base URI handed to openhtmltopdf so relative resource references inside the templates (e.g.
     * the {@code ../docs/services_ortiz_logo.png} logo) resolve against the classpath. Points at the
     * {@code /templates/} directory, so {@code ../docs/...} lands on {@code /docs/...}; the same URL
     * resolution works whether the app runs exploded ({@code file:}) or packaged ({@code jar:}).
     */
    private static final String TEMPLATE_BASE_URI = resolveTemplateBaseUri();

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
        return toPdf(renderInvoice(record));
    }

    /**
     * Builds the PDF for the estimate identified by {@code estimateNumber}.
     *
     * @throws EstimateNotFoundException if no estimate has the given estimateNumber.
     */
    public byte[] estimatePdf(String estimateNumber) {
        EstimateRecord record = estimateService.findByEstimateNumber(estimateNumber);
        return toPdf(renderEstimate(record));
    }

    /**
     * Renders the invoice template. On top of the record itself, resolves the "Invoice To"
     * contact block from {@link ClientRegistry}: a preconfigured client gets its registry
     * email/address; an unknown (one-off) client falls back to the row's {@code property} with an
     * empty email — the template omits the email line entirely. Render-time only: the record, the
     * sheet, and the API response are never touched (email is deliberately absent from
     * {@link InvoiceRecord}).
     */
    private String renderInvoice(InvoiceRecord record) {
        Context context = new Context();
        context.setVariable("invoice", record);
        Optional<ClientRegistry.KnownClient> known = ClientRegistry.findByName(record.client());
        context.setVariable("clientEmail",
                known.map(ClientRegistry.KnownClient::email).orElse(""));
        context.setVariable("clientAddress",
                known.map(ClientRegistry.KnownClient::property).orElse(record.property()));
        return templateEngine.process("invoice", context);
    }

    /**
     * Renders the estimate template. Same contract as {@link #renderInvoice(InvoiceRecord)}:
     * resolves the "Estimate To" contact block from {@link ClientRegistry}, falling back to the
     * row's {@code property} and an empty email for unknown (one-off) clients. Render-time only —
     * email is deliberately absent from {@link EstimateRecord}.
     */
    private String renderEstimate(EstimateRecord record) {
        Context context = new Context();
        context.setVariable("estimate", record);
        Optional<ClientRegistry.KnownClient> known = ClientRegistry.findByName(record.client());
        context.setVariable("clientEmail",
                known.map(ClientRegistry.KnownClient::email).orElse(""));
        context.setVariable("clientAddress",
                known.map(ClientRegistry.KnownClient::property).orElse(record.property()));
        return templateEngine.process("estimate", context);
    }

    /**
     * Converts a well-formed XHTML string to PDF bytes. All CSS is inline, but the templates pull
     * the company logo from the classpath ({@code ../docs/services_ortiz_logo.png}), so the
     * {@link #TEMPLATE_BASE_URI} is supplied to let openhtmltopdf resolve that relative reference.
     */
    private byte[] toPdf(String html) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, TEMPLATE_BASE_URI);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to generate PDF.", e);
        }
    }

    private static String resolveTemplateBaseUri() {
        URL templates = PdfService.class.getResource("/templates/");
        if (templates == null) {
            throw new IllegalStateException(
                    "Could not locate /templates/ on the classpath for PDF base URI resolution.");
        }
        return templates.toString();
    }
}
