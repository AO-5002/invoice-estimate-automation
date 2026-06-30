package org.example.server.service;

import org.example.server.config.AppProperties;
import org.example.server.dto.InvoiceCreateRequest;
import org.example.server.dto.InvoiceRecord;
import org.example.server.sheets.InvoiceColumn;
import org.example.server.sheets.SheetsReader;
import org.example.server.sheets.SheetsWriter;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Serves invoices from the in-memory cache, reading from the configured invoices tab on a miss,
 * and writes appends / single-cell updates back to that tab.
 */
@Service
public class InvoiceService extends CachingSheetService<InvoiceRecord> {

    private final SheetsReader reader;
    private final SheetsWriter writer;
    private final AppProperties props;

    public InvoiceService(SheetsReader reader, SheetsWriter writer, AppProperties props) {
        super(props.getCache().getTtlSeconds());
        this.reader = reader;
        this.writer = writer;
        this.props = props;
    }

    public List<InvoiceRecord> getInvoices() {
        return get();
    }

    /**
     * Appends a new invoice row with a freshly generated {@code id} and server-set PENDING payment
     * status, then evicts the cache so the next read reflects it. Returns the created record.
     */
    public InvoiceRecord append(InvoiceCreateRequest request) {
        String id = UUID.randomUUID().toString();
        writer.appendAtEnd(props.getSheets().getInvoicesTab(), InvoiceColumn.toRow(request, id));
        evict();
        return new InvoiceRecord(
                id,
                request.invoiceDate(),
                request.dateWorkCompleted(),
                request.paymentDue(),
                "PENDING",
                request.estimateReference(),
                request.invoiceNumber(),
                request.client(),
                request.property(),
                request.projectDescription(),
                request.costToClient(),
                request.laborExpense(),
                request.equipmentExpense(),
                request.materialsExpense(),
                request.administrativeNotes(),
                request.serviceCategories() == null ? List.of() : request.serviceCategories());
    }

    /**
     * Writes a single cell for the invoice identified by {@code id}. The physical row is resolved at
     * write time by reading column A (never trusting a client-supplied row number); the cache is
     * evicted afterward.
     *
     * @throws IllegalArgumentException if {@code key} is not an updatable single-cell field.
     * @throws InvoiceNotFoundException if no row has the given {@code id}.
     */
    public void updateField(String id, String key, String value) {
        InvoiceColumn column = InvoiceColumn.byFieldKey(key)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown or non-updatable invoice field: '" + key + "'."));

        List<List<Object>> columnA =
                reader.read(props.getSheets().getInvoicesTab(), "A2:A");
        int rowNumber = InvoiceColumn.rowNumberOf(columnA, id);
        if (rowNumber < 0) {
            throw new InvoiceNotFoundException(id);
        }

        writer.updateCell(
                props.getSheets().getInvoicesTab(),
                column.cellA1(rowNumber),
                value == null ? "" : value);
        evict();
    }

    @Override
    protected List<InvoiceRecord> fetchFromSheets() {
        List<List<Object>> rows =
                reader.read(props.getSheets().getInvoicesTab(), InvoiceColumn.readRange());
        return rows.stream()
                .filter(row -> !row.isEmpty())
                .map(InvoiceColumn::parse)
                // Newest invoiceDate first; ISO-8601 strings sort lexicographically.
                // Blank/null dates are pushed to the bottom rather than parsed.
                .sorted(Comparator.comparing(
                        InvoiceService::dateKey,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    protected String label() {
        return "invoices";
    }

    /** Returns the invoice date, or null when blank, so blank-dated rows sort last. */
    private static String dateKey(InvoiceRecord record) {
        String date = record.invoiceDate();
        return (date == null || date.isBlank()) ? null : date;
    }
}
