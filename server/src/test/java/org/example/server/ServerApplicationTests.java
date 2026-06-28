package org.example.server;

import com.google.api.services.sheets.v4.Sheets;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class ServerApplicationTests {

    // Replaces the real Sheets client so the context loads without live service-account
    // credentials (which are required only at runtime, supplied via env vars).
    @MockitoBean
    private Sheets sheets;

    @Test
    void contextLoads() {
    }

}
