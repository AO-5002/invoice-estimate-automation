package org.example.server.service;

import org.example.server.config.AppProperties;
import org.example.server.dto.EstimateRecord;
import org.example.server.sheets.EstimateColumn;
import org.example.server.sheets.SheetsReader;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Serves estimates from the in-memory cache, reading from the configured estimates tab on a miss.
 */
@Service
public class EstimateService extends CachingSheetService<EstimateRecord> {

    private final SheetsReader reader;
    private final AppProperties props;

    public EstimateService(SheetsReader reader, AppProperties props) {
        super(props.getCache().getTtlSeconds());
        this.reader = reader;
        this.props = props;
    }

    public List<EstimateRecord> getEstimates() {
        return get();
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
