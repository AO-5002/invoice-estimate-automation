package org.example.server.service;

import org.example.server.config.AppProperties;
import org.example.server.dto.EstimateCreateRequest;
import org.example.server.dto.EstimateRecord;
import org.example.server.sheets.EstimateColumn;
import org.example.server.sheets.SheetsReader;
import org.example.server.sheets.SheetsWriter;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Serves estimates from the in-memory cache, reading from the configured estimates tab on a miss,
 * and writes appends / single-cell updates back to that tab.
 */
@Service
public class EstimateService extends CachingSheetService<EstimateRecord> {

    private final SheetsReader reader;
    private final SheetsWriter writer;
    private final AppProperties props;

    public EstimateService(SheetsReader reader, SheetsWriter writer, AppProperties props) {
        super(props.getCache().getTtlSeconds());
        this.reader = reader;
        this.writer = writer;
        this.props = props;
    }

    public List<EstimateRecord> getEstimates() {
        return get();
    }

    /**
     * Adds a new estimate row with a freshly generated {@code id} (and {@code approved} taken
     * straight from the request — no server-forced status), then evicts the cache so the next read
     * reflects it. Returns the created record.
     *
     * <p>Unlike invoices (which append at the bottom), estimates are inserted at the TOP — the new
     * row becomes row 2, directly under the header, shifting existing rows down.
     */
    public EstimateRecord append(EstimateCreateRequest request) {
        String id = UUID.randomUUID().toString();
        writer.insertAtTop(props.getSheets().getEstimatesTab(), EstimateColumn.toRow(request, id));
        evict();
        return new EstimateRecord(
                id,
                request.estimateNumber(),
                request.estimateDate(),
                request.client(),
                request.property(),
                request.projectDescription(),
                request.costToClient(),
                request.approved(),
                request.administrativeNotes());
    }

    /**
     * Writes a single cell for the estimate identified by {@code id}. The physical row is resolved
     * at write time by reading column A (never trusting a client-supplied row number); the cache is
     * evicted afterward.
     *
     * @throws IllegalArgumentException if {@code key} is not an updatable single-cell field.
     * @throws EstimateNotFoundException if no row has the given {@code id}.
     */
    public void updateField(String id, String key, String value) {
        EstimateColumn column = EstimateColumn.byFieldKey(key)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown or non-updatable estimate field: '" + key + "'."));

        List<List<Object>> columnA =
                reader.read(props.getSheets().getEstimatesTab(), "A2:A");
        int rowNumber = EstimateColumn.rowNumberOf(columnA, id);
        if (rowNumber < 0) {
            throw new EstimateNotFoundException(id);
        }

        writer.updateCell(
                props.getSheets().getEstimatesTab(),
                column.cellA1(rowNumber),
                value == null ? "" : value);
        evict();
    }

    @Override
    protected List<EstimateRecord> fetchFromSheets() {
        List<List<Object>> rows =
                reader.read(props.getSheets().getEstimatesTab(), EstimateColumn.readRange());
        return rows.stream()
                .filter(row -> !row.isEmpty())
                .map(EstimateColumn::parse)
                // Newest estimateDate first; ISO-8601 strings sort lexicographically.
                // Blank/null dates are pushed to the bottom rather than parsed.
                .sorted(Comparator.comparing(
                        EstimateService::dateKey,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    protected String label() {
        return "estimates";
    }

    /** Returns the estimate date, or null when blank, so blank-dated rows sort last. */
    private static String dateKey(EstimateRecord record) {
        String date = record.estimateDate();
        return (date == null || date.isBlank()) ? null : date;
    }
}
