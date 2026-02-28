// src/services/offlineService.ts
// Service de gestion du mode hors ligne
// Stocke les changements de disponibilité dans AsyncStorage quand l'utilisateur est offline
// et les synchronise automatiquement à la reconnexion avec résolution de conflits.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateBike } from './bikesService';
import {
  fetchReceivedReservations,
  updateReservationStatus,
  type Reservation,
} from './reservationsService';

const OFFLINE_QUEUE_KEY = '@PedalGo:offlineQueue';
const CONFLICT_MESSAGES_KEY = '@PedalGo:conflictMessages';

export interface OfflineChange {
  id: string;
  bikeId: string;
  bikeTitle: string;
  field: 'available';
  value: boolean;
  ownerId: string;
  timestamp: number;
}

export interface ConflictMessage {
  id: string;
  message: string;
  bikeTitle: string;
  cancelledCount: number;
  timestamp: number;
}

// ==============================
// File d'attente hors ligne
// ==============================

/** Récupérer la file d'attente hors ligne */
export async function getOfflineQueue(): Promise<OfflineChange[]> {
  try {
    const json = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/** Ajouter un changement de disponibilité à la file hors ligne */
export async function enqueueOfflineChange(change: Omit<OfflineChange, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getOfflineQueue();

    // Dédupliquer : si un changement existe déjà pour ce vélo, on le remplace
    const filtered = queue.filter((c) => c.bikeId !== change.bikeId);
    filtered.push({
      ...change,
      id: `offline_${change.bikeId}_${Date.now()}`,
      timestamp: Date.now(),
    });

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Erreur enqueueOfflineChange:', error);
  }
}

/** Vider la file d'attente */
export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// ==============================
// Messages de conflits
// ==============================

/** Récupérer les messages de conflits non lus */
export async function getConflictMessages(): Promise<ConflictMessage[]> {
  try {
    const json = await AsyncStorage.getItem(CONFLICT_MESSAGES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/** Sauvegarder un message de conflit */
async function addConflictMessage(message: Omit<ConflictMessage, 'id' | 'timestamp'>): Promise<void> {
  try {
    const messages = await getConflictMessages();
    messages.push({
      ...message,
      id: `conflict_${Date.now()}`,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(CONFLICT_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Erreur addConflictMessage:', error);
  }
}

/** Supprimer tous les messages de conflits (marquer comme lus) */
export async function clearConflictMessages(): Promise<void> {
  await AsyncStorage.removeItem(CONFLICT_MESSAGES_KEY);
}

// ==============================
// Synchronisation + résolution de conflits
// ==============================

/**
 * Synchronise les changements hors ligne avec Firebase.
 * 
 * Règle de résolution des conflits (imposée par le CDC) :
 * → La priorité est donnée au propriétaire du vélo.
 * → Si le propriétaire a rendu son vélo indisponible hors ligne,
 *   les réservations "pending" créées entre-temps en ligne sont automatiquement annulées.
 * → Un message UI informe l'utilisateur des annulations.
 * 
 * @returns Le nombre de changements synchronisés
 */
export async function syncOfflineChanges(): Promise<{
  synced: number;
  conflicts: ConflictMessage[];
}> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, conflicts: [] };
  }

  console.log(`[Sync] ${queue.length} changement(s) hors ligne à synchroniser...`);
  const newConflicts: ConflictMessage[] = [];
  let syncedCount = 0;

  for (const change of queue) {
    try {
      // 1. Appliquer le changement de disponibilité (priorité propriétaire)
      await updateBike(change.bikeId, { [change.field]: change.value });
      syncedCount++;

      // 2. Si le vélo est rendu indisponible → résolution de conflit
      if (change.field === 'available' && change.value === false) {
        const reservations = await fetchReceivedReservations(change.ownerId);
        const pendingForBike = reservations.filter(
          (r: Reservation) => r.bikeId === change.bikeId && r.status === 'pending'
        );

        if (pendingForBike.length > 0) {
          // Annuler automatiquement les réservations pending
          for (const reservation of pendingForBike) {
            await updateReservationStatus(reservation.id, 'rejected');
          }

          const conflictMsg: ConflictMessage = {
            id: `conflict_${Date.now()}_${change.bikeId}`,
            message: `Vous avez rendu "${change.bikeTitle}" indisponible hors ligne. ${pendingForBike.length} demande(s) en attente ont été automatiquement refusées (priorité propriétaire).`,
            bikeTitle: change.bikeTitle,
            cancelledCount: pendingForBike.length,
            timestamp: Date.now(),
          };
          newConflicts.push(conflictMsg);
          await addConflictMessage(conflictMsg);

          console.log(`[Conflit] ${pendingForBike.length} réservation(s) annulée(s) pour "${change.bikeTitle}"`);
        }
      }
    } catch (error) {
      console.error(`[Sync] Erreur pour le vélo ${change.bikeId}:`, error);
    }
  }

  // Vider la file après synchronisation
  await clearOfflineQueue();
  console.log(`[Sync] Terminé : ${syncedCount} changement(s) synchronisé(s), ${newConflicts.length} conflit(s)`);

  return { synced: syncedCount, conflicts: newConflicts };
}
