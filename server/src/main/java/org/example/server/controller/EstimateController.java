package org.example.server.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.server.dto.EstimateCellUpdate;
import org.example.server.dto.EstimateCreateRequest;
import org.example.server.dto.EstimateRecord;
import org.example.server.service.EstimateService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estimates")
@Tag(name = "Estimates", description = "Read and write access to estimate records in Google Sheets.")
public class EstimateController {

    private final EstimateService estimateService;

    public EstimateController(EstimateService estimateService) {
        this.estimateService = estimateService;
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

    @PostMapping("/append")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Append a new estimate",
            description = "Writes a new estimate row to the sheet with a server-generated id, then "
                    + "returns the created record.")
    public EstimateRecord append(@RequestBody EstimateCreateRequest request) {
        return estimateService.append(request);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Update a single estimate cell",
            description = "Resolves the row for the given id and writes exactly one cell "
                    + "(body: { key, value }) to the sheet, leaving the rest of the row untouched.")
    public void updateCell(@PathVariable String id, @RequestBody EstimateCellUpdate update) {
        estimateService.updateField(id, update.key(), update.value());
    }
}
