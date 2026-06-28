package org.example.server.sheets;

import org.example.server.dto.InvoiceRecord;

import java.util.Arrays;
import java.util.List;

/**
 * THE single source of truth for invoice sheet layout: each field maps to one zero-based column
 * index. Column order is encoded here and nowhere else — the row-to-DTO parser reads only from
 * this enum, and the A1 read range is derived from it.
 *
 * <p>Assumed sheet layout (columns A..O, in this order). Row 1 is treated as a header and skipped.
 */
public enum InvoiceColumn {
    INVOICE_DATE(0),
    DATE_WORK_COMPLETED(1),
    PAYMENT_DUE(2),
    ESTIMATE_REFERENCE(3),
    INVOICE_NUMBER(4),
    CLIENT(5),
    PROPERTY(6),
    PROJECT_DESCRIPTION(7),
    COST_TO_CLIENT(8),
    LABOR_EXPENSE(9),
    EQUIPMENT_EXPENSE(10),
    MATERIALS_EXPENSE(11),
    ADMINISTRATIVE_NOTES(12),
    COMPLETION_STATUS(13),
    /** Single cell holding a comma-separated list of service categories. */
    SERVICE_CATEGORIES(14);

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
                COMPLETION_STATUS.from(row),
                parseCategories(SERVICE_CATEGORIES.from(row)));
    }

    private static List<String> parseCategories(String cell) {
        if (cell.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(cell.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
