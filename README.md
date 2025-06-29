# CryptoTraders Morning Briefing 🚀

AI-basiertes System zur Aggregation und Analyse von Kryptowährungs-Nachrichten und -Sentiment mit modernem React-Frontend.

## 🚀 Funktionen

- **Modern React Frontend**: Vollständig refaktoriert mit React, TypeScript, TanStack Query und Mantine UI
- **AI-Powered Briefings**: Automatische Generierung von Morning Briefings mit OpenAI
- **Multi-Source Crawler**: Reddit und WordPress Content-Aggregation
- **Sentiment Analysis**: Erweiterte Stimmungsanalyse mit Greed & Fear Index
- **Real-time Updates**: Live-Datenaktualisierung mit TanStack Query
- **Responsive Design**: Moderne, mobile-optimierte Benutzeroberfläche
- **Admin Panel**: Vollständige Verwaltung von Quellen und Crawling-Operationen

## �️ Tech Stack

### Frontend
- **React 18** mit TypeScript
- **Mantine UI** für moderne Komponenten
- **TanStack Query** für State Management und API-Calls
- **Vite** als Build-Tool
- **Tabler Icons** für Icons

### Backend
- **Node.js** mit Express und TypeScript
- **TypeORM** für Datenbankoperationen
- **MySQL** Datenbank
- **OpenAI API** für AI-Funktionen
- **Redis** für Caching (optional)

## 📦 Installation

### Voraussetzungen
- Node.js >= 18.0.0
- npm >= 8.0.0
- MySQL >= 8.0
- Docker (optional)

### Entwicklungsumgebung

1. **Repository klonen**
```bash
git clone https://github.com/websupporter/early-bird.git
cd early-bird
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren**
```bash
cp .env.example .env
# Bearbeiten Sie die .env-Datei mit Ihren Konfigurationen
```

4. **Datenbank starten (mit Docker)**
```bash
npm run docker:up
```

5. **Entwicklungsserver starten**
```bash
npm run dev
```

Das Frontend läuft auf http://localhost:3000 und das Backend auf http://localhost:3001.

### Produktionsumgebung

```bash
# Build erstellen
npm run build

