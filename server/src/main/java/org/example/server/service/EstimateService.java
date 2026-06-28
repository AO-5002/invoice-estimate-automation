package org.example.server.service;

import org.example.server.config.AppProperties;
import org.example.server.dto.EstimateRecord;
import org.example.server.sheets.EstimateColumn;
import org.example.server.sheets.SheetsReader;
import org.springframework.stereotype.Service;

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
                .toList();
    }

    @Override
    protected String label() {
        return "estimates";
    }
}
