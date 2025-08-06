// AutoParc - Script principal
// Gestion des véhicules et interface utilisateur

// Variables globales
let vehicles = [];
let currentVehicle = null;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });

    // Masquer le loader après le chargement
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }, 1500);

    // Initialiser la navigation mobile
    initMobileNavigation();

    // Charger les véhicules
    loadVehicles();

    // Initialiser les événements
    initEvents();

    // Initialiser les formulaires
    initForms();

    // Initialiser les modals
    initModals();

    // Initialiser le scroll smooth
    initSmoothScroll();

    // Initialiser les optimisations mobile
    initMobileOptimizations();
});

// Navigation mobile responsive
function initMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Empêcher le scroll du body quand le menu est ouvert
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Fermer le menu mobile quand on clique sur un lien
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Fermer le menu mobile quand on clique en dehors
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Optimisations spécifiques pour mobile
function initMobileOptimizations() {
    // Détecter si l'appareil est mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Optimiser les images pour mobile
        optimizeImagesForMobile();
        
        // Améliorer la performance des animations
        reduceAnimationsOnMobile();
        
        // Optimiser les formulaires pour mobile
        optimizeFormsForMobile();
        
        // Ajouter le support tactile amélioré
        addTouchSupport();
    }

    // Écouter les changements d'orientation
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            // Recalculer les hauteurs après changement d'orientation
            recalculateHeights();
        }, 100);
    });

    // Écouter les changements de taille d'écran
    window.addEventListener('resize', function() {
        debounce(() => {
            recalculateHeights();
            updateMobileOptimizations();
        }, 250);
    });
}

// Optimiser les images pour mobile
function optimizeImagesForMobile() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Ajouter lazy loading pour les images
        img.loading = 'lazy';
        
        // Optimiser la taille des images sur mobile
        if (window.innerWidth <= 480) {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        }
    });
}

// Réduire les animations sur mobile pour améliorer les performances
function reduceAnimationsOnMobile() {
    if (window.innerWidth <= 480) {
        // Réduire la durée des animations
        document.documentElement.style.setProperty('--transition', 'all 0.2s ease');
        
        // Désactiver certaines animations complexes
        const elements = document.querySelectorAll('.vehicle-card, .hero-image img');
        elements.forEach(el => {
            el.style.transition = 'none';
        });
    }
}

// Optimiser les formulaires pour mobile
function optimizeFormsForMobile() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Éviter le zoom sur iOS
        if (input.type !== 'file') {
            input.style.fontSize = '16px';
        }
        
        // Améliorer l'accessibilité tactile
        input.style.minHeight = '44px';
        input.style.padding = '12px';
    });
}

// Ajouter le support tactile amélioré
function addTouchSupport() {
    // Améliorer les interactions tactiles
    const touchElements = document.querySelectorAll('.btn, .nav-link, .vehicle-card');
    
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
}

// Recalculer les hauteurs après changement d'orientation
function recalculateHeights() {
    const hero = document.querySelector('.hero');
    if (hero) {
        if (window.innerHeight < window.innerWidth) {
            // Mode paysage
            hero.style.minHeight = '100vh';
        } else {
            // Mode portrait
            hero.style.minHeight = '100vh';
        }
    }
}

// Mettre à jour les optimisations mobile
function updateMobileOptimizations() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        optimizeImagesForMobile();
        reduceAnimationsOnMobile();
        optimizeFormsForMobile();
    } else {
        // Restaurer les animations normales sur desktop
        document.documentElement.style.setProperty('--transition', 'all 0.3s ease');
    }
}

