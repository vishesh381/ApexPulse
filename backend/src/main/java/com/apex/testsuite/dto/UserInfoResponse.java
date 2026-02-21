package com.apex.testsuite.dto;

public record UserInfoResponse(
        String displayName,
        String email,
        String username,
        String orgId,
        String orgName
) {
}
