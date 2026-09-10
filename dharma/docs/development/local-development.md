# Local Development

## Prerequisites

- .NET 8 SDK and runtime
- Node.js 20 or newer
- Docker with Docker Compose

## Infrastructure

Copy `.env.example` to `.env` if you need to override local defaults, then start the local services:

```bash
docker compose up -d

docker compose ps
```

Services:

- MySQL: `localhost:3306`
- Redis: `localhost:6379`
- OpenSearch: `http://localhost:9200`

Stop services with `docker compose down`. Persistent local volumes remain unless removed explicitly.

## Backend

Restore and build the .NET 8 solution:

```bash
dotnet restore backend/Dharma.sln
dotnet build backend/Dharma.sln --no-restore
```

Run all tests:

```bash
dotnet test backend/Dharma.sln
```

Create or apply EF migrations from the repository root:

```bash
dotnet ef migrations add MigrationName \
  --project backend/src/Dharma.Infrastructure/Dharma.Infrastructure.csproj \
  --startup-project backend/src/Dharma.Api/Dharma.Api.csproj \
  --output-dir Persistence/Migrations
```

Run the API:

```bash
dotnet run --project backend/src/Dharma.Api/Dharma.Api.csproj
```

Foundation endpoints:

- `GET /api/v1`
- `GET /health/live`
- `GET /health/ready`

## Mobile

Install dependencies and run the Expo Router app:

```bash
cd mobile
npm ci
npm start
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm audit --audit-level=critical
```
