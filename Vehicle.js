const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: [true, 'La marque est requise'],
    trim: true,
    maxlength: [50, 'La marque ne peut pas dépasser 50 caractères']
  },
  model: {
    type: String,
    required: [true, 'Le modèle est requis'],
    trim: true,
    maxlength: [100, 'Le modèle ne peut pas dépasser 100 caractères']
  },
  year: {
    type: Number,
    required: [true, 'L\'année est requise'],
    min: [1900, 'L\'année doit être supérieure à 1900'],
    max: [new Date().getFullYear() + 1, 'L\'année ne peut pas être dans le futur']
  },
  price: {
    type: Number,
    required: [true, 'Le prix en FCFA est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  priceEUR: {
    type: Number,
    required: false,
    min: [0, 'Le prix en euros ne peut pas être négatif']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: {
      values: ['Achat', 'Location', 'Option d\'achat', 'Deux-roues', 'Électrique/Hybride'],
      message: 'Catégorie invalide'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  specifications: {
    engine: {
      type: String,
      trim: true
    },
    transmission: {
      type: String,
      enum: ['Manuelle', 'Automatique', 'Semi-automatique']
    },
    fuelType: {
      type: String,
      enum: ['Essence', 'Diesel', 'Électrique', 'Hybride', 'GPL', 'Hydrogène']
    },
    mileage: {
      type: Number,
      min: [0, 'Le kilométrage ne peut pas être négatif']
    },
    color: {
      type: String,
      trim: true
    },
    doors: {
      type: Number,
      min: [2, 'Le nombre de portes doit être au moins 2'],
      max: [5, 'Le nombre de portes ne peut pas dépasser 5']
    },
    seats: {
      type: Number,
      min: [2, 'Le nombre de sièges doit être au moins 2'],
      max: [9, 'Le nombre de sièges ne peut pas dépasser 9']
    }
  },
  status: {
    type: String,
    enum: ['Disponible', 'En maintenance', 'Affecté', 'Vendu', 'Réservé'],
    default: 'Disponible'
  },
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
  history: [{
    action: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: {
      type: String,
      trim: true
    }
  }],
  maintenance: {
    lastService: {
      type: Date
    },
    nextService: {
      type: Date
    },
    serviceHistory: [{
      date: {
        type: Date,
        required: true
      },
      type: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      cost: {
        type: Number,
        min: [0, 'Le coût ne peut pas être négatif']
      },
      garage: {
        type: String,
        trim: true
      }
    }]
  },
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['Carte grise', 'Assurance', 'Contrôle technique', 'Facture', 'Autre'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
vehicleSchema.index({ brand: 1, model: 1 });
vehicleSchema.index({ category: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ price: 1 });
vehicleSchema.index({ year: 1 });
vehicleSchema.index({ isActive: 1 });
vehicleSchema.index({ 'specifications.fuelType': 1 });

// Méthode pour ajouter une entrée dans l'historique
vehicleSchema.methods.addHistoryEntry = function(action, userId, details = '') {
  this.history.push({
    action,
    user: userId,
    details
  });
  return this.save();
};

// Méthode pour ajouter un service de maintenance
vehicleSchema.methods.addMaintenanceService = function(serviceData) {
  this.maintenance.serviceHistory.push(serviceData);
  this.maintenance.lastService = serviceData.date;
  return this.save();
};

// Méthode pour obtenir l'image principale
vehicleSchema.methods.getPrimaryImage = function() {
  const primaryImage = this.images.find(img => img.isPrimary);
  return primaryImage ? primaryImage.url : (this.images[0] ? this.images[0].url : null);
};

// Méthode pour définir une image comme principale
vehicleSchema.methods.setPrimaryImage = function(imageId) {
  // Retirer le statut principal de toutes les images
  this.images.forEach(img => img.isPrimary = false);
  
  // Définir l'image spécifiée comme principale
  const targetImage = this.images.id(imageId);
  if (targetImage) {
    targetImage.isPrimary = true;
  }
  
  return this.save();
};

// Méthode pour vérifier si un document est expiré
vehicleSchema.methods.getExpiredDocuments = function() {
  const today = new Date();
  return this.documents.filter(doc => 
    doc.expiryDate && doc.expiryDate < today
  );
};

// Méthode pour obtenir les documents expirant bientôt (dans les 30 jours)
vehicleSchema.methods.getExpiringDocuments = function() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  return this.documents.filter(doc => 
    doc.expiryDate && 
    doc.expiryDate > today && 
    doc.expiryDate <= thirtyDaysFromNow
  );
};

// Virtual pour le nom complet du véhicule
vehicleSchema.virtual('fullName').get(function() {
  return `${this.brand} ${this.model}`;
});

// Virtual pour l'âge du véhicule
vehicleSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

// Virtual pour le prix formaté en FCFA
vehicleSchema.virtual('formattedPriceFCFA').get(function() {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(this.price);
});

// Virtual pour le prix formaté en EUR
vehicleSchema.virtual('formattedPriceEUR').get(function() {
  if (!this.priceEUR) {
    return 'Non disponible';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(this.priceEUR);
});

// Virtual pour vérifier si le véhicule est disponible
vehicleSchema.virtual('isAvailable').get(function() {
  return this.status === 'Disponible' && this.isActive;
});

// Virtual pour le prochain service
vehicleSchema.virtual('needsService').get(function() {
  if (!this.maintenance.nextService) return false;
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  return this.maintenance.nextService <= thirtyDaysFromNow;
});

// Méthodes statiques pour les requêtes courantes
vehicleSchema.statics.findAvailable = function() {
  return this.find({ status: 'Disponible', isActive: true });
};

vehicleSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

vehicleSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
  return this.find({
    price: { $gte: minPrice, $lte: maxPrice },
    isActive: true
  });
};

vehicleSchema.statics.findByYearRange = function(minYear, maxYear) {
  return this.find({
    year: { $gte: minYear, $lte: maxYear },
    isActive: true
  });
};

module.exports = mongoose.model('Vehicle', vehicleSchema); 