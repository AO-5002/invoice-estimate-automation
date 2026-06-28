package org.example.server.sheets;

import org.example.server.dto.EstimateRecord;

import java.util.Arrays;
import java.util.List;

/**
 * THE single source of truth for estimate sheet layout: each field maps to one zero-based column
 * index. Column order is encoded here and nowhere else — the row-to-DTO parser reads only from
 * this enum, and the A1 read range is derived from it.
 *
 * <p>Assumed sheet layout (columns A..H, in this order). Row 1 is treated as a header and skipped.
 */
public enum EstimateColumn {
    ESTIMATE_NUMBER(0),
    ESTIMATE_DATE(1),
    CLIENT(2),
    PROPERTY(3),
    PROJECT_DESCRIPTION(4),
    COST_TO_CLIENT(5),
    APPROVED(6),
    ADMINISTRATIVE_NOTES(7);

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
