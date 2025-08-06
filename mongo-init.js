// Script d'initialisation MongoDB pour AutoParc
// Ce script s'exécute automatiquement lors du premier démarrage du conteneur MongoDB

// Se connecter à la base de données admin
db = db.getSiblingDB('admin');

// Créer un utilisateur pour la base de données autoparc
db.createUser({
  user: 'autoparc_user',
  pwd: 'autoparc_password',
  roles: [
    {
      role: 'readWrite',
      db: 'autoparc'
    }
  ]
});

// Se connecter à la base de données autoparc
db = db.getSiblingDB('autoparc');

// Créer les collections avec des index optimisés
db.createCollection('users');
db.createCollection('vehicles');
db.createCollection('contacts');

// Index pour la collection users
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });
db.users.createIndex({ "createdAt": -1 });

// Index pour la collection vehicles
db.vehicles.createIndex({ "brand": 1, "model": 1 });
db.vehicles.createIndex({ "category": 1 });
db.vehicles.createIndex({ "status": 1 });
db.vehicles.createIndex({ "price": 1 });
db.vehicles.createIndex({ "year": 1 });
db.vehicles.createIndex({ "isActive": 1 });
db.vehicles.createIndex({ "specifications.fuelType": 1 });
db.vehicles.createIndex({ "createdAt": -1 });

// Index pour la collection contacts
db.contacts.createIndex({ "email": 1 });
db.contacts.createIndex({ "status": 1 });
db.contacts.createIndex({ "priority": 1 });
db.contacts.createIndex({ "type": 1 });
db.contacts.createIndex({ "createdAt": -1 });
db.contacts.createIndex({ "isRead": 1 });
db.contacts.createIndex({ "assignedTo": 1 });

// Créer un utilisateur admin par défaut
const adminUser = {
  name: "Administrateur AutoParc",
  email: "admin@autoparc.fr",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8e", // "Admin123!"
  role: "admin",
  company: "AutoParc",
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Insérer l'utilisateur admin seulement s'il n'existe pas
const existingAdmin = db.users.findOne({ email: adminUser.email });
if (!existingAdmin) {
  db.users.insertOne(adminUser);
  print("✅ Utilisateur admin créé avec succès");
  print("📧 Email: admin@autoparc.fr");
  print("🔑 Mot de passe: Admin123!");
} else {
  print("ℹ️  L'utilisateur admin existe déjà");
}

// Insérer quelques véhicules d'exemple
const sampleVehicles = [
  {
    brand: "Audi",
    model: "A4",
    year: 2023,
    price: 31440000, // Prix en FCFA
    category: "Achat",
    description: "Berline premium Audi A4 avec finitions luxueuses et performances exceptionnelles.",
    status: "Disponible",
    specifications: {
      engine: "2.0L 4-cylindres TDI",
      transmission: "Automatique",
      fuelType: "Diesel",
      mileage: 18000,
      color: "Gris métallisé",
      doors: 4,
      seats: 5
    },
    images: [{
      url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      publicId: "autoparc/audi-a4",
      isPrimary: true
    }],
    history: [{
      action: "Véhicule créé",
      date: new Date(),
      details: "Création initiale du véhicule"
    }],
    isActive: true,
    createdBy: adminUser._id,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    brand: "Tesla",
    model: "Model 3",
    year: 2023,
    price: 36025000, // Prix en FCFA
    category: "Électrique/Hybride",
    description: "Véhicule électrique révolutionnaire Tesla Model 3 avec autonomie exceptionnelle et technologie de pointe.",
    status: "Disponible",
    specifications: {
      engine: "Moteur électrique",
      transmission: "Automatique",
      fuelType: "Électrique",
      mileage: 12000,
      color: "Blanc nacré",
      doors: 4,
      seats: 5
    },
    images: [{
      url: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      publicId: "autoparc/tesla-model3",
      isPrimary: true
    }],
    history: [{
      action: "Véhicule créé",
      date: new Date(),
      details: "Création initiale du véhicule"
    }],
    isActive: true,
    createdBy: adminUser._id,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    brand: "Porsche",
    model: "911",
    year: 2023,
    price: 78600000, // Prix en FCFA
    category: "Achat",
    description: "Légendaire Porsche 911, icône du sport automobile avec performances exceptionnelles.",
    status: "Disponible",
    specifications: {
      engine: "3.0L 6-cylindres à plat",
      transmission: "Automatique",
      fuelType: "Essence",
      mileage: 8000,
      color: "Rouge Guards",
      doors: 2,
      seats: 4
    },
    images: [{
      url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      publicId: "autoparc/porsche-911",
      isPrimary: true
    }],
    history: [{
      action: "Véhicule créé",
      date: new Date(),
      details: "Création initiale du véhicule"
    }],
    isActive: true,
    createdBy: adminUser._id,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    brand: "Range Rover",
    model: "Sport",
    year: 2023,
    price: 55675000, // Prix en FCFA
    category: "Achat",
    description: "SUV de luxe Range Rover Sport alliant élégance britannique et capacités tout-terrain exceptionnelles.",
    status: "Disponible",
    specifications: {
      engine: "3.0L 6-cylindres",
      transmission: "Automatique",
      fuelType: "Diesel",
      mileage: 15000,
      color: "Noir Santorini",
      doors: 5,
      seats: 7
    },
    images: [{
      url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      publicId: "autoparc/range-rover-sport",
      isPrimary: true
    }],
    history: [{
      action: "Véhicule créé",
      date: new Date(),
      details: "Création initiale du véhicule"
    }],
    isActive: true,
    createdBy: adminUser._id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Insérer les véhicules d'exemple seulement s'ils n'existent pas
const existingVehicles = db.vehicles.countDocuments();
if (existingVehicles === 0) {
  db.vehicles.insertMany(sampleVehicles);
  print("✅ Véhicules d'exemple créés avec succès");
} else {
  print("ℹ️  Des véhicules existent déjà dans la base de données");
}

print("🎉 Initialisation de la base de données AutoParc terminée !");
print("📊 Collections créées : users, vehicles, contacts");
print("🔍 Index optimisés pour les performances");
print("👤 Utilisateur admin créé pour les tests"); 