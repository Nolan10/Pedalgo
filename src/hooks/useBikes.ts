// src/hooks/useBikes.ts
import { useAuth } from '@/src/context/AuthContext';
import type { Bike, BikeRequest } from '@/src/services/bikesService';
import {
  createBike as createBikeService,
  deleteBike as deleteBikeService,
  fetchBikes,
  fetchUserBikes,
  updateBike as updateBikeService
} from '@/src/services/bikesService';
import { useCallback, useEffect, useState } from 'react';

export function useBikes() {
  const { user } = useAuth();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [userBikes, setUserBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les vélos
  const loadBikes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedBikes = await fetchBikes();
      setBikes(fetchedBikes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger les vélos';
      setError(errorMessage);
      console.error('Error loading bikes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les vélos de l'utilisateur connecté
  const loadUserBikes = useCallback(async () => {
    if (!user) {
      setUserBikes([]);
      return;
    }

    try {
      const fetched = await fetchUserBikes(user.id);
      setUserBikes(fetched);
    } catch (err) {
      console.error('Error loading user bikes:', err);
    }
  }, [user]);

  // Créer un nouveau vélo
  const createBike = async (bike: BikeRequest): Promise<Bike> => {
    if (!user) {
      throw new Error('Vous devez être connecté pour ajouter un vélo');
    }

    try {
      const newBike = await createBikeService(bike, user.id, user.email);
      await loadBikes();
      await loadUserBikes();
      return newBike;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de créer le vélo';
      console.error('Error creating bike:', err);
      throw new Error(errorMessage);
    }
  };

  // Mettre à jour un vélo
  const updateBike = async (id: string, updates: Partial<BikeRequest & { available: boolean }>): Promise<void> => {
    try {
      await updateBikeService(id, updates);
      await loadBikes();
      await loadUserBikes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de modifier le vélo';
      console.error('Error updating bike:', err);
      throw new Error(errorMessage);
    }
  };

  // Supprimer un vélo
  const deleteBike = async (id: string): Promise<void> => {
    try {
      await deleteBikeService(id);
      await loadBikes();
      await loadUserBikes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de supprimer le vélo';
      console.error('Error deleting bike:', err);
      throw new Error(errorMessage);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadBikes();
  }, [loadBikes]);

  useEffect(() => {
    loadUserBikes();
  }, [loadUserBikes]);

  return {
    bikes,
    userBikes,
    loading,
    error,
    refetch: loadBikes,
    refetchUserBikes: loadUserBikes,
    createBike,
    updateBike,
    deleteBike,
  };
}