# Produktionsserver starten
npm start
```

## 🎯 Verfügbare Scripts

- `npm run dev` - Startet Frontend und Backend gleichzeitig
- `npm run dev:frontend` - Nur Frontend-Entwicklungsserver
- `npm run dev:backend` - Nur Backend-Entwicklungsserver
- `npm run build` - Baut Backend und Frontend für Produktion
- `npm run build:frontend` - Baut nur das Frontend
- `npm run start` - Startet den Produktionsserver
- `npm run test` - Führt Tests aus
- `npm run lint` - Führt Linting aus
- `npm run format` - Formatiert Code mit Prettier

## 📁 Projektstruktur

```
early-bird/
├── src/
│   ├── frontend/           # React Frontend
│   │   ├── src/
│   │   │   ├── api/        # API-Client und Typen
│   │   │   ├── components/ # React-Komponenten
│   │   │   ├── hooks/      # Custom Hooks
│   │   │   ├── App.tsx     # Haupt-App-Komponente
│   │   │   ├── main.tsx    # React-Einstiegspunkt
│   │   │   └── theme.ts    # Mantine-Theme
│   │   ├── index.html      # HTML-Template
│   │   ├── vite.config.ts  # Vite-Konfiguration
│   │   └── tsconfig.json   # TypeScript-Konfiguration
│   ├── api/                # Express API-Routen
│   ├── config/             # Konfigurationsdateien
│   ├── crawlers/           # Content-Crawler
│   ├── entities/           # TypeORM-Entitäten
│   ├── repositories/       # Datenbank-Repositories
│   ├── services/           # Business-Logic-Services
│   └── index.ts            # Backend-Einstiegspunkt
├── public/                 # Gebaute Frontend-Dateien
├── docker/                 # Docker-Konfiguration
└── package.json
```

## 🔧 Konfiguration

### Umgebungsvariablen

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=crypto_briefing

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_app_name

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 🎨 Frontend-Features

### Dashboard
- **Echtzeitdaten**: Live-Updates von Sentiment und Systemstatus
- **Briefing-Generierung**: Ein-Klick-Generierung von Morning Briefings
- **Sentiment-Visualisierung**: Grafische Darstellung von Stimmungsdaten
- **Responsive Design**: Optimiert für Desktop und Mobile

### Admin Panel
- **Quellenverwaltung**: Hinzufügen, Bearbeiten und Löschen von Reddit/WordPress-Quellen
- **Crawler-Steuerung**: Manuelle Auslösung von Crawling-Operationen
- **Systemüberwachung**: Echtzeit-Statistiken und Systemstatus
- **Tabellen-Interface**: Erweiterte Datentabellen mit Sorting und Filtering

### UI/UX
- **Mantine UI**: Moderne, zugängliche Komponenten
- **Dunkler Modus**: Automatische Theme-Erkennung
- **Responsive Grid**: Optimiertes Layout für alle Bildschirmgrößen
- **Ladezustände**: Intuitive Loading-States und Feedback

## � API-Endpoints

### Briefing-Endpoints
- `POST /api/briefing/generate` - Generiert neues Morning Briefing
- `GET /api/briefing/sentiment` - Ruft Sentiment-Übersicht ab
- `GET /api/briefing/status` - Systemstatus
- `GET /api/briefing/history` - Historische Briefings
- `POST /api/briefing/analyze` - Analysiert Inhalte

### Admin-Endpoints
- `GET /api/admin/stats` - Systemstatistiken
- `GET /api/admin/reddit/sources` - Reddit-Quellen
- `POST /api/admin/reddit/sources` - Neue Reddit-Quelle
- `PUT /api/admin/reddit/sources/:id` - Reddit-Quelle aktualisieren
- `DELETE /api/admin/reddit/sources/:id` - Reddit-Quelle löschen
- `GET /api/admin/wordpress/sources` - WordPress-Quellen
- `POST /api/admin/wordpress/sources` - Neue WordPress-Quelle
- `PUT /api/admin/wordpress/sources/:id` - WordPress-Quelle aktualisieren
- `DELETE /api/admin/wordpress/sources/:id` - WordPress-Quelle löschen
- `POST /api/admin/crawl/full` - Vollständiger Crawl
- `POST /api/admin/crawl/reddit` - Reddit-Crawl
- `POST /api/admin/crawl/wordpress` - WordPress-Crawl
- `POST /api/admin/crawl/market` - Marktdaten aktualisieren

## 🧪 Entwicklung

### Linting und Formatierung
```bash
npm run lint          # ESLint
npm run format        # Prettier
```

### Tests
```bash
npm run test          # Alle Tests
npm run test:watch    # Test-Watcher
npm run test:coverage # Coverage-Report
```

### Docker-Entwicklung
```bash
npm run docker:up     # Services starten
npm run docker:down   # Services stoppen
```

## 📈 Deployment

### Produktions-Build
```bash
npm run build
npm start
```

### Docker-Deployment
```bash
docker-compose up -d
```

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📝 Lizenz

Dieses Projekt ist unter der ISC-Lizenz lizenziert.

## 🔗 Links

- [Mantine UI Dokumentation](https://mantine.dev/)
- [TanStack Query Dokumentation](https://tanstack.com/query/latest)
- [React Dokumentation](https://react.dev/)
- [TypeScript Dokumentation](https://www.typescriptlang.org/)

## 🤖 AI Integration

Das System nutzt OpenAI für:

1. **Sentiment Analysis**: Bewertung der Marktstimmung in Posts und Artikeln
2. **Keyword Extraction**: Automatische Extraktion relevanter Begriffe
3. **Content Classification**: Kategorisierung von Inhalten
4. **Morning Briefing**: Automatische Generierung von Marktanalysen

## 📈 Data Sources

### Reddit
- Konfigurierbare Subreddits (z.B. r/cryptocurrency, r/bitcoin)
- Automatisches Crawling von Posts und Kommentaren
- Sentiment-Analyse und Engagement-Metriken

### WordPress Blogs
- Crypto-News-Websites über WordPress REST API
- Expert-Meinungen und Marktanalysen
- Kategorisierung nach Tags und Kategorien

### Market Data
- **Binance API**: Live-Kryptowährungskurse und Handelsvolumen
- **Fear & Greed Index**: Marktsentiment-Indikator
- Historische Daten für Trend-Analyse

## 🛡️ Security Features

- **Input Validation**: Umfassende Validierung aller Eingaben
- **Rate Limiting**: Schutz vor API-Missbrauch
- **CORS Configuration**: Sichere Cross-Origin-Requests
- **Environment Variables**: Sichere Speicherung von API-Schlüsseln
- **Error Handling**: Robuste Fehlerbehandlung

## 🚀 Automated Workflows

Das System kann so konfiguriert werden, dass es automatisch:

1. **Stündlich**: Reddit und WordPress crawlt
2. **Alle 15 Minuten**: Marktdaten aktualisiert
3. **Täglich um 6 Uhr**: Morning Briefing generiert
4. **Kontinuierlich**: Sentiment-Analyse für neue Inhalte

## 📝 Development

### Scripts

```bash
npm run dev          # Development server mit hot reload
npm run build        # Production build
npm run test         # Tests ausführen
npm run test:watch   # Tests im Watch-Modus
npm run lint         # Code linting
npm run format       # Code formatting
```

### Debugging

Das System nutzt strukturiertes Logging:

```typescript
// Logs werden automatisch in Console und Datei geschrieben
console.log('Info message');
console.error('Error message');
```

### Testing

```bash
# Unit Tests
npm run test

# Integration Tests
npm run test:integration

# Coverage Report
npm run test:coverage
```

## 🚦 Production Deployment

### Docker Setup

```dockerfile
# Dockerfile wird bereitgestellt
docker-compose up -d
```

### Environment Configuration

Produktionseinstellungen:

```env
NODE_ENV=production
PORT=3001
DB_HOST=production-db-host
# ... weitere Production-Settings
```

### Health Monitoring

- Health Check Endpoint: `/health`
- Metrics und Monitoring über Express Middleware
- Error Logging und Alerting

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 License

Dieses Projekt ist unter der ISC Lizenz lizenziert.

## 🔗 Links

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/)
- [TypeORM Documentation](https://typeorm.io/)

## ⚠️ Wichtige Hinweise

1. **API Limits**: Beachten Sie die Rate Limits der verschiedenen APIs
2. **Kosten**: OpenAI API verursacht Kosten basierend auf Nutzung
3. **Reddit API**: Erfordert Reddit Developer Account
4. **Datenbank**: Regelmäßige Backups empfohlen
5. **Security**: API-Schlüssel niemals in Code commiten

---

Erstellt mit ❤️ für die Crypto-Trading-Community