// Fonction debounce pour optimiser les performances
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Scroll smooth pour la navigation
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Charger les véhicules depuis l'API
async function loadVehicles() {
    try {
        const response = await fetch('/api/vehicles');
        const data = await response.json();
        
        if (data.success) {
            vehicles = data.data.vehicles;
            renderVehicles();
            renderAdminVehicles();
        } else {
            console.error('Erreur lors du chargement des véhicules:', data.message);
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
        // Charger des données de démonstration en cas d'erreur
        loadDemoVehicles();
    }
}

// Données de démonstration
function loadDemoVehicles() {
    vehicles = [
        {
            _id: '1',
            brand: 'Audi',
            model: 'A4',
            year: 2023,
            price: 31440000,
            category: 'Achat',
            description: 'Berline premium Audi A4 avec finitions luxueuses et performances exceptionnelles.',
            status: 'Disponible',
            specifications: {
                engine: '2.0L 4-cylindres TDI',
                transmission: 'Automatique',
                fuelType: 'Diesel',
                mileage: 18000,
                color: 'Gris métallisé',
                doors: 4,
                seats: 5
            },
            images: [{
                url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                publicId: 'autoparc/audi-a4',
                isPrimary: true
            }]
        },
        {
            _id: '2',
            brand: 'Tesla',
            model: 'Model 3',
            year: 2023,
            price: 36025000,
            category: 'Électrique/Hybride',
            description: 'Véhicule électrique révolutionnaire Tesla Model 3 avec autonomie exceptionnelle.',
            status: 'Disponible',
            specifications: {
                engine: 'Moteur électrique',
                transmission: 'Automatique',
                fuelType: 'Électrique',
                mileage: 12000,
                color: 'Blanc nacré',
                doors: 4,
                seats: 5
            },
            images: [{
                url: 'https://images.unsplash.com/photo-1536700503339-1e4b06520771?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                publicId: 'autoparc/tesla-model3',
                isPrimary: true
            }]
        },
        {
            _id: '3',
            brand: 'Porsche',
            model: '911',
            year: 2023,
            price: 78600000,
            category: 'Achat',
            description: 'Légendaire Porsche 911, icône du sport automobile avec performances exceptionnelles.',
            status: 'Disponible',
            specifications: {
                engine: '3.0L 6-cylindres à plat',
                transmission: 'Automatique',
                fuelType: 'Essence',
                mileage: 8000,
                color: 'Rouge Guards',
                doors: 2,
                seats: 4
            },
            images: [{
                url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                publicId: 'autoparc/porsche-911',
                isPrimary: true
            }]
        },
        {
            _id: '4',
            brand: 'Range Rover',
            model: 'Sport',
            year: 2023,
            price: 55675000,
            category: 'Achat',
            description: 'SUV de luxe Range Rover Sport alliant élégance britannique et capacités tout-terrain.',
            status: 'Disponible',
            specifications: {
                engine: '3.0L 6-cylindres',
                transmission: 'Automatique',
                fuelType: 'Diesel',
                mileage: 15000,
                color: 'Noir Santorini',
                doors: 5,
                seats: 7
            },
            images: [{
                url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                publicId: 'autoparc/range-rover-sport',
                isPrimary: true
            }]
        }
    ];
    
    renderVehicles();
    renderAdminVehicles();
}

// Rendu des véhicules dans la grille principale
function renderVehicles() {
    const vehiclesGrid = document.getElementById('vehiclesGrid');
    if (!vehiclesGrid) return;

    if (vehicles.length === 0) {
        vehiclesGrid.innerHTML = '<p style="text-align: center; color: var(--gray-color); grid-column: 1 / -1;">Aucun véhicule disponible pour le moment.</p>';
        return;
    }

    vehiclesGrid.innerHTML = vehicles.map(vehicle => `
        <div class="vehicle-card" data-aos="fade-up" onclick="showVehicleDetails('${vehicle._id}')">
            <div class="vehicle-image">
                <img src="${vehicle.images[0]?.url || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                     alt="${vehicle.brand} ${vehicle.model}"
                     loading="lazy">
            </div>
            <div class="vehicle-info">
                <h3>${vehicle.brand} ${vehicle.model}</h3>
                <p>Année: ${vehicle.year}</p>
                <div class="vehicle-price">
                    <div>${formatPrice(vehicle.price)} FCFA</div>
                </div>
                <div class="vehicle-actions">
                    <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); showVehicleDetails('${vehicle._id}')">
                        Voir détails
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); exportVehiclePDF('${vehicle._id}')">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Rendu des véhicules dans la section admin
function renderAdminVehicles() {
    const adminVehiclesList = document.getElementById('adminVehiclesList');
    if (!adminVehiclesList) return;

    if (vehicles.length === 0) {
        adminVehiclesList.innerHTML = '<p style="color: var(--gray-color);">Aucun véhicule en stock.</p>';
        return;
    }

    adminVehiclesList.innerHTML = vehicles.map((vehicle, index) => `
        <div class="admin-vehicle-item">
            <div class="admin-vehicle-info">
                <h4>${vehicle.brand} ${vehicle.model}</h4>
                <p>${vehicle.year} - ${vehicle.category} - ${formatPrice(vehicle.price)} FCFA</p>
            </div>
            <div class="admin-vehicle-actions">
                <button class="btn-edit" onclick="editVehicle(${index})">Modifier</button>
                <button class="btn-delete" onclick="deleteVehicle(${index})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

// Formatage des prix
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price);
}

// Afficher les détails d'un véhicule
function showVehicleDetails(vehicleId) {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (!vehicle) return;

    currentVehicle = vehicle;
    
    const modal = document.getElementById('vehicleModal');
    const modalContent = document.getElementById('modalContent');
    
    if (modal && modalContent) {
        modalContent.innerHTML = `
            <div class="vehicle-details">
                <div class="vehicle-details-image">
                    <img src="${vehicle.images[0]?.url || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                         alt="${vehicle.brand} ${vehicle.model}">
                </div>
                <div class="vehicle-details-info">
                    <h2>${vehicle.brand} ${vehicle.model}</h2>
                    <div class="vehicle-details-specs">
                        <div class="spec"><strong>Année:</strong> ${vehicle.year}</div>
                        <div class="spec"><strong>Catégorie:</strong> ${vehicle.category}</div>
                        <div class="spec"><strong>Moteur:</strong> ${vehicle.specifications?.engine || 'Non spécifié'}</div>
                        <div class="spec"><strong>Transmission:</strong> ${vehicle.specifications?.transmission || 'Non spécifié'}</div>
                        <div class="spec"><strong>Carburant:</strong> ${vehicle.specifications?.fuelType || 'Non spécifié'}</div>
                        <div class="spec"><strong>Kilométrage:</strong> ${vehicle.specifications?.mileage || 'Non spécifié'} km</div>
                        <div class="spec"><strong>Couleur:</strong> ${vehicle.specifications?.color || 'Non spécifié'}</div>
                        <div class="spec"><strong>Portes:</strong> ${vehicle.specifications?.doors || 'Non spécifié'}</div>
                        <div class="spec"><strong>Sièges:</strong> ${vehicle.specifications?.seats || 'Non spécifié'}</div>
                    </div>
                    <div class="vehicle-details-description">
                        <h3>Description</h3>
                        <p>${vehicle.description || 'Aucune description disponible.'}</p>
                    </div>
                    <div class="vehicle-price" style="margin: 1.5rem 0;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">
                            ${formatPrice(vehicle.price)} FCFA
                        </div>
                    </div>
                    <div class="vehicle-details-actions">
                        <button class="btn btn-primary" onclick="contactAboutVehicle('${vehicle._id}')">
                            <i class="fas fa-phone"></i> Nous contacter
                        </button>
                        <button class="btn btn-secondary" onclick="exportVehiclePDF('${vehicle._id}')">
                            <i class="fas fa-file-pdf"></i> Télécharger PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }
}

// Initialiser les événements
function initEvents() {
    // Fermer le modal
    const modal = document.getElementById('vehicleModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Navigation active
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Initialiser les formulaires
function initForms() {
    // Formulaire de contact
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Formulaire de véhicule
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', handleVehicleSubmit);
    }
}

// Initialiser les modals
function initModals() {
    // Fermer les modals avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

// Gérer la soumission du formulaire de contact
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('Message envoyé avec succès !', 'success');
            e.target.reset();
        } else {
            showMessage('Erreur lors de l\'envoi du message.', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showMessage('Erreur de connexion. Veuillez réessayer.', 'error');
    }
}

// Gérer la soumission du formulaire de véhicule
async function handleVehicleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        brand: formData.get('brand'),
        model: formData.get('model'),
        year: parseInt(formData.get('year')),
        price: parseInt(formData.get('price')),
        category: formData.get('category'),
        description: formData.get('description')
    };

    try {
        const response = await fetch('/api/vehicles/public', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            showMessage('Véhicule ajouté avec succès !', 'success');
            e.target.reset();
            loadVehicles(); // Recharger la liste
        } else {
            showMessage('Erreur lors de l\'ajout du véhicule.', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showMessage('Erreur de connexion. Veuillez réessayer.', 'error');
    }
}

// Afficher un message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insérer le message en haut de la page
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // Supprimer le message après 5 secondes
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Exporter un véhicule en PDF
function exportVehiclePDF(vehicleId) {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (!vehicle) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text(`${vehicle.brand} ${vehicle.model}`, 20, 20);
    
    // Informations
    doc.setFontSize(12);
    doc.text(`Année: ${vehicle.year}`, 20, 40);
    doc.text(`Catégorie: ${vehicle.category}`, 20, 50);
    doc.text(`Prix: ${formatPrice(vehicle.price)} FCFA`, 20, 60);
    doc.text(`Moteur: ${vehicle.specifications?.engine || 'Non spécifié'}`, 20, 70);
    doc.text(`Transmission: ${vehicle.specifications?.transmission || 'Non spécifié'}`, 20, 80);
    doc.text(`Carburant: ${vehicle.specifications?.fuelType || 'Non spécifié'}`, 20, 90);
    doc.text(`Kilométrage: ${vehicle.specifications?.mileage || 'Non spécifié'} km`, 20, 100);
    doc.text(`Couleur: ${vehicle.specifications?.color || 'Non spécifié'}`, 20, 110);
    
    // Description
    if (vehicle.description) {
        doc.text('Description:', 20, 130);
        const splitDescription = doc.splitTextToSize(vehicle.description, 170);
        doc.text(splitDescription, 20, 140);
    }
    
    doc.save(`${vehicle.brand}_${vehicle.model}_${vehicle.year}.pdf`);
}

// Exporter tous les véhicules en PDF
function exportAllVehiclesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Catalogue AutoParc', 20, 20);
    
    let yPosition = 40;
    vehicles.forEach((vehicle, index) => {
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${vehicle.brand} ${vehicle.model} (${vehicle.year})`, 20, yPosition);
        doc.setFontSize(10);
        doc.text(`Prix: ${formatPrice(vehicle.price)} FCFA`, 25, yPosition + 7);
        doc.text(`Catégorie: ${vehicle.category}`, 25, yPosition + 14);
        
        yPosition += 25;
    });
    
    doc.save('catalogue_autoparc.pdf');
}

