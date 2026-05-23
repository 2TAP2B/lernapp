# Kinder-Lern-App: Flaggen-Modul (MVP)

## Projekt-Übersicht
Baue eine gamifizierte Kinder-Lern-Web-App als Monorepo.
Start mit dem Flaggen-Modul (Lern- + Quiz-Modus).
Die Architektur muss von Anfang an modular sein,
sodass später weitere Quiz-Pakete (Hauptstädte, Tiere etc.)
ohne Code-Änderungen hinzugefügt werden können.

---

## Tech Stack

### Frontend
- Vue 3 + Vite + TypeScript
- Pinia (State Management)
- Vue Router
- Tailwind CSS v4
- full pwa kompatibel
- GSAP (Animationen, kein Framer Motion)
- Lucide Icons (lucide-vue-next) — KEINE Emojis verwenden
- Axios für API-Calls

### Backend
- Hono (auf Bun)
- TypeScript
- Turso (libsql) als Datenbank
- Drizzle ORM
- node-cron für tägliche Datensync-Jobs

### Deployment
- Monorepo: /frontend + /backend
- docker-compose.yml für Coolify-Deployment
- .env.example für beide Pakete

---

## Monorepo-Struktur
/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Wiederverwendbare UI-Komponenten
│   │   │   ├── flags/        # Flaggen-spezifische Komponenten
│   │   │   └── gamification/ # Badges, XP-Bar, Streak etc.
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── LearnView.vue    # Lern-Modus (Swipe durch Flaggen)
│   │   │   └── QuizView.vue     # Quiz-Modus
│   │   ├── stores/
│   │   │   ├── userStore.ts     # Profil, XP, Badges, Streak
│   │   │   ├── flagStore.ts     # Länderdaten, Lernfortschritt
│   │   │   └── quizStore.ts     # Quiz-State, aktuelle Session
│   │   ├── composables/
│   │   ├── router/
│   │   └── types/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── countries.ts   # GET /api/countries
│   │   │   ├── quiz.ts        # Quiz-Sessions, Ergebnisse
│   │   │   └── user.ts        # Profile, XP, Badges
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle Schema
│   │   │   └── client.ts      # Turso Client
│   │   ├── services/
│   │   │   ├── countriesSync.ts  # REST Countries API → DB
│   │   │   └── badgeService.ts   # Badge-Trigger-Logik
│   │   ├── jobs/
│   │   │   └── syncJob.ts     # Täglicher Cron-Job
│   │   └── index.ts
│   ├── drizzle.config.ts
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md

---

## Datenbank-Schema (Drizzle + Turso/SQLite)

```typescript
// Länder-Tabelle (befüllt via REST Countries API)
countries: {
  id: text (ISO alpha-2 Code, PK),  // "de", "fr", "us"
  name_de: text,       // "Deutschland"
  name_en: text,       // "Germany"
  capital: text,       // "Berlin"
  region: text,        // "Europe"
  subregion: text,
  population: integer,
  languages: text,     // JSON Array als String
  currencies: text,    // JSON Array als String
  flag_svg: text,      // URL zu flagcdn.com
  flag_png: text,
  calling_code: text,
  area: real,
  updated_at: integer
}

// Benutzerprofile (kinderfreundlich, kein Auth)
users: {
  id: text (UUID, PK),
  name: text,
  avatar_id: integer,   // Index eines vordefinierten Avatars
  xp: integer DEFAULT 0,
  level: integer DEFAULT 1,
  streak_days: integer DEFAULT 0,
  last_active: integer,
  created_at: integer
}

// Lernfortschritt pro User + Land
learn_progress: {
  id: text (UUID, PK),
  user_id: text (FK → users),
  country_id: text (FK → countries),
  seen_count: integer DEFAULT 0,
  last_seen: integer,
  learned: boolean DEFAULT false  // true nach 3x gesehen
}

// Quiz-Sessions
quiz_sessions: {
  id: text (UUID, PK),
  user_id: text (FK → users),
  quiz_type: text,     // "flags", "capitals", "languages"
  countries_pool: text, // JSON Array mit Country-IDs
  score: integer,
  total_questions: integer,
  time_seconds: integer,
  completed_at: integer
}

// Verdiente Badges
user_badges: {
  id: text (UUID, PK),
  user_id: text (FK → users),
  badge_id: text,      // z.B. "first_quiz", "europe_master"
  earned_at: integer
}
```

---

