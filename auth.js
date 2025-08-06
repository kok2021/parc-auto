const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, updateLastLogin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// Validation pour l'inscription
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
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

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Validation pour la réinitialisation de mot de passe
const resetPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide')
];

// Validation pour le nouveau mot de passe
const newPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const { name, email, password, company, phone } = req.body;

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
    company,
    phone
  });

  await user.save();

  // Générer le token JWT
  const token = user.generateAuthToken();

  // Envoyer l'email de bienvenue
  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Inscription réussie',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Trouver l'utilisateur avec le mot de passe
  const user = await User.findByEmail(email).select('+password');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Email ou mot de passe incorrect'
    });
  }

  // Vérifier si le compte est actif
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Compte désactivé. Contactez l\'administrateur.'
    });
  }

  // Vérifier le mot de passe
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Email ou mot de passe incorrect'
    });
  }

  // Mettre à jour la dernière connexion
  await user.updateLastLogin();

  // Générer le token JWT
  const token = user.generateAuthToken();

  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
}));

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', auth, updateLastLogin, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.getPublicProfile()
    }
  });
}));

// @route   POST /api/auth/forgot-password
// @desc    Demande de réinitialisation de mot de passe
// @access  Public
router.post('/forgot-password', resetPasswordValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const { email } = req.body;

  // Trouver l'utilisateur
  const user = await User.findByEmail(email);
  if (!user) {
    // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
    return res.json({
      success: true,
      message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé'
    });
  }

  // Générer un token de réinitialisation
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const resetTokenHash = require('crypto').createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Envoyer l'email de réinitialisation
  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email'
    });
  }

  res.json({
    success: true,
    message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé'
  });
}));

// @route   POST /api/auth/reset-password/:token
// @desc    Réinitialiser le mot de passe
// @access  Public
router.post('/reset-password/:token', newPasswordValidation, asyncHandler(async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array()
    });
  }

  const { password } = req.body;
  const { token } = req.params;

  // Hasher le token pour la comparaison
  const resetTokenHash = require('crypto').createHash('sha256').update(token).digest('hex');

  // Trouver l'utilisateur avec le token valide
  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }

  // Mettre à jour le mot de passe
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Générer un nouveau token JWT
  const authToken = user.generateAuthToken();

  res.json({
    success: true,
    message: 'Mot de passe réinitialisé avec succès',
    data: {
      user: user.getPublicProfile(),
      token: authToken
    }
  });
}));

// @route   PUT /api/auth/change-password
// @desc    Changer le mot de passe
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  ...newPasswordValidation
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

  const { currentPassword, password } = req.body;

  // Trouver l'utilisateur avec le mot de passe
  const user = await User.findById(req.user._id).select('+password');

  // Vérifier le mot de passe actuel
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Mot de passe actuel incorrect'
    });
  }

  // Mettre à jour le mot de passe
  user.password = password;
  await user.save();

  res.json({
    success: true,
    message: 'Mot de passe modifié avec succès'
  });
}));

// @route   PUT /api/auth/profile
// @desc    Mettre à jour le profil utilisateur
// @access  Private
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom de l\'entreprise ne peut pas dépasser 100 caractères'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Veuillez entrer un numéro de téléphone valide')
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

  const { name, company, phone } = req.body;

  // Mettre à jour le profil
  const user = await User.findById(req.user._id);
  
  if (name) user.name = name;
  if (company !== undefined) user.company = company;
  if (phone !== undefined) user.phone = phone;

  await user.save();

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      user: user.getPublicProfile()
    }
  });
}));

// @route   POST /api/auth/logout
// @desc    Déconnexion (côté client)
// @access  Private
router.post('/logout', auth, asyncHandler(async (req, res) => {
  // En production, vous pourriez vouloir ajouter le token à une liste noire
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
}));

module.exports = router; 