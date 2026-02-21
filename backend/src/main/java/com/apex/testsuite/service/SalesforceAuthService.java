package com.apex.testsuite.service;

import com.apex.testsuite.dto.UserInfoResponse;
import com.apex.testsuite.entity.AuthSession;
import com.apex.testsuite.exception.AuthenticationRequiredException;
import com.apex.testsuite.repository.AuthSessionRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class SalesforceAuthService {

    private static final Logger log = LoggerFactory.getLogger(SalesforceAuthService.class);

    @Value("${salesforce.client-id}")
    private String clientId;

    @Value("${salesforce.client-secret}")
    private String clientSecret;

    @Value("${salesforce.login-url}")
    private String loginUrl;

    @Value("${salesforce.redirect-uri}")
    private String redirectUri;

    @Value("${app.session.inactivity-timeout-minutes:120}")
    private int inactivityTimeoutMinutes;

    private final AuthSessionRepository sessionRepository;
    private final TokenEncryptionService encryptionService;
    private final RestTemplate restTemplate = new RestTemplate();

    // In-memory cache of current session
    private String accessToken;
    private String refreshToken;
    private String instanceUrl;
    private Instant lastActivityTime;

    public SalesforceAuthService(AuthSessionRepository sessionRepository,
                                 TokenEncryptionService encryptionService) {
        this.sessionRepository = sessionRepository;
        this.encryptionService = encryptionService;
    }

    @PostConstruct
    public void loadSessionFromDb() {
        try {
        sessionRepository.findTopByOrderByLastActivityAtDesc().ifPresent(session -> {
            Instant lastActivity = session.getLastActivityAt();
            long minutesSinceActivity = Duration.between(lastActivity, Instant.now()).toMinutes();

            if (minutesSinceActivity >= inactivityTimeoutMinutes) {
                log.info("Stored session expired ({} min inactive, limit {}). Clearing.",
                        minutesSinceActivity, inactivityTimeoutMinutes);
                clearSession();
                return;
            }

            // Restore tokens from DB
            this.accessToken = encryptionService.decrypt(session.getEncryptedAccessToken());
            this.refreshToken = encryptionService.decrypt(session.getEncryptedRefreshToken());
            this.instanceUrl = session.getInstanceUrl();
            this.lastActivityTime = lastActivity;

            if (this.accessToken != null) {
                log.info("Restored session from DB for org {} (last active {} min ago)",
                        session.getOrgId(), minutesSinceActivity);
                // Proactively refresh access token since it may have expired
                tryRefreshToken();
            }
        });
        } catch (Exception e) {
            log.warn("Could not load session from DB on startup (first run?): {}", e.getMessage());
        }
    }

    public String buildAuthorizationUrl() {
        return loginUrl + "/services/oauth2/authorize"
                + "?response_type=code"
                + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unchecked")
    @Transactional
    public void exchangeCodeForToken(String authorizationCode) {
        String tokenUrl = loginUrl + "/services/oauth2/token";

        String body = "grant_type=authorization_code"
                + "&code=" + URLEncoder.encode(authorizationCode, StandardCharsets.UTF_8)
                + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        Map<String, Object> response = restTemplate.postForObject(tokenUrl, request, Map.class);

        if (response != null) {
            this.accessToken = (String) response.get("access_token");
            this.refreshToken = (String) response.get("refresh_token");
            this.instanceUrl = (String) response.get("instance_url");
            this.lastActivityTime = Instant.now();
            log.info("Successfully authenticated with Salesforce at {}", instanceUrl);
            persistSession();
        }
    }

    @SuppressWarnings("unchecked")
    public boolean tryRefreshToken() {
        if (refreshToken == null || refreshToken.isEmpty()) {
            return false;
        }

        try {
            String tokenUrl = loginUrl + "/services/oauth2/token";
            String body = "grant_type=refresh_token"
                    + "&refresh_token=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8)
                    + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                    + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(tokenUrl, request, Map.class);

            if (response != null && response.containsKey("access_token")) {
                this.accessToken = (String) response.get("access_token");
                if (response.containsKey("instance_url")) {
                    this.instanceUrl = (String) response.get("instance_url");
                }
                this.lastActivityTime = Instant.now();
                persistSession();
                log.info("Successfully refreshed Salesforce access token");
                return true;
            }
        } catch (RestClientException e) {
            log.warn("Failed to refresh token: {}", e.getMessage());
        }

        return false;
    }

    public void touchActivity() {
        if (isTokenPresent()) {
            this.lastActivityTime = Instant.now();
            updateLastActivity();
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getUserInfo() {
        requireConnected();

        String url = instanceUrl + "/services/oauth2/userinfo";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            touchActivity();
            return response.getBody();
        } catch (RestClientException e) {
            // Access token may have expired — try refresh
            if (tryRefreshToken()) {
                headers.setBearerAuth(accessToken);
                ResponseEntity<Map> response = restTemplate.exchange(
                        url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
                touchActivity();
                return response.getBody();
            }
            throw new AuthenticationRequiredException("Session expired. Please log in again.");
        }
    }

    public UserInfoResponse getUserInfoResponse() {
        Map<String, Object> info = getUserInfo();
        return new UserInfoResponse(
                (String) info.getOrDefault("name", ""),
                (String) info.getOrDefault("email", ""),
                (String) info.getOrDefault("preferred_username", ""),
                (String) info.getOrDefault("organization_id", ""),
                (String) info.getOrDefault("organization_name", "")
        );
    }

    @Transactional
    public void logout() {
        if (accessToken != null && instanceUrl != null) {
            try {
                String revokeUrl = loginUrl + "/services/oauth2/revoke?token="
                        + URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
                restTemplate.getForObject(revokeUrl, String.class);
            } catch (Exception e) {
                log.warn("Error revoking token: {}", e.getMessage());
            }
        }
        clearSession();
        log.info("Logged out from Salesforce");
    }

    public boolean isConnected() {
        if (!isTokenPresent()) {
            return false;
        }
        // Check inactivity timeout
        if (lastActivityTime != null) {
            long minutesSinceActivity = Duration.between(lastActivityTime, Instant.now()).toMinutes();
            if (minutesSinceActivity >= inactivityTimeoutMinutes) {
                log.info("Session expired: {} min inactive (limit {} min)",
                        minutesSinceActivity, inactivityTimeoutMinutes);
                clearSession();
                return false;
            }
        }
        return true;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getInstanceUrl() {
        return instanceUrl;
    }

    public String getApiVersion() {
        return "v59.0";
    }

    // --- Private helpers ---

    private boolean isTokenPresent() {
        return accessToken != null && !accessToken.isEmpty();
    }

    private void requireConnected() {
        if (!isConnected()) {
            throw new AuthenticationRequiredException("Not connected to Salesforce. Please log in.");
        }
    }

    @Transactional
    void persistSession() {
        // Clear old sessions and store new one
        sessionRepository.deleteAll();

        AuthSession session = new AuthSession();
        session.setEncryptedAccessToken(encryptionService.encrypt(accessToken));
        session.setEncryptedRefreshToken(encryptionService.encrypt(refreshToken));
        session.setInstanceUrl(instanceUrl);
        session.setCreatedAt(Instant.now());
        session.setLastActivityAt(Instant.now());

        // Try to get org info for the record
        try {
            String url = instanceUrl + "/services/oauth2/userinfo";
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            @SuppressWarnings("unchecked")
            Map<String, Object> info = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class).getBody();
            if (info != null) {
                session.setOrgId((String) info.get("organization_id"));
                session.setUsername((String) info.get("preferred_username"));
            }
        } catch (Exception e) {
            log.debug("Could not fetch user info for session record: {}", e.getMessage());
        }

        sessionRepository.save(session);
        log.debug("Session persisted to DB");
    }

    private void updateLastActivity() {
        sessionRepository.findTopByOrderByLastActivityAtDesc().ifPresent(session -> {
            session.setLastActivityAt(Instant.now());
            sessionRepository.save(session);
        });
    }

    @Transactional
    void clearSession() {
        this.accessToken = null;
        this.refreshToken = null;
        this.instanceUrl = null;
        this.lastActivityTime = null;
        sessionRepository.deleteAll();
    }
}
