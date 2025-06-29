## Project Setup
[x] Initialize NodeJS project with package.json
[x] Setup TypeScript configuration (tsconfig.json)
[x] Setup Docker and Docker-Compose configuration
[x] Create project folder structure
[ ] Setup database migrations system
[ ] Configure MySQL database schema
[x] Setup testing framework (Jest) for TDD
[x] Setup linting and code formatting (ESLint, Prettier)
[x] Create environment configuration management
[x] Setup logging system
[x] Create error handling middleware
[ ] Setup CI/CD pipeline configuration

## Sources
### General
[x] Create table for users to enable reputation management. A user can write news articles in a magazine and be active on reddit. This table enables to unify 
[x] Create UserEntity

### Reddit
[ ] Create table for reddit content
[ ] Create table for reddit users
[ ] Create Repository to CRUD this data
[ ] Create RedditEntity
[ ] Create RedditUserEntity
[ ] Create API to crawl subs
[ ] Create table of subs to read from
[ ] Create Repository to CRUD the subs table
[ ] Create RedditSourceEntity

### WordPress
[ ] Create table to store WordPress blog content
[ ] Create table for WordPress users
[ ] Create WordPressEntity
[ ] Create WordPressUserEntity
[ ] Create API to crawl WordPress sites
[ ] Create table for sites to crawl
[ ] Create WordPressSourceEntity

### Binance
[ ] Create table to store Candlestick data
[ ] Create CandleStickEntity
[ ] Create repository to CRUD CandleStick entites
[ ] Create CandleStick API fetcher
[ ] Create table for symbols to fetch
[ ] Create repository for CRUD

### Greed&Fear Index
[ ] Create table to store Greed&Fear Index data
[ ] Create GreedFearEntity
[ ] Create repository to CRUD GreedFear entities
[ ] Create API fetcher for Greed&Fear Index
[ ] Schedule regular fetching of index data

### Business
[ ] Create a logic to crawl all sites and subs.
[ ] We need to be able to restart that service and it picks up where it left

## Morning Briefing
[ ] Aggregate latest data
[ ] Use OpenAI to analyze the data and put together a morning briefing

### UI
[ ] Browser based
[ ] Enables user to CRUD Reddit subs, WordPress sites, symbols
[ ] Shows progress of the crawler
[ ] Display morning briefings

### API Endpoints
[ ] Create REST API endpoints for UI
[ ] Authentication and authorization system
[ ] Rate limiting for API endpoints
[ ] API documentation (Swagger/OpenAPI)

### Deployment
[ ] Production Docker configuration
[ ] Environment-specific configurations
[ ] Database backup and restore procedures
[ ] Monitoring and health checks

### Greed&Fear Index
[ ] Create table to store Greed&Fear Index data
[ ] Create GreedFearEntity
[ ] Create repository to CRUD GreedFear entities
[ ] Create API fetcher for Greed&Fear Index
[ ] Schedule regular fetching of index data

### API Endpoints
[ ] Create REST API endpoints for UI
[ ] Authentication and authorization system
[ ] Rate limiting for API endpoints
[ ] API documentation (Swagger/OpenAPI)

### Deployment
[ ] Production Docker configuration
[ ] Environment-specific configurations
[ ] Database backup and restore procedures
[ ] Monitoring and health checks