## Backend API-Endpunkte
GET  /api/countries              → Alle Länder (mit Filter: ?region=Europe)
GET  /api/countries/:id          → Ein Land mit allen Details
GET  /api/countries/random?n=10  → n zufällige Länder für Quiz
GET  /api/users/:id              → Profil, XP, Level, Badges, Streak
POST /api/users                  → Neues Kinderprofil anlegen
PATCH /api/users/:id/xp          → XP vergeben nach Quiz/Lernen
GET  /api/users/:id/progress     → Lernfortschritt aller Länder
POST /api/users/:id/progress     → Fortschritt nach Swipe speichern
POST /api/quiz/session           → Neue Quiz-Session erstellen
POST /api/quiz/session/:id/complete → Session abschließen, XP berechnen
GET  /api/badges                 → Alle verfügbaren Badges
GET  /api/users/:id/badges       → Verdiente Badges des Users

---

## Datensync: REST Countries API
Quelle: https://restcountries.com/v3.1/all
Felder: name, translations, capital, flags, region, subregion,
population, languages, currencies, idd (calling codes), area
Sync-Strategie:

Beim ersten Start: vollständiger Import aller ~250 Länder
Danach: täglicher Cron-Job um 03:00 Uhr
Daten werden in Turso gecacht → Frontend fragt NUR die eigene API


---

## Frontend: Lern-Modus (LearnView)

### Konzept
- Vertikal swipbare Karten (eine Karte pro Land)
- Große Flaggen-Anzeige (SVG von flagcdn.com)
- Darunter alle relevanten Infos strukturiert angezeigt
- Touch-Gesten (Swipe Up/Down) + Keyboard-Navigation (Arrow Keys)
- Fortschrittsbalken: "X von 10 Flaggen gelernt"
- Nach 10 gesehenen Flaggen: CTA-Button "Jetzt Quiz starten!"

### Info-Karte pro Land zeigt
- Flagge (groß, SVG)
- Landesname (Deutsch + Englisch)
- Hauptstadt (mit Lucide MapPin Icon)
- Region / Kontinent (mit Lucide Globe Icon)
- Bevölkerung (mit Lucide Users Icon, formatiert: "83,2 Mio.")
- Sprachen (mit Lucide MessageSquare Icon)
- Währung (mit Lucide Coins Icon)
- Vorwahl (mit Lucide Phone Icon)
- Fläche in km² (mit Lucide Map Icon)

### Lern-Fortschritt
- Ein Land gilt als "gelernt" nach 3x gesehen
- Gesehene Länder werden in learn_progress gespeichert
- +5 XP pro neu gesehenes Land (erstes Mal)

---

## Frontend: Quiz-Modus (QuizView)

### Quiz-Typen (auswählbar vor Start)
1. **Flaggen-Quiz** → Flagge wird gezeigt, welcher Landesname passt?
2. **Hauptstadt-Quiz** → Landesname gezeigt, welche Hauptstadt?
3. **Länder-Quiz** → Hauptstadt gezeigt, welches Land?

### Quiz-Flow
1. Nutzer wählt Quiz-Typ (schöne Auswahlkarten mit Icons)
2. Pool: nur Länder die der User bereits im Lern-Modus gesehen hat
   (min. 10 Länder nötig, sonst Hinweis "Lerne erst 10 Flaggen!")
3. 10 Fragen pro Quiz-Runde
4. Multiple Choice: 4 Antwortmöglichkeiten
5. Nach Antwort: sofortiges visuelles Feedback (richtig/falsch)
6. Am Ende: Ergebnis-Screen mit XP-Gewinn und ggf. neuem Badge

### Frage-Mechanik
- Richtige Antwort + 3 zufällige Distraktoren aus dem Pool
- Timer pro Frage: 15 Sekunden (schnellere Antwort = mehr XP)
- Streak-Bonus: 3 richtige in Folge = +50% XP

---

## Gamification-System

### XP & Level
Aktionen → XP:

Land im Lern-Modus gesehen (1. Mal):  +5 XP
Land als "gelernt" markiert (3x):     +15 XP
Quiz-Frage richtig (normal):           +10 XP
Quiz-Frage richtig (mit Timer-Bonus):  +10-20 XP
Quiz abgeschlossen:                    +25 XP
Quiz 100% richtig:                     +50 XP Bonus

Level-Schwellen:
Level 1:    0 XP
Level 2:  100 XP
Level 3:  250 XP
Level 4:  500 XP
Level 5: 1000 XP
(danach jeweils +500 XP pro Level)

