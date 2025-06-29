FROM node:18-alpine

# Setze Arbeitsverzeichnis
WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere dependencies
RUN npm ci --only=production

# Kopiere Source Code
COPY . .

# Baue das TypeScript-Projekt
RUN npm run build

# Exponiere Port
EXPOSE 3000

# Setze User für Sicherheit
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Starte die Anwendung
CMD ["npm", "start"]