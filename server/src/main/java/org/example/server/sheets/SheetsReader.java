package org.example.server.sheets;

import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.ValueRange;
import org.example.server.config.AppProperties;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

/**
 * Thin wrapper over the shared {@link Sheets} client that reads a raw range of rows from a tab.
 * Knows nothing about invoices vs. estimates — callers pass the tab and A1 range.
 */
@Component
public class SheetsReader {

    private final Sheets sheets;
    private final AppProperties props;

    public SheetsReader(Sheets sheets, AppProperties props) {
        this.sheets = sheets;
        this.props = props;
    }

    /**
     * Reads {@code range} from {@code tab} of the configured spreadsheet.
     *
     * @return the rows (each a list of cell values); empty list when the range has no data.
     * @throws SheetsUnavailableException if the Sheets API call fails.
     */
    public List<List<Object>> read(String tab, String range) {
        String a1 = "'" + tab + "'!" + range;
        try {
            ValueRange response = sheets.spreadsheets().values()
                    .get(props.getSheets().getSpreadsheetId(), a1)
                    .execute();
            List<List<Object>> values = response.getValues();
            return values == null ? List.of() : values;
        } catch (IOException e) {
            throw new SheetsUnavailableException(
                    "Failed to read range " + a1 + " from Google Sheets.", e);
        }
    }
}
