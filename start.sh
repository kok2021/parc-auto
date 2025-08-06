#!/bin/bash

# Script de démarrage rapide AutoParc
# Usage: ./start.sh [dev|prod]

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
MODE=${1:-dev}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_warning "Node.js n'est pas installé"
        echo "Installez Node.js depuis https://nodejs.org/"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_warning "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier MongoDB (optionnel pour le développement)
    if ! command -v mongod &> /dev/null; then
        log_warning "MongoDB n'est pas installé localement"
        echo "Vous pouvez utiliser MongoDB Atlas ou Docker"
    fi
    
    log_success "Prérequis vérifiés"
}

# Installation des dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "Dépendances installées"
    else
        log_info "Dépendances déjà installées"
    fi
}

# Configuration de l'environnement
setup_environment() {
    log_info "Configuration de l'environnement..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            log_warning "Fichier .env créé à partir de env.example"
            echo "⚠️  Configurez vos variables d'environnement dans .env"
        else
            log_warning "Aucun fichier env.example trouvé"
        fi
    fi
}

# Démarrage en mode développement
start_development() {
    log_info "Démarrage en mode développement..."
    
    # Vérifier si MongoDB est en cours d'exécution
    if command -v mongod &> /dev/null; then
        if ! pgrep -x "mongod" > /dev/null; then
            log_warning "MongoDB n'est pas démarré"
            echo "Démarrez MongoDB ou utilisez MongoDB Atlas"
        fi
    fi
    
    # Démarrer l'application
    npm run dev
}

# Démarrage en mode production
start_production() {
    log_info "Démarrage en mode production..."
    
    # Vérifier PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 n'est pas installé"
        echo "Installation de PM2..."
        npm install -g pm2
    fi
    
    # Créer le dossier logs
    mkdir -p logs
    
    # Démarrer avec PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
    
    log_success "Application démarrée avec PM2"
    echo "📊 Monitoring: pm2 monit"
    echo "📋 Logs: pm2 logs"
    echo "🛑 Arrêt: pm2 stop autoparc-api"
}

# Affichage des informations
show_info() {
    echo
    echo "🚗 AutoParc - Application démarrée !"
    echo "=================================="
    echo
    echo "🌐 URLs d'accès :"
    echo "   Application : http://localhost:5000"
    echo "   API : http://localhost:5000/api"
    echo "   Health check : http://localhost:5000/api/health"
    echo
    echo "👤 Compte administrateur par défaut :"
    echo "   Email : admin@autoparc.fr"
    echo "   Mot de passe : Admin123!"
    echo
    echo "📚 Documentation :"
    echo "   README.md - Guide complet"
    echo "   API Documentation - Endpoints disponibles"
    echo
    echo "🔧 Commandes utiles :"
    echo "   Arrêt : Ctrl+C"
    echo "   Logs : npm run dev (mode dev) ou pm2 logs (mode prod)"
    echo "   Tests : npm test"
    echo
}

# Fonction principale
main() {
    echo "🚗 Démarrage AutoParc - Mode: $MODE"
    echo "=================================="
    echo
    
    check_prerequisites
    install_dependencies
    setup_environment
    
    case $MODE in
        "dev"|"development")
            start_development
            ;;
        "prod"|"production")
            start_production
            show_info
            ;;
        *)
            log_warning "Mode non reconnu: $MODE"
            echo "Utilisez 'dev' ou 'prod'"
            exit 1
            ;;
    esac
}

# Gestion des erreurs
trap 'echo -e "\n${YELLOW}[WARNING]${NC} Arrêt de l'application..."; exit 1' INT TERM

# Exécution
main "$@" 