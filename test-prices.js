// Test des prix en euros et FCFA
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

// Configuration de la connexion MongoDB
mongoose.connect('mongodb://localhost:27017/autoparc', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testPrices() {
  try {
    console.log('🔍 Test des prix en euros et FCFA...\n');

    // Créer un véhicule de test
    const testVehicle = new Vehicle({
      brand: 'Test',
      model: 'Voiture Test',
      year: 2023,
      price: 655000, // 1000 € en FCFA
      priceEUR: 1000,
      category: 'Achat',
      description: 'Véhicule de test pour vérifier les prix',
      status: 'Disponible',
      specifications: {
        engine: '1.6L',
        transmission: 'Manuelle',
        fuelType: 'Essence',
        mileage: 0,
        color: 'Blanc',
        doors: 4,
        seats: 5
      },
      createdBy: new mongoose.Types.ObjectId()
    });

    await testVehicle.save();
    console.log('✅ Véhicule de test créé');

    // Tester les virtuals de prix
    console.log('\n💰 Prix formatés :');
    console.log(`Prix en FCFA: ${testVehicle.formattedPriceFCFA}`);
    console.log(`Prix en EUR: ${testVehicle.formattedPriceEUR}`);

    // Récupérer le véhicule depuis la base de données
    const retrievedVehicle = await Vehicle.findById(testVehicle._id);
    console.log('\n📊 Données récupérées :');
    console.log(`Prix brut FCFA: ${retrievedVehicle.price}`);
    console.log(`Prix brut EUR: ${retrievedVehicle.priceEUR}`);
    console.log(`Prix formaté FCFA: ${retrievedVehicle.formattedPriceFCFA}`);
    console.log(`Prix formaté EUR: ${retrievedVehicle.formattedPriceEUR}`);

    // Nettoyer
    await Vehicle.findByIdAndDelete(testVehicle._id);
    console.log('\n🧹 Véhicule de test supprimé');

    console.log('\n🎉 Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Exécuter le test
testPrices(); 