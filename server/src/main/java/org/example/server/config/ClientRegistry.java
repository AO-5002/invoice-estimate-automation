package org.example.server.config;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Server-side registry of preconfigured (recurring) clients, mirroring the frontend registry in
 * {@code client/app/config/ClientConfig.ts}. Used at PDF render time only — entries are never
 * persisted to the sheet, and the sheet stays the source of truth for everything else.
 *
 * <p>One client may appear in historical rows under more than one spelling; every accepted
 * spelling goes in that client's {@code names} so they all resolve to the same entry.
 *
 * <p>To add a client, append a {@link KnownClient} to {@link #KNOWN_CLIENTS}. To accept a new
 * spelling of an existing client, add it to that client's {@code names}.
 */
public final class ClientRegistry {

    /** One preconfigured client: every accepted name spelling plus its contact defaults. */
    public record KnownClient(Set<String> names, String email, String property) {
    }

    private static final List<KnownClient> KNOWN_CLIENTS = List.of(
            new KnownClient(Set.of("EL PAISANO", "PAISANO"), "TODO@example.com", "TODO — address"),
            new KnownClient(Set.of("STONEGATE"), "TODO@example.com", "TODO — address"),
            new KnownClient(Set.of("NORTH BLUFF ESTATES"), "TODO@example.com", "TODO — address"),
            new KnownClient(Set.of("SPRING HOLLOW APARTMENTS"), "TODO@example.com", "TODO — address"));

    /**
     * Finds the client whose {@code names} contain {@code name} (trimmed, case-insensitive).
     * Empty for {@code null}, unknown, and one-off clients.
     */
    public static Optional<KnownClient> findByName(String name) {
        if (name == null) {
            return Optional.empty();
        }
        String query = name.trim();
        return KNOWN_CLIENTS.stream()
                .filter(client -> client.names().stream().anyMatch(n -> n.equalsIgnoreCase(query)))
                .findFirst();
    }

    private ClientRegistry() {
    }
}
