const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const { auth, requireManager, checkOwnership } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation pour la création/modification de véhicule
const vehicleValidation = [
  body('brand')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La marque doit contenir entre 2 et 50 caractères'),
  body('model')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le modèle doit contenir entre 2 et 100 caractères'),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('L\'année doit être comprise entre 1900 et l\'année prochaine'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Le prix en FCFA doit être un nombre positif'),
  body('priceEUR')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix en euros doit être un nombre positif'),
  body('category')
    .isIn(['Achat', 'Location', 'Option d\'achat', 'Deux-roues', 'Électrique/Hybride'])
    .withMessage('Catégorie invalide'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères'),
  body('status')
    .optional()
    .isIn(['Disponible', 'En maintenance', 'Affecté', 'Vendu', 'Réservé'])
    .withMessage('Statut invalide')
];

// @route   GET /api/vehicles
// @desc    Obtenir tous les véhicules (avec filtres)
// @access  Public
router.get('/', [
  query('category').optional().isIn(['Achat', 'Location', 'Option d\'achat', 'Deux-roues', 'Électrique/Hybride']),
  query('status').optional().isIn(['Disponible', 'En maintenance', 'Affecté', 'Vendu', 'Réservé']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('minYear').optional().isInt({ min: 1900 }),
  query('maxYear').optional().isInt({ min: 1900 }),
  query('brand').optional().trim(),
  query('fuelType').optional().isIn(['Essence', 'Diesel', 'Électrique', 'Hybride', 'GPL', 'Hydrogène']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['price', '-price', 'year', '-year', 'brand', '-brand', 'createdAt', '-createdAt'])
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
    category,
    status,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    brand,
    fuelType,
    page = 1,
    limit = 10,
    sort = '-createdAt'
  } = req.query;

  // Construire le filtre
  const filter = { isActive: true };

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (brand) filter.brand = { $regex: brand, $options: 'i' };
  if (fuelType) filter['specifications.fuelType'] = fuelType;

  // Filtres de prix
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Filtres d'année
  if (minYear || maxYear) {
    filter.year = {};
    if (minYear) filter.year.$gte = parseInt(minYear);
    if (maxYear) filter.year.$lte = parseInt(maxYear);
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Exécuter la requête
  const vehicles = await Vehicle.find(filter)
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Compter le total
  const total = await Vehicle.countDocuments(filter);

  // Calculer les statistiques
  const stats = await Vehicle.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalVehicles: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        byCategory: { $push: '$category' },
        byStatus: { $push: '$status' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || {
        totalVehicles: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        byCategory: {},
        byStatus: {}
      }
    }
  });
}));

// @route   GET /api/vehicles/:id
// @desc    Obtenir un véhicule par ID
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('history.user', 'name email');

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Véhicule non trouvé'
    });
  }

  res.json({
    success: true,
    data: { vehicle }
  });
}));

// @route   POST /api/vehicles/public
// @desc    Créer un nouveau véhicule (route publique)
// @access  Public
router.post('/public', vehicleValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const vehicleData = {
    ...req.body,
    status: 'Disponible',
    isActive: true
  };

  const vehicle = new Vehicle(vehicleData);
  await vehicle.save();

  res.status(201).json({
    success: true,
    message: 'Véhicule ajouté avec succès',
    data: { vehicle }
  });
}));

// @route   POST /api/vehicles
// @desc    Créer un nouveau véhicule
// @access  Private (Manager/Admin)
router.post('/', auth, requireManager, vehicleValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const vehicleData = {
    ...req.body,
    createdBy: req.user._id
  };

  const vehicle = new Vehicle(vehicleData);
  await vehicle.save();

  // Ajouter une entrée dans l'historique
  await vehicle.addHistoryEntry('Véhicule créé', req.user._id, 'Création initiale du véhicule');

  // Populate les références
  await vehicle.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Véhicule créé avec succès',
    data: { vehicle }
  });
}));

// @route   PUT /api/vehicles/:id
// @desc    Mettre à jour un véhicule
// @access  Private (Manager/Admin)
router.put('/:id', auth, requireManager, checkOwnership('Vehicle'), vehicleValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const vehicle = req.resource;
  
  // Mettre à jour les champs
  Object.keys(req.body).forEach(key => {
    if (key !== 'createdBy' && key !== '_id') {
      vehicle[key] = req.body[key];
    }
  });

  vehicle.updatedBy = req.user._id;
  await vehicle.save();

  // Ajouter une entrée dans l'historique
  await vehicle.addHistoryEntry('Véhicule modifié', req.user._id, 'Mise à jour des informations');

  // Populate les références
  await vehicle.populate('createdBy', 'name email');
  await vehicle.populate('updatedBy', 'name email');

  res.json({
    success: true,
    message: 'Véhicule mis à jour avec succès',
    data: { vehicle }
  });
}));

// @route   DELETE /api/vehicles/:id
// @desc    Supprimer un véhicule (soft delete)
// @access  Private (Manager/Admin)
router.delete('/:id', auth, requireManager, checkOwnership('Vehicle'), asyncHandler(async (req, res) => {
  const vehicle = req.resource;
  
  // Soft delete
  vehicle.isActive = false;
  vehicle.updatedBy = req.user._id;
  await vehicle.save();

  // Ajouter une entrée dans l'historique
  await vehicle.addHistoryEntry('Véhicule supprimé', req.user._id, 'Suppression du véhicule');

  res.json({
    success: true,
    message: 'Véhicule supprimé avec succès'
  });
}));