// Contacter à propos d'un véhicule
function contactAboutVehicle(vehicleId) {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (!vehicle) return;
    
    // Fermer le modal
    const modal = document.getElementById('vehicleModal');
    modal.style.display = 'none';
    
    // Faire défiler vers la section contact
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        
        // Pré-remplir le message
        const messageField = document.getElementById('message');
        if (messageField) {
            messageField.value = `Bonjour, je suis intéressé(e) par le véhicule ${vehicle.brand} ${vehicle.model} (${vehicle.year}). Pouvez-vous me donner plus d'informations ?`;
        }
    }
}

// Éditer un véhicule
function editVehicle(index) {
    const vehicle = vehicles[index];
    if (!vehicle) return;
    
    // Remplir le formulaire
    document.getElementById('vehicleId').value = index;
    document.getElementById('brand').value = vehicle.brand;
    document.getElementById('model').value = vehicle.model;
    document.getElementById('year').value = vehicle.year;
    document.getElementById('price').value = vehicle.price;
    document.getElementById('category').value = vehicle.category;
    document.getElementById('description').value = vehicle.description || '';
    
    // Faire défiler vers le formulaire
    const adminSection = document.getElementById('gestion');
    if (adminSection) {
        adminSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Supprimer un véhicule
function deleteVehicle(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
        vehicles.splice(index, 1);
        renderVehicles();
        renderAdminVehicles();
        showMessage('Véhicule supprimé avec succès.', 'success');
    }
}

// Objet global pour l'application
window.app = {
    loadVehicles,
    renderVehicles,
    showVehicleDetails,
    exportVehiclePDF,
    exportAllVehiclesPDF,
    contactAboutVehicle,
    editVehicle,
    deleteVehicle
};
