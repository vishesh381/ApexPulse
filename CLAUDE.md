# Apex Test Suite Project

## Architecture
- frontend/ → React + Vite + TailwindCSS (port 5173)
- backend/ → Spring Boot 3 + Java 17 (port 8080)
- salesforce/ → SFDX managed package (thin layer)

## Tech Stack
- Frontend: React, Vite, TailwindCSS, Recharts, WebSocket (SockJS+STOMP)
- Backend: Spring Boot 3, Redis/Caffeine cache, PostgreSQL, WebSocket
- Salesforce: Apex, Tooling API, Connected App, Permission Sets

## Key Patterns
- Spring Boot is the middleware between React and Salesforce
- All SF API calls go through Spring Boot (to avoid governor limits)
- WebSocket for real-time test run updates
- Cache SF responses aggressively

## Commands
- Frontend: `cd frontend && npm run dev`
- Backend: `cd backend && ./mvnw spring-boot:run`
- Salesforce: `cd salesforce && sf org list`