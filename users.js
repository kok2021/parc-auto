const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation pour la création/modification d'utilisateur
const userValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'manager'])
    .withMessage('Rôle invalide'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom de l\'entreprise ne peut pas dépasser 100 caractères'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Veuillez entrer un numéro de téléphone valide')
];

// @route   GET /api/users
// @desc    Obtenir tous les utilisateurs (admin seulement)
// @access  Private (Admin)
router.get('/', auth, requireAdmin, [
  query('role').optional().isIn(['user', 'admin', 'manager']),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['name', '-name', 'email', '-email', 'createdAt', '-createdAt', 'lastLogin', '-lastLogin'])
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
    role,
    isActive,
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = req.query;

  // Construire le filtre
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Exécuter la requête
  const users = await User.find(filter)
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Compter le total
  const total = await User.countDocuments(filter);

  // Statistiques
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        byRole: { $push: '$role' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        byRole: {}
      }
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Obtenir un utilisateur par ID
// @access  Private (Admin ou propriétaire)
router.get('/:id', auth, asyncHandler(async (req, res) => {
  // Vérifier les permissions
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé'
    });
  }

  const user = await User.findById(req.params.id)
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// @route   POST /api/users
// @desc    Créer un nouvel utilisateur (admin seulement)
// @access  Private (Admin)
router.post('/', auth, requireAdmin, [
  ...userValidation,
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
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

  const { name, email, password, role, company, phone } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Un utilisateur avec cet email existe déjà'
    });
  }

  // Créer le nouvel utilisateur
  const user = new User({
    name,
    email,
    password,
    role: role || 'user',
    company,
    phone
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'Utilisateur créé avec succès',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   PUT /api/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Private (Admin ou propriétaire)
router.put('/:id', auth, userValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  // Vérifier les permissions
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé'
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }

  // Mettre à jour les champs
  const { name, email, role, company, phone } = req.body;
  
  if (name) user.name = name;
  if (email && email !== user.email) {
    // Vérifier si le nouvel email existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser._id.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }
    user.email = email;
  }
  if (role && req.user.role === 'admin') user.role = role;
  if (company !== undefined) user.company = company;
  if (phone !== undefined) user.phone = phone;

  await user.save();

  res.json({
    success: true,
    message: 'Utilisateur mis à jour avec succès',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   DELETE /api/users/:id
// @desc    Supprimer un utilisateur (soft delete)
// @access  Private (Admin)
router.delete('/:id', auth, requireAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }

  // Empêcher la suppression de son propre compte
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Vous ne pouvez pas supprimer votre propre compte'
    });
  }

  // Soft delete
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'Utilisateur supprimé avec succès'
  });
}));

// @route   PUT /api/users/:id/activate
// @desc    Réactiver un utilisateur
// @access  Private (Admin)
router.put('/:id/activate', auth, requireAdmin, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }

  user.isActive = true;
  await user.save();

  res.json({
    success: true,
    message: 'Utilisateur réactivé avec succès',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   PUT /api/users/:id/role
// @desc    Changer le rôle d'un utilisateur
// @access  Private (Admin)
router.put('/:id/role', auth, requireAdmin, [
  body('role')
    .isIn(['user', 'admin', 'manager'])
    .withMessage('Rôle invalide')
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

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Utilisateur non trouvé'
    });
  }

  const { role } = req.body;
  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: 'Rôle mis à jour avec succès',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   GET /api/users/stats/overview
// @desc    Obtenir les statistiques des utilisateurs
// @access  Private (Admin)
router.get('/stats/overview', auth, requireAdmin, asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        byRole: { $push: '$role' },
        verifiedEmails: { $sum: { $cond: ['$emailVerified', 1, 0] } }
      }
    }
  ]);

  if (stats.length === 0) {
    return res.json({
      success: true,
      data: {
        totalUsers: 0,
        activeUsers: 0,
        byRole: {},
        verifiedEmails: 0
      }
    });
  }

  const stat = stats[0];
  
  // Compter les occurrences par rôle
  const countByRole = stat.byRole.reduce((acc, role) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalUsers: stat.totalUsers,
      activeUsers: stat.activeUsers,
      byRole: countByRole,
      verifiedEmails: stat.verifiedEmails
    }
  });
}));

// @route   GET /api/users/search
// @desc    Rechercher des utilisateurs
// @access  Private (Admin)
router.get('/search', auth, requireAdmin, [
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

  const { q, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Recherche dans plusieurs champs
  const searchQuery = {
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } }
    ]
  };

  const users = await User.find(searchQuery)
    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await User.countDocuments(searchQuery);

  res.json({
    success: true,
    data: {
      users,
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