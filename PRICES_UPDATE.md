# Mise à jour des Prix - Euros et FCFA

## Changements Apportés

### 1. Modèle Vehicle (models/Vehicle.js)

**Ajouts :**
- Champ `priceEUR` : Prix en euros (optionnel)
- Virtual `formattedPriceFCFA` : Prix formaté en FCFA (XOF)
- Virtual `formattedPriceEUR` : Prix formaté en euros (EUR) - affiche "Non disponible" si non défini

**Modifications :**
- Le champ `price` représente le prix en FCFA
- Validation mise à jour pour inclure les deux devises (euros optionnel)

### 2. Script d'Initialisation (mongo-init.js)

**Véhicules Ajoutés :**
- **Audi A4** (2023) : 31 440 000 FCFA
- **Tesla Model 3** (2023) : 36 025 000 FCFA  
- **Porsche 911** (2023) : 78 600 000 FCFA
- **Range Rover Sport** (2023) : 55 675 000 FCFA

### 3. Routes (routes/vehicles.js)

**Modifications :**
- Validation ajoutée pour le champ `priceEUR`
- Suppression de `.lean()` pour inclure les virtuals de prix
- Les prix formatés sont maintenant disponibles dans les réponses API

## Utilisation

### Dans le Code

```javascript
// Créer un véhicule avec prix en FCFA uniquement
const vehicle = new Vehicle({
  brand: 'Audi',
  model: 'A4',
  year: 2023,
  price: 31440000,        // Prix en FCFA
  // ... autres champs
});

// Accéder aux prix formatés
console.log(vehicle.formattedPriceFCFA); // "31 440 000,00 FCFA"
console.log(vehicle.formattedPriceEUR);  // "Non disponible"
```

### API Response

```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "brand": "Audi",
        "model": "A4",
        "year": 2023,
        "price": 31440000,
        "formattedPriceFCFA": "31 440 000,00 FCFA",
        "formattedPriceEUR": "Non disponible",
        // ... autres champs
      }
    ]
  }
}
```

## Test

Exécutez le fichier de test pour vérifier le fonctionnement :

```bash
node test-prices.js
```

## Migration

Si vous avez des véhicules existants sans le champ `priceEUR`, vous devrez les mettre à jour :

```javascript
// Script de migration (à adapter selon vos besoins)
const vehicles = await Vehicle.find({ priceEUR: { $exists: false } });
for (const vehicle of vehicles) {
  vehicle.priceEUR = Math.round(vehicle.price / 655); // Conversion FCFA vers EUR
  await vehicle.save();
}
```

## Notes

- Les prix sont stockés en centimes pour éviter les problèmes de précision
- Le formatage utilise `Intl.NumberFormat` pour un affichage localisé
- Le prix en FCFA est requis, le prix en euros est optionnel 