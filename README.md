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

- Registrer og importer transaksjoner manuelt eller fra fil
- AI-drevet kvitteringsbehandling
- Automatisk import fra Stripe og PayPal
- Generer MVA-meldinger per termin
- Årsoppgjør og finansrapporter
- Leverandørhåndtering
- Støtte for flere valutaer med automatiske kurser fra Norges Bank
- EKOM og hjemmekontor-fradrag
- Backup og flerbrukerstøtte

## Kom i gang med Docker Compose

### Forutsetninger

- [Docker](https://docs.docker.com/get-docker/) og Docker Compose

### 1. Opprett `docker-compose.yml`

```yaml
services:
  app:
    image: ghcr.io/sinamics/krono:latest
    container_name: krono
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://krono:krono@db:5432/krono
      BETTER_AUTH_SECRET: changemeplease
      NEXT_PUBLIC_APP_URL: http://localhost:3000
    volumes:
      - uploads_data:/app/public/uploads
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    container_name: krono-db
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: krono
      POSTGRES_USER: krono
      POSTGRES_PASSWORD: krono
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U krono"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  uploads_data:
```

### 2. Generer `BETTER_AUTH_SECRET`

```bash
sed -i "s/BETTER_AUTH_SECRET: changemeplease/BETTER_AUTH_SECRET: $(openssl rand -hex 16)/" docker-compose.yml
```

### 3. Start appen

```bash
docker compose up -d
```

Databasemigrering kjøres automatisk ved oppstart. Gå til [http://localhost:3000](http://localhost:3000) og opprett en bruker.

## Utvikling

Prosjektet bruker [Dev Containers](https://containers.dev/). Åpne repoet i VS Code og velg **"Reopen in Container"**. Kjør deretter inne i containeren:

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Lisens

GPL-3.0
