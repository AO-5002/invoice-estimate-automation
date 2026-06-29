package org.example.server.sheets;

import org.example.server.dto.InvoiceRecord;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * THE single source of truth for invoice sheet layout: each field maps to one zero-based column
 * index. Column order is encoded here and nowhere else — the row-to-DTO parser reads only from
 * this enum, and the A1 read range is derived from it.
 *
 * <p>Physical sheet layout (columns A..V, in this order). Row 1 is treated as a header and skipped.
 * {@link #ID}, {@link #PAYMENT_ID}, and {@link #LINK_TO_INVOICE} exist only to anchor the indices
 * of every other column; they are deliberately not read into the DTO.
 */
public enum InvoiceColumn {
    /** Column A. Alignment placeholder — kept so later indices stay anchored; not read into the DTO. */
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