// @route   PUT /api/vehicles/:id/status
// @desc    Changer le statut d'un véhicule
// @access  Private (Manager/Admin)
router.put('/:id/status', auth, requireManager, [
  body('status')
    .isIn(['Disponible', 'En maintenance', 'Affecté', 'Vendu', 'Réservé'])
    .withMessage('Statut invalide'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les détails ne peuvent pas dépasser 500 caractères')
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

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Véhicule non trouvé'
    });
  }

  const { status, details } = req.body;
  const oldStatus = vehicle.status;
  
  vehicle.status = status;
  vehicle.updatedBy = req.user._id;
  await vehicle.save();

  // Ajouter une entrée dans l'historique
  const historyDetails = details || `Changement de statut: ${oldStatus} → ${status}`;
  await vehicle.addHistoryEntry('Changement de statut', req.user._id, historyDetails);

  res.json({
    success: true,
    message: 'Statut du véhicule mis à jour avec succès',
    data: { vehicle }
  });
}));

// @route   POST /api/vehicles/:id/history
// @desc    Ajouter une entrée dans l'historique
// @access  Private (Manager/Admin)
router.post('/:id/history', auth, requireManager, [
  body('action')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('L\'action doit contenir entre 1 et 200 caractères'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les détails ne peuvent pas dépasser 500 caractères')
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

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Véhicule non trouvé'
    });
  }

  const { action, details } = req.body;
  
  await vehicle.addHistoryEntry(action, req.user._id, details);

  res.json({
    success: true,
    message: 'Entrée ajoutée à l\'historique avec succès',
    data: { vehicle }
  });
}));

// @route   POST /api/vehicles/:id/maintenance
// @desc    Ajouter un service de maintenance
// @access  Private (Manager/Admin)
router.post('/:id/maintenance', auth, requireManager, [
  body('date')
    .isISO8601()
    .withMessage('Date invalide'),
  body('type')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Le type doit contenir entre 1 et 100 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le coût doit être un nombre positif'),
  body('garage')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom du garage ne peut pas dépasser 100 caractères')
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

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Véhicule non trouvé'
    });
  }

  const serviceData = {
    date: new Date(req.body.date),
    type: req.body.type,
    description: req.body.description,
    cost: req.body.cost,
    garage: req.body.garage
  };

  await vehicle.addMaintenanceService(serviceData);

  // Ajouter une entrée dans l'historique
  await vehicle.addHistoryEntry('Service de maintenance ajouté', req.user._id, `Type: ${serviceData.type}`);

  res.json({
    success: true,
    message: 'Service de maintenance ajouté avec succès',
    data: { vehicle }
  });
}));

// @route   GET /api/vehicles/stats/overview
// @desc    Obtenir les statistiques générales
// @access  Private (Manager/Admin)
router.get('/stats/overview', auth, requireManager, asyncHandler(async (req, res) => {
  const stats = await Vehicle.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalVehicles: { $sum: 1 },
        totalValue: { $sum: '$price' },
        avgPrice: { $avg: '$price' },
        byCategory: { $push: '$category' },
        byStatus: { $push: '$status' },
        byFuelType: { $push: '$specifications.fuelType' },
        byYear: { $push: '$year' }
      }
    }
  ]);

  if (stats.length === 0) {
    return res.json({
      success: true,
      data: {
        totalVehicles: 0,
        totalValue: 0,
        avgPrice: 0,
        byCategory: {},
        byStatus: {},
        byFuelType: {},
        byYear: {}
      }
    });
  }

  const stat = stats[0];
  
  // Compter les occurrences
  const countOccurrences = (arr) => {
    return arr.reduce((acc, val) => {
      if (val) {
        acc[val] = (acc[val] || 0) + 1;
      }
      return acc;
    }, {});
  };

  res.json({
    success: true,
    data: {
      totalVehicles: stat.totalVehicles,
      totalValue: stat.totalValue,
      avgPrice: stat.avgPrice,
      byCategory: countOccurrences(stat.byCategory),
      byStatus: countOccurrences(stat.byStatus),
      byFuelType: countOccurrences(stat.byFuelType),
      byYear: countOccurrences(stat.byYear)
    }
  });
}));

// @route   GET /api/vehicles/search
// @desc    Rechercher des véhicules
// @access  Public
router.get('/search', [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('La recherche doit contenir au moins 2 caractères'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Paramètres de recherche invalides',
      errors: errors.array()
    });
  }

  const { q, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Recherche dans plusieurs champs
  const searchQuery = {
    isActive: true,
    $or: [
      { brand: { $regex: q, $options: 'i' } },
      { model: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { 'specifications.engine': { $regex: q, $options: 'i' } },
      { 'specifications.color': { $regex: q, $options: 'i' } }
    ]
  };

  const vehicles = await Vehicle.find(searchQuery)
    .populate('createdBy', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Vehicle.countDocuments(searchQuery);

  res.json({
    success: true,
    data: {
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      searchTerm: q
    }
  });
}));

module.exports = router; 