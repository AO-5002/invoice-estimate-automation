package org.example.server.sheets;

import org.example.server.dto.EstimateCreateRequest;
import org.example.server.dto.EstimateRecord;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * THE single source of truth for estimate sheet layout: each field maps to one zero-based column
 * index. Column order is encoded here and nowhere else — the row-to-DTO parser reads only from
 * this enum, and the A1 read range is derived from it.
 *
 * <p>Physical sheet layout (columns A..I, in this order). Row 1 is treated as a header and skipped.
 * {@link #ID} (column A) is the stable primary key: read into the DTO and server-generated on
 * append. Every other column B..I is a real DTO field — there are no placeholder columns.
 */
public enum EstimateColumn {
    /** Column A. Stable primary key — read into the DTO and server-generated on append. */
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
                ID.from(row),
                ESTIMATE_NUMBER.from(row),
                ESTIMATE_DATE.from(row),
                CLIENT.from(row),
                PROPERTY.from(row),
                PROJECT_DESCRIPTION.from(row),
                COST_TO_CLIENT.from(row),
                APPROVED.from(row),
                ADMINISTRATIVE_NOTES.from(row));
    }

    /** Maps a read-DTO field name (e.g. "costToClient") to the column it lives in. */
    private static final Map<String, EstimateColumn> BY_FIELD_KEY = Map.of(
            "estimateNumber", ESTIMATE_NUMBER,
            "estimateDate", ESTIMATE_DATE,
            "client", CLIENT,
            "property", PROPERTY,
            "projectDescription", PROJECT_DESCRIPTION,
            "costToClient", COST_TO_CLIENT,
            "approved", APPROVED,
            "administrativeNotes", ADMINISTRATIVE_NOTES);

    /**
     * Resolves a single-cell-update field key to its column. {@code id} (immutable primary key) is
     * intentionally not updatable this way, so it returns empty.
     */
    public static Optional<EstimateColumn> byFieldKey(String key) {
        return Optional.ofNullable(BY_FIELD_KEY.get(key));
    }

    /** The A1 cell reference for this column at the given 1-based physical sheet row, e.g. "G7". */
    public String cellA1(int sheetRowNumber) {
        return SheetCells.columnLetter(index) + sheetRowNumber;
    }

    /**
     * Finds the 1-based physical sheet row whose column A matches {@code id}, scanning rows read from
     * {@code A2:A} (so element 0 is sheet row 2). Returns -1 when no row matches.
     */
    public static int rowNumberOf(List<List<Object>> columnARows, String id) {
        for (int i = 0; i < columnARows.size(); i++) {
            if (ID.from(columnARows.get(i)).equals(id)) {
                return i + 2;
            }
        }
        return -1;
    }

    /**
     * Builds a full, ordered row for an append, deriving every position from this enum so column
     * layout stays defined in one place. The server owns {@code id}; every other column is a real
     * field taken straight from the request (no placeholders or checkbox columns to fill).
     */
    public static List<Object> toRow(EstimateCreateRequest req, String id) {
        int size = Arrays.stream(values()).mapToInt(c -> c.index).max().orElse(0) + 1;
        Object[] cells = new Object[size];

        cells[ID.index] = id;
        cells[ESTIMATE_NUMBER.index] = nz(req.estimateNumber());
        cells[ESTIMATE_DATE.index] = nz(req.estimateDate());
        cells[CLIENT.index] = nz(req.client());
        cells[PROPERTY.index] = nz(req.property());
        cells[PROJECT_DESCRIPTION.index] = nz(req.projectDescription());
        cells[COST_TO_CLIENT.index] = nz(req.costToClient());
        cells[APPROVED.index] = nz(req.approved());
        cells[ADMINISTRATIVE_NOTES.index] = nz(req.administrativeNotes());

        return Arrays.asList(cells);
    }

    private static String nz(String value) {
        return value == null ? "" : value;
    }
}