### Badges (Lucide Icons nutzen!)
"Erste Schritte"    → 1. Land gelernt         (Icon: Star)
"Wissenshungrig"    → 10 Länder gelernt        (Icon: BookOpen)
"Quiz-Starter"      → Erstes Quiz gespielt     (Icon: Trophy)
"Perfektionist"     → Quiz mit 100% bestanden  (Icon: Award)
"Europa-Experte"    → 20 europ. Länder gelernt (Icon: Globe)
"Weltreisender"     → 50 Länder gelernt        (Icon: Plane)
"Allwissend"        → Alle Länder gelernt      (Icon: Crown)
"Fleißig"           → 7 Tage Streak            (Icon: Flame)
"Schnell-Denker"    → 5x Timer-Bonus in einer Runde (Icon: Zap)

### Animationen (GSAP)
- XP-Gewinn: Zahlen zählen hoch (CountUp-Animation)
- Badge verdient: Badge fliegt von unten ein + Glow-Effekt
- Richtige Antwort: Karte bounced grün
- Falsche Antwort: Karte shakelt rot
- Level Up: Vollbild-Celebration mit Konfetti (canvas-confetti Library)
- Swipe-Karten: smooth slide animation beim Weiterblättern

---

## UI/Design-Anforderungen

- Kindgerechtes, farbenfrohes Design (aber nicht überladen)
- Große, gut tippbare Buttons (min. 48px touch target)
- Lucide Icons durchgehend (KEINE Emojis)
- Farbschema: lebendige Primärfarbe (z.B. Indigo/Violet) +
  Akzentfarben für Feedback (Grün = richtig, Rot = falsch, Gelb = Bonus)
- Responsive: optimiert für Tablet (768px–1024px) als primäres Gerät,
  funktioniert auch auf Desktop und Smartphone
- Dark Mode optional (Tailwind dark: classes vorbereiten)
- Schriftart: Nunito oder Fredoka (Google Fonts) — rund und kindgerecht

---

## User-Onboarding (kinderfreundlich, kein Login)
- Beim ersten Start: Name eingeben + Avatar auswählen
  (12 vordefinierte Tier-Avatare als Lucide Icons oder einfache SVGs)
- Profil wird in localStorage gespeichert (User-ID → Turso für Fortschritt)
- Mehrere Profile möglich (Geschwister-Feature)
- Profil-Auswahl beim App-Start wie Netflix-Profilauswahl

---

## docker-compose.yml (für Coolify)

```yaml
version: "3.8"
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=${VITE_API_URL}
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
      - PORT=3001
    restart: unless-stopped
```

---

## .env.example
Backend
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token-here
PORT=3001
Frontend
VITE_API_URL=http://localhost:3001

---

## Wichtige Implementierungs-Hinweise

1. **Modularität**: Quiz-Typen als Plugin-System bauen.
   Ein Quiz-Paket ist ein TypeScript-Objekt mit:
   { id, title, icon, getQuestion(country), getChoices(country, allCountries) }
   Neue Quiz-Typen werden nur in einer Registry registriert.

2. **Offline-Fähigkeit**: Länderdaten nach erstem Laden im
   localStorage cachen (max. 24h TTL), damit die App auch
   bei schlechter Verbindung funktioniert.

3. **Fehlerbehandlung**: Immer kindgerechte Fehlermeldungen
   (keine technischen Texte). Bei API-Fehler: cached Daten nutzen.

4. **Performance**: Flaggen-SVGs lazy laden. Virtual Scrolling
   für die Länderliste wenn nötig.

5. **Barrierefreiheit**: aria-labels auf allen interaktiven
   Elementen, Keyboard-Navigation im Quiz funktionsfähig.

---

## Reihenfolge der Implementierung

1. Monorepo-Setup + Docker-Konfiguration
2. Backend: DB-Schema + Turso-Verbindung + Countries-Sync
3. Backend: API-Endpunkte (Countries, User, Progress)
4. Frontend: Router + Pinia Stores + API-Service
5. Frontend: Onboarding-Flow (Profilauswahl)
6. Frontend: Lern-Modus (Swipe-Karten)
7. Frontend: Quiz-Modus (alle 3 Quiz-Typen)
8. Frontend: Gamification (XP-Bar, Badges, Animationen)
9. Frontend: Home-Dashboard (Fortschritt, Streak, Schnellstart)
10. Testing + Coolify-Deployment
