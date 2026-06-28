package org.example.server.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * Holds the last-fetched list plus a fetch timestamp and serves it until the TTL expires. Acts as
 * the rate-limit guard in front of Google Sheets: the first request (or the first after the TTL
 * lapses) does a real fetch; everything else is served from the in-memory field.
 *
 * <p>A double-checked lock guards the refresh so concurrent requests don't trigger duplicate
 * fetches — only one thread fetches while the others wait and then read the fresh cache.
 */
public abstract class CachingSheetService<T> {

    private final Logger log = LoggerFactory.getLogger(getClass());
    private final long ttlMillis;
    private final Object refreshLock = new Object();

    private volatile List<T> cache;
    private volatile long fetchedAtMillis;

    protected CachingSheetService(long ttlSeconds) {
        this.ttlMillis = ttlSeconds * 1000L;
    }

    /** Performs the real read from Google Sheets. */
    protected abstract List<T> fetchFromSheets();

    /** Human-readable label for log lines, e.g. "invoices". */
    protected abstract String label();

    public List<T> get() {
        List<T> current = cache;
        if (isFresh(current)) {
            log.info("Cache hit for {} ({} records, age {}ms).",
                    label(), current.size(), age());
            return current;
        }

        synchronized (refreshLock) {
            // Re-check: another thread may have refreshed while we waited on the lock.
            current = cache;
            if (isFresh(current)) {
                log.info("Cache hit for {} (refreshed by concurrent request).", label());
                return current;
            }

            log.info("Cache miss for {} — fetching from Google Sheets.", label());
            List<T> fresh = fetchFromSheets();
            cache = fresh;
            fetchedAtMillis = System.currentTimeMillis();
            log.info("Fetched {} {} records from Google Sheets.", fresh.size(), label());
            return fresh;
        }
    }

    private boolean isFresh(List<T> current) {
        return current != null && age() < ttlMillis;
    }

    private long age() {
        return System.currentTimeMillis() - fetchedAtMillis;
    }
}
