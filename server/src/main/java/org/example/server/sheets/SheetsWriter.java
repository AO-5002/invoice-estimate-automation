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
    private static final String DIMENSION_ROWS = "ROWS";

    private final Sheets sheets;
    private final SheetsReader reader;
    private final AppProperties props;

    /**
     * Tab name -> numeric sheetId (gid). The gid is stable for the life of the spreadsheet, so it is
     * resolved once per tab via a metadata call and cached to avoid a round-trip on every write.
     */
    private final Map<String, Integer> gidByTab = new ConcurrentHashMap<>();

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
     * Inserts {@code row} as the new row 2 of {@code tab} — the top of the data, directly under the
     * header — shifting every existing data row down by one (old row 2 -> row 3, ...). This is the
     * mirror of {@link #appendAtEnd}, but for tabs that grow from the top rather than the bottom.
     *
     * <p>Writing at the top isn't a plain values-write to a computed row: it is a structural change.
     * We first {@code batchUpdate} an {@link InsertDimensionRequest} to open a blank row at row 2
     * (0-based half-open range {@code [1, 2)}, i.e. below the header at index 0), with
     * {@code inheritFromBefore = false} so the new row does NOT copy the header's formatting. That
     * request needs the tab's numeric sheetId (gid), resolved and cached by {@link #gidOf}. We then
     * {@code values().update} the freshly opened {@code A2:{lastColumn}2} with {@code row}, where the
     * last column is derived from {@code row.size()} exactly like {@link #appendAtEnd} — no hardcoded
     * column letters or row numbers.
     *
     * <p>Insert-then-write is not atomic (same caveat as {@link #appendAtEnd}): between the two calls
     * another writer could shift rows again. Acceptable for this app's single-user usage.
     *
     * @throws SheetsUnavailableException if the Sheets API call fails.
     */
    public void insertAtTop(String tab, List<Object> row) {
        int gid = gidOf(tab);
        String lastColumn = SheetCells.columnLetter(row.size() - 1);
        String a1 = "'" + tab + "'!A2:" + lastColumn + "2";
        try {
            InsertDimensionRequest insert = new InsertDimensionRequest()
                    .setRange(new DimensionRange()
                            .setSheetId(gid)
                            .setDimension(DIMENSION_ROWS)
                            .setStartIndex(1)
                            .setEndIndex(2))
                    .setInheritFromBefore(false);
            BatchUpdateSpreadsheetRequest batch = new BatchUpdateSpreadsheetRequest()
                    .setRequests(List.of(new Request().setInsertDimension(insert)));
            sheets.spreadsheets()
                    .batchUpdate(props.getSheets().getSpreadsheetId(), batch)
                    .execute();

            ValueRange body = new ValueRange().setValues(List.of(row));
            sheets.spreadsheets().values()
                    .update(props.getSheets().getSpreadsheetId(), a1, body)
                    .setValueInputOption(USER_ENTERED)
                    .execute();
        } catch (IOException e) {
            throw new SheetsUnavailableException(
                    "Failed to insert a row at the top (" + a1 + ") in Google Sheets.", e);
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

    /**
     * Resolves {@code tab}'s numeric sheetId (gid), which structural requests like
     * {@link InsertDimensionRequest} require (they address sheets by gid, not by name). The gid is
     * stable for the life of the spreadsheet, so the metadata lookup happens once per tab and the
     * result is cached.
     *
     * @throws SheetsUnavailableException if the metadata call fails or the tab has no matching sheet.
     */
    private int gidOf(String tab) {
        Integer cached = gidByTab.get(tab);
        if (cached != null) {
            return cached;
        }
        try {
            Spreadsheet spreadsheet = sheets.spreadsheets()
                    .get(props.getSheets().getSpreadsheetId())
                    .execute();
            for (Sheet sheet : spreadsheet.getSheets()) {
                if (tab.equals(sheet.getProperties().getTitle())) {
                    int gid = sheet.getProperties().getSheetId();
                    gidByTab.put(tab, gid);
                    return gid;
                }
            }
            throw new SheetsUnavailableException(
                    "No tab named '" + tab + "' exists in the configured spreadsheet.", null);
        } catch (IOException e) {
            throw new SheetsUnavailableException(
                    "Failed to resolve the sheetId (gid) for tab '" + tab + "' in Google Sheets.", e);
        }
    }
}
