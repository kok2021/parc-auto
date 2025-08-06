# 🚗 AutoParc - Application Full-Stack

Application complète de gestion de parc automobile avec backend Node.js/Express, base de données MongoDB, authentification JWT, upload d'images et envoi d'emails.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [API Documentation](#-api-documentation)
- [Déploiement](#-déploiement)
- [Structure du projet](#-structure-du-projet)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- **Inscription/Connexion** avec JWT
- **Rôles utilisateurs** (Admin, Manager, User)
- **Réinitialisation de mot de passe** par email
- **Validation des données** avec express-validator
- **Rate limiting** et protection CORS
- **Hachage sécurisé** des mots de passe

### 🚗 Gestion des Véhicules
- **CRUD complet** des véhicules
- **Upload d'images** avec Cloudinary
- **Historique des opérations**
- **Gestion de la maintenance**
- **Documents associés** (carte grise, assurance, etc.)
- **Statuts dynamiques** (Disponible, En maintenance, Affecté, Vendu)
- **Recherche et filtres** avancés

### 📧 Système de Contact
- **Formulaires de contact** publics
- **Gestion des demandes** avec statuts
- **Notifications par email** automatiques
- **Système de réponses** intégré
- **Assignation aux utilisateurs**
- **Suivi et rappels**

### 👥 Gestion des Utilisateurs
- **Profils complets** avec entreprises
- **Gestion des rôles** et permissions
- **Statistiques utilisateurs**
- **Soft delete** pour la sécurité

### 📊 Tableaux de Bord
- **Statistiques en temps réel**
- **Graphiques** et visualisations
- **Export PDF/Excel**
- **Rapports personnalisés**

### 🎨 Interface Utilisateur
- **Design moderne** et responsive
- **Thème sombre/clair**
- **Animations fluides** avec AOS
- **Interface intuitive** pour tous les rôles

## 🛠 Technologies utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification
- **bcryptjs** - Hachage des mots de passe
- **Nodemailer** - Envoi d'emails
- **Multer** - Upload de fichiers
- **Cloudinary** - Stockage d'images
- **express-validator** - Validation des données

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Styles modernes avec Flexbox/Grid
- **JavaScript ES6+** - Logique côté client
- **AOS** - Animations au scroll
- **Chart.js** - Graphiques
- **jsPDF** - Génération de PDF

### Sécurité & Performance
- **Helmet** - Sécurité des headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Protection contre les attaques
- **Compression** - Optimisation des performances
- **Morgan** - Logging des requêtes

## 🚀 Installation

### Prérequis
- Node.js (v16 ou supérieur)
- MongoDB (local ou Atlas)
- Compte Cloudinary (gratuit)
- Compte email SMTP (Gmail, etc.)

### 1. Cloner le repository
```bash
git clone https://github.com/votre-username/autoparc.git
cd autoparc
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
```bash
cp env.example .env
```

Éditez le fichier `.env` avec vos configurations :
```env
# Configuration du serveur
PORT=5000
NODE_ENV=development

# Base de données MongoDB
MONGODB_URI=mongodb://localhost:27017/autoparc
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/autoparc

# JWT Secret
JWT_SECRET=votre_jwt_secret_tres_securise_ici
JWT_EXPIRE=30d

# Cloudinary (pour upload d'images)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
EMAIL_FROM=contact@autoparc.fr

# Frontend URL (pour CORS)
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_PROD=https://votre-domaine.com
```

### 4. Démarrer l'application
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

L'application sera accessible sur `http://localhost:5000`

## ⚙️ Configuration

### MongoDB
1. **Local** : Installez MongoDB localement
2. **Atlas** : Créez un cluster gratuit sur MongoDB Atlas
3. **Connexion** : Utilisez l'URI de connexion dans `.env`

### Cloudinary
1. Créez un compte sur [Cloudinary](https://cloudinary.com)
2. Récupérez vos clés d'API
3. Configurez-les dans `.env`

### Email SMTP
1. **Gmail** : Activez l'authentification à 2 facteurs
2. **Générer** un mot de passe d'application
3. **Configurer** dans `.env`

## 📖 Utilisation

### Première utilisation
1. **Démarrez** l'application
2. **Créez** un compte admin via l'API
3. **Connectez-vous** avec vos identifiants
4. **Commencez** à ajouter des véhicules

### Rôles utilisateurs
- **Admin** : Accès complet à toutes les fonctionnalités
- **Manager** : Gestion des véhicules et contacts
- **User** : Consultation et demandes de contact

## 📚 API Documentation

### Authentification
```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
PUT /api/auth/change-password
PUT /api/auth/profile
POST /api/auth/logout
```

### Véhicules
```http
GET /api/vehicles
GET /api/vehicles/:id
POST /api/vehicles
PUT /api/vehicles/:id
DELETE /api/vehicles/:id
PUT /api/vehicles/:id/status
POST /api/vehicles/:id/history
POST /api/vehicles/:id/maintenance
GET /api/vehicles/stats/overview
GET /api/vehicles/search
```

### Contacts
```http
POST /api/contact
GET /api/contact
GET /api/contact/:id
PUT /api/contact/:id/status
POST /api/contact/:id/response
PUT /api/contact/:id/assign
PUT /api/contact/:id/tags
PUT /api/contact/:id/follow-up
GET /api/contact/stats/overview
```

### Upload
```http
POST /api/upload/image
POST /api/upload/images
POST /api/upload/document
DELETE /api/upload/:publicId
POST /api/upload/vehicle-images/:vehicleId
PUT /api/upload/vehicle-images/:vehicleId/primary
DELETE /api/upload/vehicle-images/:vehicleId/:imageId
```

### Utilisateurs
```http
GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
PUT /api/users/:id/activate
PUT /api/users/:id/role
GET /api/users/stats/overview
GET /api/users/search
```

## 🚀 Déploiement

### Heroku
1. **Créez** une application Heroku
2. **Configurez** les variables d'environnement
3. **Déployez** avec Git

```bash
heroku create autoparc-app
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI_PROD=votre_uri_mongodb
git push heroku main
```

### Vercel
1. **Connectez** votre repository GitHub
2. **Configurez** les variables d'environnement
3. **Déployez** automatiquement

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📁 Structure du projet

```
autoparc/
├── models/                 # Modèles MongoDB
│   ├── User.js
│   ├── Vehicle.js
│   └── Contact.js
├── routes/                 # Routes API
│   ├── auth.js
│   ├── vehicles.js
│   ├── contact.js
│   ├── users.js
│   └── upload.js
├── middleware/             # Middlewares
│   ├── auth.js
│   └── errorHandler.js
├── utils/                  # Utilitaires
│   └── emailService.js
├── public/                 # Fichiers statiques
│   ├── index.html
│   ├── style.css
│   └── script.js
├── server.js              # Serveur principal
├── package.json           # Dépendances
├── env.example           # Variables d'environnement
└── README.md             # Documentation
```

## 🤝 Contribuer

1. **Fork** le projet
2. **Créez** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commitez** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Poussez** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- **Email** : contact@autoparc.fr
- **Documentation** : [Wiki du projet](https://github.com/votre-username/autoparc/wiki)
- **Issues** : [GitHub Issues](https://github.com/votre-username/autoparc/issues)

## 🙏 Remerciements

- **MongoDB** pour la base de données
- **Cloudinary** pour l'hébergement d'images
- **Express.js** pour le framework backend
- **Chart.js** pour les graphiques
- **AOS** pour les animations

---

**AutoParc** - Votre partenaire automobile de confiance 🚗 