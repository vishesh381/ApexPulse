package com.apex.testsuite.dto;

public record TestProgressDTO(
        String testRunId,
        Long dbRunId,
        String status,
        int totalTests,
        int completedTests,
        int passCount,
        int failCount,
        double percentComplete
) {
}
