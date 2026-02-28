// src/hooks/useReservations.ts
import { useAuth } from '@/src/context/AuthContext';
import type { Reservation, ReservationRequest, ReservationStatus } from '@/src/services/reservationsService';
import {
  createReservation as createReservationService,
  fetchReceivedReservations,
  fetchSentReservations,
  updateReservationStatus,
} from '@/src/services/reservationsService';
import { useCallback, useEffect, useState } from 'react';

export function useReservations() {
  const { user } = useAuth();
  const [sentReservations, setSentReservations] = useState<Reservation[]>([]);
  const [receivedReservations, setReceivedReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les réservations envoyées
  const loadSentReservations = useCallback(async () => {
    if (!user) {
      setSentReservations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetched = await fetchSentReservations(user.id);
      setSentReservations(fetched);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les réservations';
      setError(errorMessage);
      console.error('Error loading sent reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger les réservations reçues (en tant que propriétaire)
  const loadReceivedReservations = useCallback(async () => {
    if (!user) {
      setReceivedReservations([]);
      return;
    }

    try {
      const fetched = await fetchReceivedReservations(user.id);
      setReceivedReservations(fetched);
    } catch (err) {
      console.error('Error loading received reservations:', err);
    }
  }, [user]);

  // Créer une réservation
  const createReservation = async (reservation: ReservationRequest): Promise<Reservation> => {
    if (!user) {
      throw new Error('Vous devez être connecté pour réserver un vélo');
    }

    try {
      const newReservation = await createReservationService(reservation, user.id, user.email);
      await loadSentReservations();
      return newReservation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de créer la réservation';
      console.error('Error creating reservation:', err);
      throw new Error(errorMessage);
    }
  };

  // Répondre à une demande de réservation (propriétaire)
  const respondToReservation = async (reservationId: string, status: ReservationStatus): Promise<void> => {
    if (!user) {
      throw new Error('Vous devez être connecté');
    }

    try {
      await updateReservationStatus(reservationId, status);
      await Promise.all([loadReceivedReservations(), loadSentReservations()]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de mettre à jour la demande';
      console.error('Error responding to reservation:', err);
      throw new Error(errorMessage);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadSentReservations();
  }, [loadSentReservations]);

  useEffect(() => {
    loadReceivedReservations();
  }, [loadReceivedReservations]);

  return {
    sentReservations,
    receivedReservations,
    loading,
    error,
    refetchSent: loadSentReservations,
    refetchReceived: loadReceivedReservations,
    createReservation,
    respondToReservation,
    cancelReservation: async (reservationId: string): Promise<void> => {
      if (!user) throw new Error('Vous devez \u00eatre connect\u00e9');
      try {
        await updateReservationStatus(reservationId, 'cancelled');
        await loadSentReservations();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Impossible d\'annuler la r\u00e9servation';
        throw new Error(errorMessage);
      }
    },
  };
}
