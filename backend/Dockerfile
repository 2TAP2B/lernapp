FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .

FROM oven/bun:1
WORKDIR /app
COPY --from=builder /app ./
# Verzeichnis für die SQLite-Datei (wird als Volume gemountet)
RUN mkdir -p /app/data
EXPOSE 3001
# 1. Schema anlegen (--force überspringt interaktive Bestätigung)
# 2. Rivers seeden (Countries werden automatisch via bootstrap/syncCountries geladen)
# 3. Server starten
CMD ["sh", "-c", "bun run drizzle-kit push --force && bun scripts/seedRivers.ts && bun run src/index.ts"]
