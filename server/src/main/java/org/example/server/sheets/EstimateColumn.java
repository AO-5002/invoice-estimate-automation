package org.example.server.sheets;

import org.example.server.dto.EstimateRecord;

import java.util.Arrays;
import java.util.List;

/**
 * THE single source of truth for estimate sheet layout: each field maps to one zero-based column
 * index. Column order is encoded here and nowhere else — the row-to-DTO parser reads only from
 * this enum, and the A1 read range is derived from it.
 *
 * <p>Physical sheet layout (columns A..I, in this order). Row 1 is treated as a header and skipped.
 * {@link #ID} exists only to anchor the indices of every other column; it is deliberately not read
 * into the DTO. (The estimate tab, like the invoice tab, has a leading column the DTO ignores.)
 */
public enum EstimateColumn {
    /** Column A. Alignment placeholder — kept so later indices stay anchored; not read into the DTO. */
    ID(0),
    ESTIMATE_NUMBER(1),
    ESTIMATE_DATE(2),
    CLIENT(3),
    PROPERTY(4),
    PROJECT_DESCRIPTION(5),
    COST_TO_CLIENT(6),
    APPROVED(7),
    ADMINISTRATIVE_NOTES(8);

    private final int index;

    EstimateColumn(int index) {
        this.index = index;
    }

    private String from(List<Object> row) {
        return SheetCells.string(row, index);
    }

    /** A1 range covering all mapped columns, starting at row 2 to skip the header row. */
    public static String readRange() {
        int last = Arrays.stream(values()).mapToInt(c -> c.index).max().orElse(0);
        return "A2:" + SheetCells.columnLetter(last);
    }

    /** Parses one raw Sheets row into an {@link EstimateRecord}. */
    public static EstimateRecord parse(List<Object> row) {
        return new EstimateRecord(
                ESTIMATE_NUMBER.from(row),
                ESTIMATE_DATE.from(row),
                CLIENT.from(row),
                PROPERTY.from(row),
                PROJECT_DESCRIPTION.from(row),
                COST_TO_CLIENT.from(row),
                APPROVED.from(row),
                ADMINISTRATIVE_NOTES.from(row));
    }
}
