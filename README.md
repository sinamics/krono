<p align="center">
  <img src="public/images/logo/krono_logo.png" alt="Krono Logo" width="120" height="120">
</p>

<h1 align="center">Krono</h1>

<p align="center">Regnskaps og faktureringsapp for ENK.</p>

<p align="center">
  <a href="https://github.com/sinamics/krono/issues/new?labels=bug&template=bug_template.yml&title=%5BBug%5D%3A+">Bug Rapport</a>
  ·
  <a href="https://github.com/sinamics/krono/issues/new?labels=enhancement&template=feature_request.yml&title=%5BFeature+Request%5D%3A+">Ny funksjonalitet</a>
</p>

## Kom i gang med Docker Compose

### Forutsetninger

- [Docker](https://docs.docker.com/get-docker/) og Docker Compose

### 1. Konfigurer miljøvariabler

Kopier `.env.example` og fyll inn verdiene:

```bash
cp .env.example .env
```

`BETTER_AUTH_SECRET` bør settes til en tilfeldig streng. Du kan generere en med:

```bash
openssl rand -hex 16
```

### 2. Start appen

```bash
docker compose up -d
```

Dette starter:

- **app** — Next.js-appen på port 3000
- **db** — PostgreSQL 16-database

Databasemigrering kjøres automatisk ved oppstart.

### 3. Åpne appen

Gå til [http://localhost:3000](http://localhost:3000) og opprett en bruker.

### Stopp appen

```bash
docker compose down
```

For å slette alle data (database og opplastinger):

```bash
docker compose down -v
```

## Utvikling

```bash
npm install
npx prisma generate
npm run dev
```

## Lisens

MIT
