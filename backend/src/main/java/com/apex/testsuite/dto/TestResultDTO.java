package com.apex.testsuite.dto;

public record TestResultDTO(
        String className,
        String methodName,
        String outcome,
        String message,
        String stackTrace,
        long runTimeMs
) {
}
