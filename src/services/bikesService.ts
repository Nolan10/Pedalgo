// src/services/bikesService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export type BikeType = 'city' | 'mountain' | 'electric' | 'road' | 'folding' | 'cargo';

export interface Bike {
  id: string;
  title: string;
  description: string;
  type: BikeType;
  pricePerDay: number;
  location: string;
  ownerId: string;
  ownerEmail: string;
  available: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BikeRequest {
  title: string;
  description: string;
  type: BikeType;
  pricePerDay: number;
  location: string;
}

const BIKES_COLLECTION = 'bikes';

// Libellés des types de vélo
export const bikeTypeLabels: Record<BikeType, string> = {
  city: 'Vélo de ville',
  mountain: 'VTT',
  electric: 'Vélo électrique',
  road: 'Vélo de route',
  folding: 'Vélo pliant',
  cargo: 'Vélo cargo',
};

// CREATE - Ajouter un vélo
export async function createBike(bike: BikeRequest, userId: string, userEmail: string): Promise<Bike> {
  if (!userId) {
    throw new Error('User ID requis');
  }

  try {
    const bikeData = {
      ...bike,
      ownerId: userId,
      ownerEmail: userEmail,
      available: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const bikesRef = collection(db, BIKES_COLLECTION);
    const docRef = await addDoc(bikesRef, bikeData);

    return {
      id: docRef.id,
      ...bike,
      ownerId: userId,
      ownerEmail: userEmail,
      available: true,
    };
  } catch (error) {
    console.error('Error creating bike:', error);
    throw new Error('Impossible de créer le vélo');
  }
}

// READ - Récupérer tous les vélos
export async function fetchBikes(): Promise<Bike[]> {
  try {
    const bikesRef = collection(db, BIKES_COLLECTION);
    const querySnapshot = await getDocs(bikesRef);

    const bikes: Bike[] = [];
    querySnapshot.forEach((doc) => {
      bikes.push({
        id: doc.id,
        ...doc.data(),
      } as Bike);
    });

    return bikes;
  } catch (error) {
    console.error('Error fetching bikes:', error);
    throw new Error('Impossible de charger les vélos');
  }
}

// READ - Récupérer un vélo par ID
export async function fetchBikeById(bikeId: string): Promise<Bike | null> {
  try {
    const bikeDoc = await getDoc(doc(db, BIKES_COLLECTION, bikeId));
    if (bikeDoc.exists()) {
      return {
        id: bikeDoc.id,
        ...bikeDoc.data(),
      } as Bike;
    }
    return null;
  } catch (error) {
    console.error('Error fetching bike:', error);
    throw new Error('Impossible de charger le vélo');
  }
}

// READ - Récupérer les vélos d'un utilisateur
export async function fetchUserBikes(userId: string): Promise<Bike[]> {
  if (!userId) {
    throw new Error('User ID requis');
  }

  try {
    const bikesRef = collection(db, BIKES_COLLECTION);
    const userBikesQuery = query(
      bikesRef,
      where('ownerId', '==', userId)
    );

    const querySnapshot = await getDocs(userBikesQuery);

    const bikes: Bike[] = [];
    querySnapshot.forEach((doc) => {
      bikes.push({
        id: doc.id,
        ...doc.data(),
      } as Bike);
    });

    return bikes;
  } catch (error) {
    console.error('Error fetching user bikes:', error);
    throw new Error('Impossible de charger vos vélos');
  }
}

// UPDATE - Mettre à jour un vélo
export async function updateBike(id: string, updates: Partial<BikeRequest & { available: boolean }>): Promise<void> {
  try {
    const bikeRef = doc(db, BIKES_COLLECTION, id);
    await updateDoc(bikeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating bike:', error);
    throw new Error('Impossible de modifier le vélo');
  }
}

// DELETE - Supprimer un vélo
export async function deleteBike(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BIKES_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting bike:', error);
    throw new Error('Impossible de supprimer le vélo');
  }
}
