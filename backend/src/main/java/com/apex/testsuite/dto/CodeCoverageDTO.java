package com.apex.testsuite.dto;

public record CodeCoverageDTO(
        String classOrTriggerName,
        int linesCovered,
        int linesUncovered,
        double coveragePercent
) {
}
