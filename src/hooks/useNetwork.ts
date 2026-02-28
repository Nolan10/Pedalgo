// src/hooks/useNetwork.ts
// Hook pour détecter l'état de la connexion réseau
// Utilise @react-native-community/netinfo ou un fallback simplifié

import { useEffect, useState, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const prevConnected = useRef<boolean>(true);
  const onReconnectCallbacks = useRef<Array<() => void | Promise<void>>>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      const wasDisconnected = !prevConnected.current;

      setIsConnected(connected);
      prevConnected.current = connected;

      // Déclencher les callbacks de reconnexion
      if (connected && wasDisconnected) {
        console.log('[Network] Reconnexion détectée, lancement de la synchronisation...');
        onReconnectCallbacks.current.forEach((cb) => {
          try { cb(); } catch (e) { console.error('[Network] Erreur callback reconnexion:', e); }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const onReconnect = useCallback((callback: () => void | Promise<void>) => {
    onReconnectCallbacks.current.push(callback);
    return () => {
      onReconnectCallbacks.current = onReconnectCallbacks.current.filter((cb) => cb !== callback);
    };
  }, []);

  return { isConnected, onReconnect };
}
