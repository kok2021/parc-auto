const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez entrer un email valide'
    ]
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Veuillez entrer un numéro de téléphone valide']
  },
  subject: {
    type: String,
    required: [true, 'Le sujet est requis'],
    trim: true,
    maxlength: [200, 'Le sujet ne peut pas dépasser 200 caractères']
  },
  message: {
    type: String,
    required: [true, 'Le message est requis'],
    trim: true,
    maxlength: [2000, 'Le message ne peut pas dépasser 2000 caractères']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères']
  },
  type: {
    type: String,
    enum: ['Demande d\'information', 'Devis', 'Réservation', 'Réclamation', 'Autre'],
    default: 'Demande d\'information'
  },
  priority: {
    type: String,
    enum: ['Faible', 'Normale', 'Élevée', 'Urgente'],
    default: 'Normale'
  },
  status: {
    type: String,
    enum: ['Nouveau', 'En cours', 'Répondu', 'Fermé'],
    default: 'Nouveau'
  },
  source: {
    type: String,
    enum: ['Site web', 'Email', 'Téléphone', 'Réseaux sociaux', 'Autre'],
    default: 'Site web'
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responses: [{
    message: {
      type: String,
      required: true,
      trim: true
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  followUpDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ type: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ isRead: 1 });
contactSchema.index({ assignedTo: 1 });

// Méthode pour marquer comme lu
contactSchema.methods.markAsRead = function(userId) {
  this.isRead = true;
  this.readAt = new Date();
  this.readBy = userId;
  return this.save();
};

// Méthode pour ajouter une réponse
contactSchema.methods.addResponse = function(message, userId, isInternal = false) {
  this.responses.push({
    message,
    sentBy: userId,
    isInternal
  });
  
  // Mettre à jour le statut si c'est la première réponse
  if (this.status === 'Nouveau') {
    this.status = 'En cours';
  }
  
  return this.save();
};

// Méthode pour assigner à un utilisateur
contactSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  return this.save();
};

// Méthode pour changer le statut
contactSchema.methods.updateStatus = function(status) {
  this.status = status;
  return this.save();
};

// Méthode pour ajouter des tags
contactSchema.methods.addTags = function(tags) {
  const newTags = Array.isArray(tags) ? tags : [tags];
  newTags.forEach(tag => {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  });
  return this.save();
};

// Méthode pour supprimer des tags
contactSchema.methods.removeTags = function(tags) {
  const tagsToRemove = Array.isArray(tags) ? tags : [tags];
  this.tags = this.tags.filter(tag => !tagsToRemove.includes(tag));
  return this.save();
};

// Méthode pour planifier un suivi
contactSchema.methods.scheduleFollowUp = function(date) {
  this.followUpDate = date;
  return this.save();
};

// Virtual pour vérifier si le contact a des réponses
contactSchema.virtual('hasResponses').get(function() {
  return this.responses.length > 0;
});

// Virtual pour la dernière réponse
contactSchema.virtual('lastResponse').get(function() {
  if (this.responses.length === 0) return null;
  return this.responses[this.responses.length - 1];
});

// Virtual pour le temps écoulé depuis la création
contactSchema.virtual('timeSinceCreation').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} jour(s) et ${hours} heure(s)`;
  }
  return `${hours} heure(s)`;
});

// Virtual pour vérifier si le suivi est en retard
contactSchema.virtual('isFollowUpOverdue').get(function() {
  if (!this.followUpDate) return false;
  return new Date() > this.followUpDate;
});

// Virtual pour le nom complet du contact
contactSchema.virtual('fullName').get(function() {
  return this.name;
});

// Méthodes statiques pour les requêtes courantes
contactSchema.statics.findUnread = function() {
  return this.find({ isRead: false });
};

contactSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

contactSchema.statics.findByPriority = function(priority) {
  return this.find({ priority });
};

contactSchema.statics.findOverdueFollowUps = function() {
  return this.find({
    followUpDate: { $lt: new Date() }
  });
};

contactSchema.statics.findByAssignedUser = function(userId) {
  return this.find({ assignedTo: userId });
};

// Méthode statique pour obtenir les statistiques
contactSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: ['$isRead', 0, 1] }
        },
        byStatus: {
          $push: '$status'
        },
        byPriority: {
          $push: '$priority'
        },
        byType: {
          $push: '$type'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      unread: 0,
      byStatus: {},
      byPriority: {},
      byType: {}
    };
  }

  const stat = stats[0];
  
  // Compter les occurrences
  const countOccurrences = (arr) => {
    return arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
  };

  return {
    total: stat.total,
    unread: stat.unread,
    byStatus: countOccurrences(stat.byStatus),
    byPriority: countOccurrences(stat.byPriority),
    byType: countOccurrences(stat.byType)
  };
};

module.exports = mongoose.model('Contact', contactSchema); 