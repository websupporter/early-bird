# CryptoTraders Morning Briefing 🚀

Ein AI-basiertes System zur Aggregation und Analyse von Kryptowährungs-Nachrichten und -Sentiment aus verschiedenen Quellen wie Reddit, WordPress-Blogs und Marktdaten.

## 🌟 Funktionen

- **Multi-Source Data Crawling**: Automatisches Crawlen von Reddit-Subreddits und WordPress-Blogs
- **AI-Powered Sentiment Analysis**: Verwendet OpenAI für intelligente Sentiment-Analyse
- **Market Data Integration**: Binance API für Marktdaten und Greed & Fear Index
- **Morning Briefing Generation**: Automatische Generierung von täglichen Marktanalysen
- **Web Interface**: Moderne, responsive Web-UI für Administration und Überwachung
- **RESTful API**: Vollständige REST API für Integration und Automation

## 📋 Technologie-Stack

### Backend
- **Node.js** & **TypeScript** - Typsichere Server-Entwicklung
- **Express.js** - Web-Framework
- **TypeORM** - ORM für Datenbankoperationen
- **MySQL** - Relationale Datenbank
- **OpenAI API** - AI-basierte Analyse
- **Redis** (optional) - Caching

### Frontend
- **HTML5** & **Vanilla JavaScript**
- **Alpine.js** - Reaktive UI-Framework
- **TailwindCSS** - Utility-first CSS Framework

### External APIs
- **Reddit API** (snoowrap)
- **WordPress REST API**
- **Binance API**
- **Alternative.me Fear & Greed Index**

## 🚀 Quick Start

### 1. Voraussetzungen

- Node.js (v18+)
- MySQL (v8.0+)
- npm oder yarn

### 2. Installation

```bash
# Repository klonen
git clone https://github.com/websupporter/early-bird.git
cd early-bird

# Dependencies installieren
npm install

# Environment-Variablen einrichten
cp .env.example .env
```

### 3. Konfiguration

Bearbeiten Sie die `.env` Datei:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=cryptouser
DB_PASSWORD=cryptopass123
DB_NAME=cryptotraders

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

### 4. Datenbank einrichten

```bash
# MySQL Datenbank erstellen
mysql -u root -p
CREATE DATABASE cryptotraders;
CREATE USER 'cryptouser'@'localhost' IDENTIFIED BY 'cryptopass123';
GRANT ALL PRIVILEGES ON cryptotraders.* TO 'cryptouser'@'localhost';
```

### 5. Anwendung starten

```bash
# Entwicklungsmodus
npm run dev

# Production build
npm run build
npm start
```

Die Anwendung ist dann verfügbar unter:
- **Frontend**: http://localhost:3001
- **API Dokumentation**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 📊 API Endpoints

### Briefing API

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/briefing/generate` | Neues Morning Briefing generieren |
| GET | `/api/briefing/sentiment` | Aktuelle Sentiment-Übersicht |
| GET | `/api/briefing/history` | Historische Briefings |
| POST | `/api/briefing/analyze` | Batch-Analyse von Content |
| GET | `/api/briefing/status` | System-Status |

### Admin API

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/admin/reddit/sources` | Reddit-Quellen verwalten |
| POST | `/api/admin/reddit/sources` | Neue Reddit-Quelle hinzufügen |
| GET | `/api/admin/wordpress/sources` | WordPress-Quellen verwalten |
| POST | `/api/admin/crawl/full` | Vollständiges Crawling starten |
| GET | `/api/admin/stats` | System-Statistiken |

## � Architektur

```
src/
├── api/                    # REST API Layer
│   ├── routes/            # Express Routes
│   └── app.ts             # Express App Setup
├── config/                # Konfiguration
│   ├── database.ts        # TypeORM Konfiguration
│   └── logger.ts          # Logging Setup
├── entities/              # TypeORM Entities
│   ├── User.ts           # User Entity
│   ├── RedditContent.ts  # Reddit Content Entity
│   └── ...               # Weitere Entities
├── repositories/          # Data Access Layer
│   ├── BaseRepository.ts # Abstract Base Repository
│   └── ...               # Spezifische Repositories
├── services/              # Business Logic Layer
│   ├── OpenAIService.ts  # AI/ML Services
│   ├── RedditApiService.ts
│   └── ...               # Weitere Services
├── crawlers/              # Data Crawling Layer
│   ├── MasterCrawlerService.ts
│   └── ...               # Spezifische Crawler
└── index.ts              # Application Entry Point
```

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

## � Automated Workflows

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