// src/services/reservationsService.ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';

export type ReservationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Reservation {
  id: string;
  bikeId: string;
  bikeTitle: string;
  renterId: string;
  renterEmail: string;
  renterPhone: string;
  ownerId: string;
  duration: number; // nombre de jours
  additionalInfo: string; // informations complémentaires
  status: ReservationStatus;
  totalPrice: number;
  createdAt?: Timestamp;
}

export interface ReservationRequest {
  bikeId: string;
  bikeTitle: string;
  ownerId: string;
  duration: number;
  additionalInfo: string;
  renterPhone: string;
  totalPrice: number;
}

const RESERVATIONS_COLLECTION = 'reservations';

// CREATE - Créer une réservation
export async function createReservation(
  reservation: ReservationRequest,
  userId: string,
  userEmail: string
): Promise<Reservation> {
  if (!userId) {
    throw new Error('User ID requis');
  }

  try {
    const reservationData = {
      ...reservation,
      renterId: userId,
      renterEmail: userEmail,
      status: 'pending' as ReservationStatus,
      createdAt: serverTimestamp(),
    };

    const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
    const docRef = await addDoc(reservationsRef, reservationData);

    return {
      id: docRef.id,
      ...reservation,
      renterId: userId,
      renterEmail: userEmail,
      status: 'pending',
    };
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw new Error('Impossible de créer la réservation');
  }
}

// READ - Récupérer les réservations reçues (en tant que propriétaire)
export async function fetchReceivedReservations(ownerId: string): Promise<Reservation[]> {
  if (!ownerId) {
    throw new Error('Owner ID requis');
  }

  try {
    const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
    const receivedQuery = query(
      reservationsRef,
      where('ownerId', '==', ownerId)
    );

    const querySnapshot = await getDocs(receivedQuery);

    const reservations: Reservation[] = [];
    querySnapshot.forEach((doc) => {
      reservations.push({
        id: doc.id,
        ...doc.data(),
      } as Reservation);
    });

    return reservations;
  } catch (error) {
    console.error('Error fetching received reservations:', error);
    throw new Error('Impossible de charger les demandes reçues');
  }
}

// READ - Récupérer les réservations envoyées (en tant que locataire)
export async function fetchSentReservations(renterId: string): Promise<Reservation[]> {
  if (!renterId) {
    throw new Error('Renter ID requis');
  }

  try {
    const reservationsRef = collection(db, RESERVATIONS_COLLECTION);
    const sentQuery = query(
      reservationsRef,
      where('renterId', '==', renterId)
    );

    const querySnapshot = await getDocs(sentQuery);

    const reservations: Reservation[] = [];
    querySnapshot.forEach((doc) => {
      reservations.push({
        id: doc.id,
        ...doc.data(),
      } as Reservation);
    });

    return reservations;
  } catch (error) {
    console.error('Error fetching sent reservations:', error);
    throw new Error('Impossible de charger vos réservations');
  }
}

// UPDATE - Mettre à jour le statut d'une réservation (propriétaire)
export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
): Promise<void> {
  if (!reservationId) {
    throw new Error('Reservation ID requis');
  }

  if (!['pending', 'accepted', 'rejected', 'cancelled'].includes(status)) {
    throw new Error('Statut de réservation invalide');
  }

  try {
    const reservationRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
    await updateDoc(reservationRef, { status });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw new Error('Impossible de mettre à jour le statut de la demande');
  }
}
