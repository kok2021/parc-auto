const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Contact = require('../models/Contact');
const { auth, requireManager } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendContactNotification, sendContactResponse } = require('../utils/emailService');

const router = express.Router();

// Validation pour la création de contact
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Le sujet doit contenir entre 1 et 200 caractères'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Le message doit contenir entre 10 et 2000 caractères'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Veuillez entrer un numéro de téléphone valide'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom de l\'entreprise ne peut pas dépasser 100 caractères'),
  body('type')
    .optional()
    .isIn(['Demande d\'information', 'Devis', 'Réservation', 'Réclamation', 'Autre'])
    .withMessage('Type de demande invalide')
];

// @route   POST /api/contact
// @desc    Créer un nouveau contact
// @access  Public
router.post('/', contactValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const contactData = {
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  };

  const contact = new Contact(contactData);
  await contact.save();

  // Envoyer une notification par email
  try {
    await sendContactNotification(contact);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
    data: {
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt
      }
    }
  });
}));

// @route   GET /api/contact
// @desc    Obtenir tous les contacts (admin/manager)
// @access  Private
router.get('/', auth, requireManager, [
  query('status').optional().isIn(['Nouveau', 'En cours', 'Répondu', 'Fermé']),
  query('priority').optional().isIn(['Faible', 'Normale', 'Élevée', 'Urgente']),
  query('type').optional().isIn(['Demande d\'information', 'Devis', 'Réservation', 'Réclamation', 'Autre']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['createdAt', '-createdAt', 'priority', '-priority', 'status', '-status'])
], asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Paramètres de requête invalides',
      errors: errors.array()
    });
  }

  const {
    status,
    priority,
    type,
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = req.query;

  // Construire le filtre
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Exécuter la requête
  const contacts = await Contact.find(filter)
    .populate('assignedTo', 'name email')
    .populate('responses.sentBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Compter le total
  const total = await Contact.countDocuments(filter);

  // Obtenir les statistiques
  const stats = await Contact.getStats();

  res.json({
    success: true,
    data: {
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    }
  });
}));

// @route   GET /api/contact/:id
// @desc    Obtenir un contact par ID
// @access  Private
router.get('/:id', auth, requireManager, asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('responses.sentBy', 'name email')
    .populate('readBy', 'name email');

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact non trouvé'
    });
  }

  // Marquer comme lu si ce n'est pas déjà fait
  if (!contact.isRead) {
    await contact.markAsRead(req.user._id);
  }

  res.json({
    success: true,
    data: { contact }
  });
}));

// @route   PUT /api/contact/:id/status
// @desc    Mettre à jour le statut d'un contact
// @access  Private
router.put('/:id/status', auth, requireManager, [
  body('status')
    .isIn(['Nouveau', 'En cours', 'Répondu', 'Fermé'])
    .withMessage('Statut invalide')
], asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact non trouvé'
    });
  }

  const { status } = req.body;
  await contact.updateStatus(status);

  res.json({
    success: true,
    message: 'Statut mis à jour avec succès',
    data: { contact }
  });
}));

// @route   POST /api/contact/:id/response
// @desc    Ajouter une réponse à un contact
// @access  Private
router.post('/:id/response', auth, requireManager, [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Le message doit contenir entre 1 et 2000 caractères'),
  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal doit être un booléen')
], asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact non trouvé'
    });
  }

  const { message, isInternal = false } = req.body;
  
  await contact.addResponse(message, req.user._id, isInternal);

  // Envoyer la réponse par email si ce n'est pas une note interne
  if (!isInternal) {
    try {
      await sendContactResponse(contact, message);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error);
    }
  }

  res.json({
    success: true,
    message: 'Réponse ajoutée avec succès',
    data: { contact }
  });
}));

// @route   PUT /api/contact/:id/assign
// @desc    Assigner un contact à un utilisateur
// @access  Private
router.put('/:id/assign', auth, requireManager, [
  body('assignedTo')
    .isMongoId()
    .withMessage('ID utilisateur invalide')
], asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact non trouvé'
    });
  }

  const { assignedTo } = req.body;
  await contact.assignTo(assignedTo);

  res.json({
    success: true,
    message: 'Contact assigné avec succès',
    data: { contact }
  });
}));

// @route   PUT /api/contact/:id/tags
// @desc    Ajouter/supprimer des tags
// @access  Private
router.put('/:id/tags', auth, requireManager, [
  body('action')
    .isIn(['add', 'remove'])
    .withMessage('Action invalide (add ou remove)'),
  body('tags')
    .isArray({ min: 1 })
    .withMessage('Tags doit être un tableau non vide'),
  body('tags.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Chaque tag doit contenir entre 1 et 50 caractères')
], asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact non trouvé'
    });
  }

  const { action, tags } = req.body;
  
  if (action === 'add') {
    await contact.addTags(tags);
  } else {
    await contact.removeTags(tags);
  }

  res.json({
    success: true,
    message: `Tags ${action === 'add' ? 'ajoutés' : 'supprimés'} avec succès`,
    data: { contact }
  });
}));

// @route   PUT /api/contact/:id/follow-up
// @desc    Planifier un suivi
// @access  Private
router.put('/:id/follow-up', auth, requireManager, [
  body('followUpDate')
    .isISO8601()
    .withMessage('Date de suivi invalide')
], asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact non trouvé'
    });
  }

  const { followUpDate } = req.body;
  await contact.scheduleFollowUp(new Date(followUpDate));

  res.json({
    success: true,
    message: 'Suivi planifié avec succès',
    data: { contact }
  });
}));

// @route   GET /api/contact/stats/overview
// @desc    Obtenir les statistiques des contacts
// @access  Private
router.get('/stats/overview', auth, requireManager, asyncHandler(async (req, res) => {
  const stats = await Contact.getStats();
  
  // Ajouter des statistiques supplémentaires
  const overdueFollowUps = await Contact.findOverdueFollowUps();
  const unreadContacts = await Contact.findUnread();

  res.json({
    success: true,
    data: {
      ...stats,
      overdueFollowUps: overdueFollowUps.length,
      unreadContacts: unreadContacts.length
    }
  });
}));

// @route   GET /api/contact/assigned/:userId
// @desc    Obtenir les contacts assignés à un utilisateur
// @access  Private
router.get('/assigned/:userId', auth, requireManager, asyncHandler(async (req, res) => {
  const contacts = await Contact.findByAssignedUser(req.params.userId)
    .populate('assignedTo', 'name email')
    .sort('-createdAt')
    .lean();

  res.json({
    success: true,
    data: { contacts }
  });
}));

module.exports = router; 