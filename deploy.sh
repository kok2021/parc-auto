#!/bin/bash

# Script de déploiement AutoParc
# Usage: ./deploy.sh [production|staging|development]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_NAME="autoparc"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier le fichier .env
    if [ ! -f .env ]; then
        log_error "Le fichier .env n'existe pas. Copiez env.example vers .env et configurez-le."
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Sauvegarde de la base de données
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Sauvegarde de la base de données..."
        
        BACKUP_DIR="./backups"
        BACKUP_FILE="$BACKUP_DIR/autoparc_$(date +%Y%m%d_%H%M%S).gz"
        
        mkdir -p "$BACKUP_DIR"
        
        docker-compose exec -T mongo mongodump --archive --gzip > "$BACKUP_FILE" 2>/dev/null || {
            log_warning "Impossible de sauvegarder la base de données (peut-être qu'elle n'existe pas encore)"
        }
        
        log_success "Sauvegarde créée: $BACKUP_FILE"
    fi
}

# Arrêt des services
stop_services() {
    log_info "Arrêt des services existants..."
    docker-compose down --remove-orphans || true
    log_success "Services arrêtés"
}

# Construction des images
build_images() {
    log_info "Construction des images Docker..."
    docker-compose build --no-cache
    log_success "Images construites"
}

# Démarrage des services
start_services() {
    log_info "Démarrage des services..."
    docker-compose up -d
    
    # Attendre que les services soient prêts
    log_info "Attente du démarrage des services..."
    sleep 30
    
    # Vérifier la santé des services
    check_services_health
}

# Vérification de la santé des services
check_services_health() {
    log_info "Vérification de la santé des services..."
    
    # Vérifier l'API
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log_success "API AutoParc opérationnelle"
    else
        log_error "L'API AutoParc n'est pas accessible"
        exit 1
    fi
    
    # Vérifier MongoDB
    if docker-compose exec mongo mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        log_success "MongoDB opérationnel"
    else
        log_error "MongoDB n'est pas accessible"
        exit 1
    fi
    
    # Vérifier Nginx (si configuré)
    if curl -f http://localhost > /dev/null 2>&1; then
        log_success "Nginx opérationnel"
    else
        log_warning "Nginx n'est pas accessible (peut-être pas configuré)"
    fi
}

# Nettoyage des anciennes images
cleanup_old_images() {
    log_info "Nettoyage des anciennes images..."
    docker image prune -f
    log_success "Nettoyage terminé"
}

# Affichage des informations de connexion
show_connection_info() {
    log_success "Déploiement terminé avec succès !"
    echo
    echo "🌐 URLs d'accès :"
    echo "   Application : http://localhost:5000"
    echo "   API : http://localhost:5000/api"
    echo "   MongoDB Express : http://localhost:8081"
    echo
    echo "👤 Compte administrateur par défaut :"
    echo "   Email : admin@autoparc.fr"
    echo "   Mot de passe : Admin123!"
    echo
    echo "📊 Commandes utiles :"
    echo "   Voir les logs : docker-compose logs -f"
    echo "   Arrêter : docker-compose down"
    echo "   Redémarrer : docker-compose restart"
    echo
}

# Fonction principale
main() {
    echo "🚗 Déploiement AutoParc - Environnement: $ENVIRONMENT"
    echo "=================================================="
    echo
    
    check_prerequisites
    backup_database
    stop_services
    build_images
    start_services
    cleanup_old_images
    show_connection_info
}

# Gestion des erreurs
trap 'log_error "Déploiement interrompu"; exit 1' INT TERM

# Exécution
main "$@" 