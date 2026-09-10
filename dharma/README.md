# Dharma Platform

Dharma is a spiritual-services marketplace with a React Native customer app and an ASP.NET Core modular monolith.

## Projects

- `mobile/`: Expo Router application organized by feature and shared client concerns.
- `backend/`: ASP.NET Core solution containing the API, shared kernel, bounded contexts, and tests.
- `docs/`: requirements, UX, and architecture documentation.

## Local development

See [docs/development/local-development.md](docs/development/local-development.md) for prerequisites, infrastructure, API, migration, mobile, and QA commands.

Start infrastructure:

```bash
docker compose up -d
```

Build the .NET 8 backend:

```bash
dotnet build backend/Dharma.sln --no-restore
```

Run the mobile app after installing dependencies:

```bash
cd mobile
npm install
npm start
```

Copy `.env.example` to `.env` when overriding local service configuration. Production secrets must be injected by the deployment environment.