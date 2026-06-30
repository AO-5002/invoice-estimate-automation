package org.example.server.sheets;

import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.BatchUpdateSpreadsheetRequest;
import com.google.api.services.sheets.v4.model.DimensionRange;
import com.google.api.services.sheets.v4.model.InsertDimensionRequest;
import com.google.api.services.sheets.v4.model.Request;
import com.google.api.services.sheets.v4.model.Sheet;
import com.google.api.services.sheets.v4.model.Spreadsheet;
import com.google.api.services.sheets.v4.model.ValueRange;
import org.example.server.config.AppProperties;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thin wrapper over the shared {@link Sheets} client that writes to a tab. The mirror of
 * {@link SheetsReader}: knows nothing about invoices vs. estimates — callers pass the tab and the
 * already-built row or cell. Only append and single-cell update are supported; there is no
 * row-deletion path by design.
 */
@Component
public class SheetsWriter {

    private static final String USER_ENTERED = "USER_ENTERED";

    private final Sheets sheets;
    private final SheetsReader reader;
    private final AppProperties props;

    public SheetsWriter(Sheets sheets, SheetsReader reader, AppProperties props) {
        this.sheets = sheets;
        this.reader = reader;
        this.props = props;
    }

    /**
     * Writes {@code row} immediately after the last data row of {@code tab}, found by reading the
     * existing values rather than relying on Sheets' table auto-detection (which appends after the
     * first contiguous block, so an interior blank row would push the write into the gap).
     *
     * <p>The data width is taken from {@code row} (built from the column enum), so the read range
     * and target column letters are derived — never hardcoded. Rows are counted across the full
     * width, not just column A, since legacy rows may have a blank id in column A. The API trims
     * trailing empty rows but keeps interior blanks, so {@code 2 + size} is the true next row.
     *
     * <p>Read-then-write is not atomic: two simultaneous appends could resolve the same next row
     * and one would overwrite the other. Acceptable for this app's single-user usage.
     *
     * @throws SheetsUnavailableException if the Sheets API call fails.
     */
    public void appendAtEnd(String tab, List<Object> row) {
        String lastColumn = SheetCells.columnLetter(row.size() - 1);
        List<List<Object>> existing = reader.read(tab, "A2:" + lastColumn);
        int nextRow = 2 + existing.size();

        String a1 = "'" + tab + "'!A" + nextRow + ":" + lastColumn + nextRow;
        try {
            ValueRange body = new ValueRange().setValues(List.of(row));
            sheets.spreadsheets().values()
                    .update(props.getSheets().getSpreadsheetId(), a1, body)
                    .setValueInputOption(USER_ENTERED)
                    .execute();
        } catch (IOException e) {
            throw new SheetsUnavailableException(
                    "Failed to append a row at " + a1 + " in Google Sheets.", e);
        }
    }

    /**
     * Writes a single cell ({@code a1Cell}, e.g. "L7") of {@code tab} to {@code value}, leaving the
     * rest of the row untouched.
     *
     * @throws SheetsUnavailableException if the Sheets API call fails.
     */
    public void updateCell(String tab, String a1Cell, String value) {
        String a1 = "'" + tab + "'!" + a1Cell;
        try {
            ValueRange body = new ValueRange().setValues(List.of(List.of((Object) value)));
            sheets.spreadsheets().values()
                    .update(props.getSheets().getSpreadsheetId(), a1, body)
                    .setValueInputOption(USER_ENTERED)
                    .execute();
        } catch (IOException e) {
            throw new SheetsUnavailableException(
                    "Failed to update cell " + a1 + " in Google Sheets.", e);
        }
    }
}
