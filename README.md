# ApexPulse — Salesforce Apex Test Suite

Full-stack web application that connects to Salesforce orgs via OAuth, discovers Apex test classes, executes tests with real-time progress tracking, and visualizes historical results and code coverage trends.

**Live:** [apex-test-suite.onrender.com](https://apex-test-suite.onrender.com)

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, TailwindCSS 4, Recharts, STOMP/SockJS WebSocket client |
| **Backend** | Spring Boot 3.5, Java 17, JPA/Hibernate, Caffeine Cache, WebSocket (STOMP) |
| **Database** | H2 (dev) / PostgreSQL (prod) |
| **Salesforce** | OAuth 2.0, Tooling API, Connected App, Metadata API |
| **Deployment** | Render (Docker backend, static frontend, managed PostgreSQL) |
| **Security** | AES-256-GCM token encryption at rest, environment-based secrets management |

---

## Features

- **Salesforce OAuth 2.0 Integration** — Secure login flow with automatic token refresh and 2-hour inactivity-based session expiry
- **Apex Test Class Discovery** — Queries Salesforce Tooling API to list all test classes with search and multi-select
- **Real-Time Test Execution** — Triggers async test runs via Tooling API, polls for progress, and broadcasts live pass/fail counts to the browser over WebSocket
- **Method-Level Results** — Displays per-method outcomes with expandable error messages and stack traces for failed tests
- **Code Coverage Dashboard** — Per-class coverage percentages with visual progress bars, org-wide coverage stats, and sortable/searchable tables
- **Historical Analytics** — Persists all test runs to PostgreSQL, with pass rate trend (LineChart) and coverage trend (AreaChart) over time
- **Encrypted Token Storage** — Auth tokens encrypted with AES-256-GCM before persisting to database, survives backend restarts
- **Dockerized Deployment** — Multi-stage Docker build, Render Blueprint (IaC) with render.yaml for one-click infrastructure setup

---

## Architecture

```
┌──────────────┐       WebSocket (STOMP/SockJS)       ┌──────────────────┐
│              │◄─────────────────────────────────────►│                  │
│   React 19   │         REST API (Axios)              │  Spring Boot 3.5 │
│   Frontend   │◄─────────────────────────────────────►│    Backend       │
│              │                                       │                  │
└──────────────┘                                       └────────┬─────────┘
                                                                │
                                                  ┌─────────────┼─────────────┐
                                                  │             │             │
                                                  ▼             ▼             ▼
                                            ┌──────────┐ ┌──────────┐ ┌────────────┐
                                            │Salesforce│ │PostgreSQL│ │  Caffeine  │
                                            │Tooling   │ │  (prod)  │ │   Cache    │
                                            │  API     │ │ H2 (dev) │ │            │
                                            └──────────┘ └──────────┘ └────────────┘
```

### Highlights

- Spring Boot as middleware between React and Salesforce — avoids governor limits by caching and aggregating API calls server-side
- Profile-based configuration (`default` for H2/local dev, `prod` for PostgreSQL/Render)
- Custom `DataSourceConfig` to parse Render's `DATABASE_URL` into JDBC-compatible format
- `@Async` thread pool for non-blocking test execution polling
- Axios interceptors for automatic 401 → login redirect
- localStorage + heartbeat pattern for auth persistence across page refreshes

---

## What It Solves Over Native Salesforce Developer Console

| Feature | Developer Console | ApexPulse |
|---------|------------------|-----------|
| Multi-class test runs | One class at a time | Select and run multiple classes in one click |
| Test run history | Not persisted | Full history with pagination |
| Real-time progress | Refresh page to check | Live WebSocket updates with pass/fail counters |
| Coverage trends | Current snapshot only | Historical trend charts over time |
| Method-level errors | Basic log view | Expandable error messages and stack traces |
| UI/UX | Dated interface | Modern responsive dashboard with charts |

---

## Project Structure

```
apex-test-suite/
├── frontend/                  # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth & Toast context providers
│   │   ├── pages/             # Route pages (Dashboard, TestRunner, Results, Coverage)
│   │   └── services/          # API client & WebSocket service
│   └── index.html
├── backend/                   # Spring Boot 3.5 + Java 17
│   ├── src/main/java/com/apex/testsuite/
│   │   ├── config/            # CORS, WebSocket, Cache, Async, DataSource configs
│   │   ├── controller/        # REST endpoints (Auth, TestRun, History)
│   │   ├── dto/               # Request/Response records
│   │   ├── entity/            # JPA entities (TestRun, TestResult, CoverageSnapshot, AuthSession)
│   │   ├── exception/         # Global exception handling
│   │   ├── repository/        # Spring Data JPA repositories
│   │   └── service/           # Business logic (SF Auth, Tooling API, Test Execution, Encryption)
│   ├── Dockerfile             # Multi-stage build
│   └── src/main/resources/    # application.properties, application-prod.properties
├── salesforce/                # Connected App metadata
├── render.yaml                # Render Blueprint (IaC)
└── README.md
```

---

## Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- A Salesforce org with a Connected App configured

### Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/vishesh381/ApexPulse.git
   cd ApexPulse
   ```

2. **Configure Salesforce credentials**
   ```bash
   # Create backend/.env
   SF_CLIENT_ID=your_connected_app_consumer_key
   SF_CLIENT_SECRET=your_connected_app_consumer_secret
   SESSION_ENCRYPTION_KEY=any-32-character-secret-key-here
   ```

3. **Start the backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) and click **Connect to Salesforce**

### Production Deployment (Render)

1. Create a PostgreSQL database on Render
2. Deploy backend as a Docker Web Service with environment variables:
   - `DATABASE_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, `SF_REDIRECT_URI`, `FRONTEND_URL`, `SESSION_ENCRYPTION_KEY`, `SPRING_PROFILES_ACTIVE=prod`
3. Deploy frontend as a Static Site with `VITE_API_URL` pointing to the backend URL
4. Add a `/*` → `/index.html` rewrite rule on the static site
5. Update your Salesforce Connected App callback URL to include the production backend URL
