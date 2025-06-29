
## Sources
### General
[ ] Create table for users to enable reputation management. A user can write news articles in a magazine and be active on reddit. This table enables to unify 
[ ] Create UserEntity

### Reddit
[ ] Create table for reddit content
[ ] Create table for reddit users
[ ] Create Repository to CRUD this data
[ ] Create ReditEntity
[ ] Create ReditUserEntity
[ ] Create API to crawl subs
[ ] Create table of subs to read from
[ ] Create Repository to CRUD the subs table
[ ] Create ReditSourceEntity

### WordPress
[ ] Create table to store WordPress blog content
[ ] Create table for WordPress users
[ ] Create WordPressEntity
[ ] Create WordPressUserEntity
[ ] Create API to crawl WordPress sites
[ ] Create table for sites to crawl
[ ] Create WordPressSourcentity

### Binance
[ ] Create table to store Candlestick data
[ ] Create CandleStickEntity
[ ] Create repository to CRUD CandleStick entites
[ ] Create CandleStick API fetcher
[ ] Create table for symbols to fetch
[ ] Create repository for CRUD

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