// src/services/seedService.ts
// Service pour injecter les données de démonstration dans Firestore au premier lancement
import { collection, deleteDoc, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { seedBikes } from '../data/bikes';

const BIKES_COLLECTION = 'bikes';

/**
 * Vérifie si la collection bikes est vide et injecte les données de seed si nécessaire
 */
export async function seedDatabase(): Promise<void> {
  try {
    const bikesRef = collection(db, BIKES_COLLECTION);
    const snapshot = await getDocs(bikesRef);
    const allDocs = snapshot.docs;
    const seedDocs = allDocs.filter((d) => String(d.data().ownerId ?? '').startsWith('seed_owner_'));
    const hasCanonicalSeeds = seedBikes.every((_, index) =>
      allDocs.some((d) => d.id === `seed_${index + 1}`)
    );

    // Si des seeds existent déjà mais sont dupliqués/non canoniques, on les nettoie
    if (seedDocs.length > 0 && (seedDocs.length !== seedBikes.length || !hasCanonicalSeeds)) {
      console.log('Seeds dupliqués détectés, nettoyage en cours...');
      await Promise.all(seedDocs.map((seedDoc) => deleteDoc(seedDoc.ref)));
    }

    // Si les seeds canoniques existent déjà, on ne fait rien
    if (seedDocs.length === seedBikes.length && hasCanonicalSeeds) {
      console.log('Seeds déjà présents et valides, seed ignoré.');
      return;
    }

    console.log('Injection des données de démonstration...');

    const batch = writeBatch(db);

    // Injecter chaque vélo de seed avec IDs déterministes pour éviter les doublons
    seedBikes.forEach((bike, index) => {
      const bikeDocRef = doc(db, BIKES_COLLECTION, `seed_${index + 1}`);
      batch.set(bikeDocRef, {
        title: bike.title,
        description: bike.description,
        type: bike.type,
        pricePerDay: bike.pricePerDay,
        location: bike.location,
        ownerId: bike.ownerId,
        ownerEmail: bike.ownerEmail,
        available: bike.available,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

    });

    await batch.commit();

    console.log(`${seedBikes.length} vélos injectés avec succès !`);
  } catch (error) {
    console.error('Erreur lors du seed de la base de données:', error);
  }
}
