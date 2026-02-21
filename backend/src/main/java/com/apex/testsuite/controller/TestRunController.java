package com.apex.testsuite.controller;

import com.apex.testsuite.dto.*;
import com.apex.testsuite.service.SalesforceToolingService;
import com.apex.testsuite.service.TestExecutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests")
public class TestRunController {

    private final SalesforceToolingService toolingService;
    private final TestExecutionService executionService;

    public TestRunController(SalesforceToolingService toolingService,
                             TestExecutionService executionService) {
        this.toolingService = toolingService;
        this.executionService = executionService;
    }

    @GetMapping("/classes")
    public ResponseEntity<List<ApexTestClassDTO>> getTestClasses() {
        return ResponseEntity.ok(toolingService.getTestClasses());
    }

    @GetMapping("/org-stats")
    public ResponseEntity<OrgStatsDTO> getOrgStats() {
        return ResponseEntity.ok(toolingService.getOrgStats());
    }

    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runTests(@RequestBody TestRunRequest request) {
        Map<String, Object> result = executionService.startTestRun(request.classIds());
        result = new java.util.HashMap<>(result);
        result.put("status", "queued");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/results/{testRunId}")
    public ResponseEntity<List<TestResultDTO>> getTestResults(@PathVariable String testRunId) {
        return ResponseEntity.ok(toolingService.getTestResults(testRunId));
    }

    @GetMapping("/coverage/{testRunId}")
    public ResponseEntity<List<CodeCoverageDTO>> getCodeCoverage(@PathVariable String testRunId) {
        return ResponseEntity.ok(toolingService.getCodeCoverage(testRunId));
    }
}
