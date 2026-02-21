package com.apex.testsuite.dto;

import java.util.List;

public record TestRunRequest(
        List<String> classIds
) {
}
