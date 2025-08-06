# Utiliser l'image Node.js officielle
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S autoparc -u 1001

# Changer la propriété des fichiers
RUN chown -R autoparc:nodejs /app
USER autoparc

# Exposer le port
EXPOSE 5000

# Variable d'environnement pour la production
ENV NODE_ENV=production

# Commande de démarrage
CMD ["npm", "start"] 