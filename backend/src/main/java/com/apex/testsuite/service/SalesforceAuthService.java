package com.apex.testsuite.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class SalesforceAuthService {

    @Value("${salesforce.client-id}")
    private String clientId;

    @Value("${salesforce.client-secret}")
    private String clientSecret;

    @Value("${salesforce.login-url}")
    private String loginUrl;

    @Value("${salesforce.redirect-uri}")
    private String redirectUri;

    private String accessToken;
    private String instanceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String buildAuthorizationUrl() {
        return loginUrl + "/services/oauth2/authorize"
                + "?response_type=code"
                + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unchecked")
    public void exchangeCodeForToken(String authorizationCode) {
        String tokenUrl = loginUrl + "/services/oauth2/token";

        String body = "grant_type=authorization_code"
                + "&code=" + URLEncoder.encode(authorizationCode, StandardCharsets.UTF_8)
                + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);

        org.springframework.http.HttpEntity<String> request = new org.springframework.http.HttpEntity<>(body, headers);
        Map<String, Object> response = restTemplate.postForObject(tokenUrl, request, Map.class);

        if (response != null) {
            this.accessToken = (String) response.get("access_token");
            this.instanceUrl = (String) response.get("instance_url");
        }
    }

    public boolean isConnected() {
        return accessToken != null && !accessToken.isEmpty();
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getInstanceUrl() {
        return instanceUrl;
    }
}
