package com.apex.testsuite.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests")
public class TestRunController {

    @GetMapping("/classes")
    public List<Map<String, String>> getTestClasses() {
        // TODO: Fetch Apex test classes from Salesforce via Tooling API
        return List.of();
    }

    @PostMapping("/run")
    public Map<String, String> runTests(@RequestBody Map<String, List<String>> request) {
        // TODO: Trigger async test run via Tooling API
        return Map.of("status", "queued", "message", "Test execution will be implemented with SF integration");
    }

    @GetMapping("/results/{testRunId}")
    public Map<String, Object> getTestResults(@PathVariable String testRunId) {
        // TODO: Fetch test results from Salesforce
        return Map.of("testRunId", testRunId, "status", "pending");
    }
}
