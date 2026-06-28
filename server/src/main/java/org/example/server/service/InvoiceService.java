package org.example.server.service;

import org.example.server.config.AppProperties;
import org.example.server.dto.InvoiceRecord;
import org.example.server.sheets.InvoiceColumn;
import org.example.server.sheets.SheetsReader;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Serves invoices from the in-memory cache, reading from the configured invoices tab on a miss.
 */
@Service
public class InvoiceService extends CachingSheetService<InvoiceRecord> {

    private final SheetsReader reader;
    private final AppProperties props;

    public InvoiceService(SheetsReader reader, AppProperties props) {
        super(props.getCache().getTtlSeconds());
        this.reader = reader;
        this.props = props;
    }

    public List<InvoiceRecord> getInvoices() {
        return get();
    }

    @Override
    protected List<InvoiceRecord> fetchFromSheets() {
        List<List<Object>> rows =
                reader.read(props.getSheets().getInvoicesTab(), InvoiceColumn.readRange());
        return rows.stream()
                .filter(row -> !row.isEmpty())
                .map(InvoiceColumn::parse)
                .toList();
    }

    @Override
    protected String label() {
        return "invoices";
    }
}
