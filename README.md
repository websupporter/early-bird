# CryptoTraders Morning Briefing

Eine Anwendung, die verschiedene Datenquellen wie Reddit, Preisbewegungen, Crypto-Blogs und News-Sites aggregiert und nützliche Trading-Briefings erstellt.

## 🚀 Aktueller Projektstand

### ✅ Abgeschlossen
- **Projekt-Setup**: NodeJS, TypeScript, package.json konfiguriert
- **Docker**: Docker & Docker-Compose Konfiguration erstellt
- **Projektstruktur**: Ordnerstruktur für src/, entities/, services/, etc. angelegt
- **Testing**: Jest-Konfiguration für TDD eingerichtet
- **Code-Qualität**: ESLint und Prettier konfiguriert
- **Konfiguration**: Umgebungsvariablen-Management mit .env
- **Logging**: Winston-Logger implementiert
- **Server**: Express-Grundgerüst mit Health-Check und Error-Handling
- **Database**: TypeORM-Konfiguration für MySQL
- **Entities**: User-Entity für Reputation Management begonnen

### 🔄 In Arbeit
- Entity-Modellierung (RedditUser, WordPressUser, Content-Entities)
- Datenbank-Migrationen
- Repository-Pattern Implementation

### 📋 Nächste Schritte
1. Vollständige Entity-Modellierung abschließen
2. Datenbank-Migrationen einrichten
3. Repository-Klassen implementieren
4. API-Endpoints für CRUD-Operationen
5. External API-Integration (Reddit, Binance, Fear&Greed Index)

## 🏗️ Technologie-Stack

- **Backend**: NodeJS, TypeScript, Express
- **Datenbank**: MySQL mit TypeORM
- **Testing**: Jest
- **Code-Qualität**: ESLint, Prettier
- **Logging**: Winston
- **Containerisierung**: Docker, Docker-Compose
- **APIs**: Reddit (snoowrap), Binance, OpenAI

## 🚀 Schnellstart

### Voraussetzungen
- Node.js (>= 18)
- Docker & Docker-Compose
- MySQL (für lokale Entwicklung)

### Installation

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeite .env mit deinen API-Keys

# Docker-Container starten
npm run docker:up

# Entwicklungsserver starten
npm run dev
```

### Verfügbare Scripts

```bash
npm run build          # TypeScript kompilieren
npm run start          # Produktionsserver starten
npm run dev            # Entwicklungsserver mit Hot-Reload
npm run test           # Tests ausführen
npm run test:watch     # Tests im Watch-Mode
npm run test:coverage  # Test-Coverage generieren
npm run lint           # Code-Linting
npm run lint:fix       # Auto-Fix für Linting-Fehler
npm run format         # Code formatieren
npm run docker:up      # Docker-Container starten
npm run docker:down    # Docker-Container stoppen
```

## 📊 API-Endpoints

### Health & Status
```
GET /health           # Server-Health-Check
GET /api/v1/status    # API-Status
```

### Geplante Endpoints
```
GET /api/v1/users              # Alle User abrufen
POST /api/v1/users             # Neuen User erstellen
GET /api/v1/reddit/sources     # Reddit-Quellen verwalten
GET /api/v1/wordpress/sources  # WordPress-Quellen verwalten
GET /api/v1/binance/symbols    # Binance-Symbole verwalten
GET /api/v1/briefings          # Morning Briefings abrufen
POST /api/v1/briefings/generate # Neues Briefing generieren
```

## 🗄️ Datenbank-Schema

### Entities (geplant/in Entwicklung)
- `User` - Zentrale User-Verwaltung für Reputation Management
- `RedditUser` - Reddit-spezifische Benutzerdaten
- `RedditContent` - Reddit-Posts und -Kommentare
- `WordPressUser` - WordPress-Autoren
- `WordPressContent` - Blog-Artikel
- `CandleStick` - Binance-Preisdaten
- `GreedFearIndex` - Fear & Greed Index-Daten
- `MorningBriefing` - Generierte Briefings

## 🔧 Konfiguration

Die Anwendung verwendet Umgebungsvariablen für die Konfiguration. Siehe `.env.example` für alle verfügbaren Optionen.

### API-Keys benötigt
- Reddit API (Client ID, Secret, Username, Password)
- Binance API (Key, Secret)
- OpenAI API (Key)

## 📈 Entwicklungsfortschritt

Aktuelle Todo-Liste und Fortschritt siehe `todo.MD`.

## 🤝 Entwicklung

Das Projekt folgt Test Driven Development (TDD) Prinzipien:

1. **Red Phase**: Test schreiben, der fehlschlägt
2. **Green Phase**: Minimale Implementierung für Test-Success
3. **Refactor Phase**: Code-Optimierung

Objektorientiertes Design für gute Testbarkeit und Wartbarkeit.