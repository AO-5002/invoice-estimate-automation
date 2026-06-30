package org.example.server.sheets;

import org.example.server.dto.InvoiceCreateRequest;
import org.example.server.dto.InvoiceRecord;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * THE single source of truth for invoice sheet layout: each field maps to one zero-based column
 * index. Column order is encoded here and nowhere else — the row-to-DTO parser reads only from
 * this enum, and the A1 read range is derived from it.
 *
 * <p>Physical sheet layout (columns A..V, in this order). Row 1 is treated as a header and skipped.
 * {@link #PAYMENT_ID}, {@link #LINK_TO_INVOICE}, and {@link #COMPLETION_STATUS} exist only to anchor
 * the indices of every other column; they are deliberately not read into the DTO. {@link #ID}
 * (column A) is the stable primary key: read into the DTO and written on append.
 */
public enum InvoiceColumn {
    /** Column A. Stable primary key — read into the DTO and server-generated on append. */
    ID(0),
    INVOICE_DATE(1),
    DATE_WORK_COMPLETED(2),
    PAYMENT_DUE(3),
    PAYMENT_STATUS(4),
    /** Column F. Alignment placeholder — not read into the DTO. */
    PAYMENT_ID(5),
    ESTIMATE_REFERENCE(6),
    INVOICE_NUMBER(7),
    CLIENT(8),
    PROPERTY(9),
    PROJECT_DESCRIPTION(10),
    COST_TO_CLIENT(11),
    /** Column M. Alignment placeholder — not read into the DTO. */
    LINK_TO_INVOICE(12),
    LABOR_EXPENSE(13),
    EQUIPMENT_EXPENSE(14),
    MATERIALS_EXPENSE(15),
    ADMINISTRATIVE_NOTES(16),
    /** Column R. Alignment placeholder — kept so later indices stay anchored; not read into the DTO. */
    COMPLETION_STATUS(17),
    EXCAVATION(18),
    PLUMBING(19),
    REMODELING(20),
    TREE_TRIMMING(21);

    private final int index;

    InvoiceColumn(int index) {
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

    /** Parses one raw Sheets row into an {@link InvoiceRecord}. */
    public static InvoiceRecord parse(List<Object> row) {
        return new InvoiceRecord(
                ID.from(row),
                INVOICE_DATE.from(row),
                DATE_WORK_COMPLETED.from(row),
                PAYMENT_DUE.from(row),
                PAYMENT_STATUS.from(row),
                ESTIMATE_REFERENCE.from(row),
                INVOICE_NUMBER.from(row),
                CLIENT.from(row),
                PROPERTY.from(row),
                PROJECT_DESCRIPTION.from(row),
                COST_TO_CLIENT.from(row),
                LABOR_EXPENSE.from(row),
                EQUIPMENT_EXPENSE.from(row),
                MATERIALS_EXPENSE.from(row),
                ADMINISTRATIVE_NOTES.from(row),
                parseCategories(row));
    }

    /** Maps a read-DTO field name (e.g. "costToClient") to the column it lives in. */
    private static final Map<String, InvoiceColumn> BY_FIELD_KEY = Map.ofEntries(
            Map.entry("invoiceDate", INVOICE_DATE),
            Map.entry("dateWorkCompleted", DATE_WORK_COMPLETED),
            Map.entry("paymentDue", PAYMENT_DUE),
            Map.entry("paymentStatus", PAYMENT_STATUS),
            Map.entry("estimateReference", ESTIMATE_REFERENCE),
            Map.entry("invoiceNumber", INVOICE_NUMBER),
            Map.entry("client", CLIENT),
            Map.entry("property", PROPERTY),
            Map.entry("projectDescription", PROJECT_DESCRIPTION),
            Map.entry("costToClient", COST_TO_CLIENT),
            Map.entry("laborExpense", LABOR_EXPENSE),
            Map.entry("equipmentExpense", EQUIPMENT_EXPENSE),
            Map.entry("materialsExpense", MATERIALS_EXPENSE),
            Map.entry("administrativeNotes", ADMINISTRATIVE_NOTES));

    /**
     * Resolves a single-cell-update field key to its column. {@code id} (immutable primary key) and
     * {@code serviceCategories} (spans four columns, not one cell) are intentionally not updatable
     * this way, so they return empty.
     */
    public static Optional<InvoiceColumn> byFieldKey(String key) {
        return Optional.ofNullable(BY_FIELD_KEY.get(key));
    }

    /** The A1 cell reference for this column at the given 1-based physical sheet row, e.g. "L7". */
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
     * layout stays defined in one place. The server owns {@code id} and sets payment status to
     * PENDING; the {@code PAYMENT_ID}/{@code LINK_TO_INVOICE} placeholders stay blank; and
     * {@code parseCategories} is reversed into the four TRUE/FALSE checkbox columns.
     */
    public static List<Object> toRow(InvoiceCreateRequest req, String id) {
        int size = Arrays.stream(values()).mapToInt(c -> c.index).max().orElse(0) + 1;
        Object[] cells = new Object[size];
        Arrays.fill(cells, "");

        cells[ID.index] = id;
        cells[INVOICE_DATE.index] = nz(req.invoiceDate());
        cells[DATE_WORK_COMPLETED.index] = nz(req.dateWorkCompleted());
        cells[PAYMENT_DUE.index] = nz(req.paymentDue());
        cells[PAYMENT_STATUS.index] = "PENDING";
        cells[ESTIMATE_REFERENCE.index] = nz(req.estimateReference());
        cells[INVOICE_NUMBER.index] = nz(req.invoiceNumber());
        cells[CLIENT.index] = nz(req.client());
        cells[PROPERTY.index] = nz(req.property());
        cells[PROJECT_DESCRIPTION.index] = nz(req.projectDescription());
        cells[COST_TO_CLIENT.index] = nz(req.costToClient());
        cells[LABOR_EXPENSE.index] = nz(req.laborExpense());
        cells[EQUIPMENT_EXPENSE.index] = nz(req.equipmentExpense());
        cells[MATERIALS_EXPENSE.index] = nz(req.materialsExpense());
        cells[ADMINISTRATIVE_NOTES.index] = nz(req.administrativeNotes());
        cells[COMPLETION_STATUS.index] = nz(req.completionStatus());

        List<String> categories =
                req.serviceCategories() == null ? List.of() : req.serviceCategories();
        cells[EXCAVATION.index] = checkbox(categories.contains("Excavation"));
        cells[PLUMBING.index] = checkbox(categories.contains("Plumbing"));
        cells[REMODELING.index] = checkbox(categories.contains("Remodeling"));
        cells[TREE_TRIMMING.index] = checkbox(categories.contains("Tree Trimming"));

        return Arrays.asList(cells);
    }

    private static String nz(String value) {
        return value == null ? "" : value;
    }

    /** Writes the canonical checkbox value the sheet expects (matches {@link #isChecked}). */
    private static String checkbox(boolean checked) {
        return checked ? "TRUE" : "FALSE";
    }

    /**
     * Builds the ordered list of checked service categories from the four checkbox columns. Emits
     * the client's canonical spellings (not the sheet's header text, which contains typos), so the
     * client can filter on stable names.
     */
    private static List<String> parseCategories(List<Object> row) {
        List<String> categories = new ArrayList<>();
        if (isChecked(EXCAVATION.from(row))) {
            categories.add("Excavation");
        }
        if (isChecked(PLUMBING.from(row))) {
            categories.add("Plumbing");
        }
        if (isChecked(REMODELING.from(row))) {
            categories.add("Remodeling");
        }
        if (isChecked(TREE_TRIMMING.from(row))) {
            categories.add("Tree Trimming");
        }
        return List.copyOf(categories);
    }

    /**
     * A category cell counts as checked when it has a non-empty value that is not a falsy marker.
     * Handles TRUE/FALSE checkbox cells and "x" marks.
     */
    private static boolean isChecked(String cell) {
        String value = cell.trim();
        if (value.isEmpty()) {
            return false;
        }
        return !value.equalsIgnoreCase("false")
                && !value.equalsIgnoreCase("no")
                && !value.equals("0");
    }
}
