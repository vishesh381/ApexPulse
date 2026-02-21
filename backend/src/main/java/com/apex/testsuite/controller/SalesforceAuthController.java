package com.apex.testsuite.controller;

import com.apex.testsuite.dto.UserInfoResponse;
import com.apex.testsuite.service.SalesforceAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class SalesforceAuthController {

    private final SalesforceAuthService authService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public SalesforceAuthController(SalesforceAuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/login-url")
    public Map<String, String> getLoginUrl() {
        return Map.of("url", authService.buildAuthorizationUrl());
    }

    @GetMapping("/callback")
    public void handleCallback(@RequestParam("code") String code, HttpServletResponse response) throws IOException {
        authService.exchangeCodeForToken(code);
        response.sendRedirect(frontendUrl + "/auth/callback");
    }

    @GetMapping("/status")
    public Map<String, Object> getConnectionStatus() {
        return Map.of("connected", authService.isConnected());
    }

    @GetMapping("/user-info")
    public ResponseEntity<UserInfoResponse> getUserInfo() {
        if (!authService.isConnected()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.getUserInfoResponse());
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat() {
        if (!authService.isConnected()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("connected", false));
        }
        authService.touchActivity();
        return ResponseEntity.ok(Map.of("connected", true));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        authService.logout();
        return ResponseEntity.ok(Map.of("status", "logged_out"));
    }
}
