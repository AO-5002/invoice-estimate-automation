package org.example.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.server.dto.EstimateRecord;
import org.example.server.service.EstimateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estimates")
@Tag(name = "Estimates", description = "Read-only access to estimate records from Google Sheets.")
public class EstimateController {

    private final EstimateService estimateService;

    public EstimateController(EstimateService estimateService) {
        this.estimateService = estimateService;
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello, world!";
    }

    @GetMapping
    @Operation(
            summary = "List all estimates",
            description = "Returns every estimate row from the sheet (the client handles search, "
                    + "sort, and pagination). Served from an in-memory cache; only the first call "
                    + "or a call after the cache TTL expires hits Google Sheets.")
    public List<EstimateRecord> listEstimates() {
        return estimateService.getEstimates();
    }
}
