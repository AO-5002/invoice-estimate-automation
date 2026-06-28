package org.example.server.sheets;

import java.util.List;

/**
 * Small helpers for pulling values out of a raw Sheets row ({@code List<Object>}), tolerating
 * short rows (trailing empty cells are omitted by the Sheets API) and null cells.
 */
final class SheetCells {

    private SheetCells() {
    }

    /** Returns the trimmed string at {@code index}, or "" if the cell is missing/null. */
    static String string(List<Object> row, int index) {
        if (index < 0 || index >= row.size() || row.get(index) == null) {
            return "";
        }
        return row.get(index).toString().trim();
    }

    /** Converts the last (zero-based) column index into an A1 column letter, e.g. 0 -> A, 14 -> O. */
    static String columnLetter(int zeroBasedIndex) {
        StringBuilder sb = new StringBuilder();
        int n = zeroBasedIndex;
        while (n >= 0) {
            sb.insert(0, (char) ('A' + (n % 26)));
            n = (n / 26) - 1;
        }
        return sb.toString();
    }
}
