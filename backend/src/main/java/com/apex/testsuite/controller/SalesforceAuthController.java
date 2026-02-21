package com.apex.testsuite.controller;

import com.apex.testsuite.service.SalesforceAuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class SalesforceAuthController {

    private final SalesforceAuthService authService;

    public SalesforceAuthController(SalesforceAuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/login-url")
    public Map<String, String> getLoginUrl() {
        return Map.of("url", authService.buildAuthorizationUrl());
    }

    @GetMapping("/callback")
    public Map<String, String> handleCallback(@RequestParam("code") String code) {
        authService.exchangeCodeForToken(code);
        return Map.of("status", "connected");
    }

    @GetMapping("/status")
    public Map<String, Object> getConnectionStatus() {
        return Map.of("connected", authService.isConnected());
    }
}
