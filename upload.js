const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth, requireManager } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration Multer pour le stockage temporaire
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // 5 fichiers max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'), false);
    }
  }
});

// @route   POST /api/upload/image
// @desc    Upload d'une image
// @access  Private
router.post('/image', auth, requireManager, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Aucun fichier fourni'
    });
  }

  try {
    // Convertir le buffer en base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'autoparc',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de l\'image'
    });
  }
}));

// @route   POST /api/upload/images
// @desc    Upload de plusieurs images
// @access  Private
router.post('/images', auth, requireManager, upload.array('images', 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Aucun fichier fourni'
    });
  }

  const uploadPromises = req.files.map(async (file) => {
    try {
      // Convertir le buffer en base64
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      // Upload vers Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'autoparc',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };
    } catch (error) {
      console.error('Erreur upload image:', error);
      throw error;
    }
  });

  try {
    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: `${results.length} image(s) uploadée(s) avec succès`,
      data: { images: results }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des images'
    });
  }
}));

// @route   POST /api/upload/document
// @desc    Upload d'un document
// @access  Private
router.post('/document', auth, requireManager, upload.single('document'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Aucun fichier fourni'
    });
  }

  // Vérifier le type de document
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Type de document non autorisé'
    });
  }

  try {
    // Convertir le buffer en base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'autoparc/documents',
      resource_type: 'auto'
    });

    res.json({
      success: true,
      message: 'Document uploadé avec succès',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        originalName: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Erreur upload document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du document'
    });
  }
}));

// @route   DELETE /api/upload/:publicId
// @desc    Supprimer un fichier de Cloudinary
// @access  Private
router.delete('/:publicId', auth, requireManager, asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Fichier supprimé avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la suppression du fichier'
      });
    }
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fichier'
    });
  }
}));

// @route   POST /api/upload/vehicle-images/:vehicleId
// @desc    Upload d'images pour un véhicule spécifique
// @access  Private
router.post('/vehicle-images/:vehicleId', auth, requireManager, upload.array('images', 5), asyncHandler(async (req, res) => {
  const Vehicle = require('../models/Vehicle');
  const { vehicleId } = req.params;

  // Vérifier que le véhicule existe
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Véhicule non trouvé'
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Aucun fichier fourni'
    });
  }

  const uploadPromises = req.files.map(async (file) => {
    try {
      // Convertir le buffer en base64
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      // Upload vers Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: `autoparc/vehicles/${vehicleId}`,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        isPrimary: false
      };
    } catch (error) {
      console.error('Erreur upload image véhicule:', error);
      throw error;
    }
  });

  try {
    const uploadedImages = await Promise.all(uploadPromises);

    // Ajouter les images au véhicule
    vehicle.images.push(...uploadedImages);

    // Si c'est la première image, la définir comme principale
    if (vehicle.images.length === uploadedImages.length) {
      vehicle.images[0].isPrimary = true;
    }

    await vehicle.save();

    // Ajouter une entrée dans l'historique
    await vehicle.addHistoryEntry(
      'Images ajoutées',
      req.user._id,
      `${uploadedImages.length} image(s) ajoutée(s)`
    );

    res.json({
      success: true,
      message: `${uploadedImages.length} image(s) ajoutée(s) au véhicule`,
      data: {
        vehicle: {
          id: vehicle._id,
          images: vehicle.images
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout des images'
    });
  }
}));

// @route   PUT /api/upload/vehicle-images/:vehicleId/primary
// @desc    Définir une image comme principale pour un véhicule
// @access  Private
router.put('/vehicle-images/:vehicleId/primary', auth, requireManager, asyncHandler(async (req, res) => {
  const Vehicle = require('../models/Vehicle');
  const { vehicleId } = req.params;
  const { imageId } = req.body;

  if (!imageId) {
    return res.status(400).json({
      success: false,
      message: 'ID de l\'image requis'
    });
  }

  // Vérifier que le véhicule existe
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Véhicule non trouvé'
    });
  }

  try {
    await vehicle.setPrimaryImage(imageId);

    // Ajouter une entrée dans l'historique
    await vehicle.addHistoryEntry(
      'Image principale modifiée',
      req.user._id,
      'Changement de l\'image principale'
    );

    res.json({
      success: true,
      message: 'Image principale mise à jour avec succès',
      data: {
        vehicle: {
          id: vehicle._id,
          images: vehicle.images
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'image principale'
    });
  }
}));

// @route   DELETE /api/upload/vehicle-images/:vehicleId/:imageId
// @desc    Supprimer une image d'un véhicule
// @access  Private
router.delete('/vehicle-images/:vehicleId/:imageId', auth, requireManager, asyncHandler(async (req, res) => {
  const Vehicle = require('../models/Vehicle');
  const { vehicleId, imageId } = req.params;

  // Vérifier que le véhicule existe
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Véhicule non trouvé'
    });
  }

  // Trouver l'image
  const image = vehicle.images.id(imageId);
  if (!image) {
    return res.status(404).json({
      success: false,
      message: 'Image non trouvée'
    });
  }

  try {
    // Supprimer de Cloudinary
    await cloudinary.uploader.destroy(image.publicId);

    // Supprimer de la base de données
    vehicle.images.pull(imageId);

    // Si c'était l'image principale et qu'il reste des images, définir la première comme principale
    if (image.isPrimary && vehicle.images.length > 0) {
      vehicle.images[0].isPrimary = true;
    }

    await vehicle.save();

    // Ajouter une entrée dans l'historique
    await vehicle.addHistoryEntry(
      'Image supprimée',
      req.user._id,
      'Suppression d\'une image du véhicule'
    );

    res.json({
      success: true,
      message: 'Image supprimée avec succès',
      data: {
        vehicle: {
          id: vehicle._id,
          images: vehicle.images
        }
      }
    });
  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'image'
    });
  }
}));

module.exports = router; 