package org.example.server.controller;

/**
 * Builds safe {@code Content-Disposition} filename slugs for generated PDFs. Falls back to the
 * record id when the human-facing number is blank, and strips anything outside a conservative
 * filename-safe set so the header can't be broken by odd sheet values.
 */
final class PdfFilenames {

    private PdfFilenames() {
    }

    /** Returns {@code preferred} sanitized, or the {@code fallback} id when {@code preferred} is blank. */
    static String slug(String preferred, String fallback) {
        String source = (preferred == null || preferred.isBlank()) ? fallback : preferred;
        String cleaned = source.trim().replaceAll("[^A-Za-z0-9._-]", "-");
        return cleaned.isBlank() ? "document" : cleaned;
    }
}
