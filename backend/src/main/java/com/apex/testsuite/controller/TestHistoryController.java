package com.apex.testsuite.controller;

import com.apex.testsuite.dto.CodeCoverageDTO;
import com.apex.testsuite.dto.TestResultDTO;
import com.apex.testsuite.entity.CoverageSnapshot;
import com.apex.testsuite.entity.TestResult;
import com.apex.testsuite.entity.TestRun;
import com.apex.testsuite.repository.CoverageSnapshotRepository;
import com.apex.testsuite.repository.TestResultRepository;
import com.apex.testsuite.service.SalesforceAuthService;
import com.apex.testsuite.service.TestHistoryService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
public class TestHistoryController {

    private final TestHistoryService historyService;
    private final TestResultRepository testResultRepository;
    private final CoverageSnapshotRepository coverageSnapshotRepository;
    private final SalesforceAuthService authService;

    public TestHistoryController(TestHistoryService historyService,
                                 TestResultRepository testResultRepository,
                                 CoverageSnapshotRepository coverageSnapshotRepository,
                                 SalesforceAuthService authService) {
        this.historyService = historyService;
        this.testResultRepository = testResultRepository;
        this.coverageSnapshotRepository = coverageSnapshotRepository;
        this.authService = authService;
    }

    @GetMapping("/runs")
    public ResponseEntity<Map<String, Object>> getRunHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<TestRun> runs = historyService.getRunHistory(page, size);
        Map<String, Object> response = new HashMap<>();
        response.put("runs", runs.getContent().stream().map(this::mapRun).toList());
        response.put("totalPages", runs.getTotalPages());
        response.put("totalElements", runs.getTotalElements());
        response.put("currentPage", page);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/runs/{id}")
    public ResponseEntity<Map<String, Object>> getRunDetail(@PathVariable Long id) {
        return historyService.getRunById(id).map(run -> {
            Map<String, Object> response = new HashMap<>(mapRun(run));

            List<TestResult> results = testResultRepository.findByTestRunIdOrderByClassNameAscMethodNameAsc(id);
            response.put("results", results.stream().map(r -> new TestResultDTO(
                    r.getClassName(), r.getMethodName(), r.getOutcome().name(),
                    r.getMessage(), r.getStackTrace(), r.getRunTimeMs()
            )).toList());

            List<CoverageSnapshot> coverage = coverageSnapshotRepository.findByTestRunIdOrderByClassNameAsc(id);
            response.put("coverage", coverage.stream().map(c -> new CodeCoverageDTO(
                    c.getClassName(), c.getLinesCovered(), c.getLinesUncovered(), c.getCoveragePercent()
            )).toList());

            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/trends/pass-rate")
    public ResponseEntity<List<Map<String, Object>>> getPassRateTrend(
            @RequestParam(defaultValue = "30") int days) {
        String orgId = getOrgId();
        return ResponseEntity.ok(historyService.getPassRateTrend(orgId, days));
    }

    @GetMapping("/trends/coverage")
    public ResponseEntity<List<Map<String, Object>>> getCoverageTrend(
            @RequestParam(defaultValue = "30") int days) {
        String orgId = getOrgId();
        return ResponseEntity.ok(historyService.getCoverageTrend(orgId, days));
    }

    private Map<String, Object> mapRun(TestRun run) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", run.getId());
        map.put("asyncApexJobId", run.getAsyncApexJobId());
        map.put("status", run.getStatus().name());
        map.put("totalTests", run.getTotalTests());
        map.put("passCount", run.getPassCount());
        map.put("failCount", run.getFailCount());
        map.put("startedAt", run.getStartedAt() != null ? run.getStartedAt().toString() : null);
        map.put("completedAt", run.getCompletedAt() != null ? run.getCompletedAt().toString() : null);
        return map;
    }

    private String getOrgId() {
        try {
            Map<String, Object> userInfo = authService.getUserInfo();
            return userInfo != null ? (String) userInfo.get("organization_id") : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
