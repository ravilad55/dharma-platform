# Dharma Platform

Dharma is a spiritual-services marketplace with a React Native customer app and an ASP.NET Core modular monolith.

## Projects

- `mobile/`: Expo Router application organized by feature and shared client concerns.
- `backend/`: ASP.NET Core solution containing the API, shared kernel, bounded contexts, and tests.
- `docs/`: requirements, UX, and architecture documentation.

## Local development

Start infrastructure:

```bash
docker compose up -d
```

Build the backend:

```bash
dotnet build backend/Dharma.sln
```

Run the mobile app after installing dependencies:

```bash
cd mobile
npm install
npm start
```

Copy `.env.example` to `.env` and provide local service configuration before connecting the applications to external services.