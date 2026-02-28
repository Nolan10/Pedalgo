import { colors } from '@/src/theme/colors';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBikes } from '@/src/hooks/useBikes';
import { useReservations } from '@/src/hooks/useReservations';
import { useNetwork } from '@/src/hooks/useNetwork';
import { useFocusEffect } from '@react-navigation/native';
import type { Bike, BikeRequest, BikeType } from '@/src/services/bikesService';
import { bikeTypeLabels } from '@/src/services/bikesService';
import type { Reservation, ReservationStatus } from '@/src/services/reservationsService';
import { enqueueOfflineChange, syncOfflineChanges, getConflictMessages, clearConflictMessages, type ConflictMessage } from '@/src/services/offlineService';
import { Ionicons } from '@expo/vector-icons';

export default function MyBikesScreen() {
  const { userBikes, loading, createBike, updateBike, deleteBike, refetchUserBikes } = useBikes();
  const { receivedReservations, refetchReceived, respondToReservation } = useReservations();
  const { isConnected, onReconnect } = useNetwork();

  // Messages de conflits (mode hors ligne)
  const [conflictMessages, setConflictMessages] = useState<ConflictMessage[]>([]);

  // État pour le formulaire de création/édition de vélo
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [bikeForm, setBikeForm] = useState<BikeRequest>({
    title: '',
    description: '',
    type: 'city',
    pricePerDay: 0,
    location: '',
  });

  // État pour afficher les demandes reçues
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedBikeRequests, setSelectedBikeRequests] = useState<Reservation[]>([]);
  const [selectedBikeTitle, setSelectedBikeTitle] = useState('');

  // Rafraîchir quand l'écran devient visible
  useFocusEffect(
    useCallback(() => {
      refetchUserBikes();
      refetchReceived();
      // Vérifier s'il y a des messages de conflits non lus
      getConflictMessages().then((msgs) => {
        if (msgs.length > 0) setConflictMessages(msgs);
      });
    }, [refetchUserBikes, refetchReceived])
  );

  // Synchronisation automatique à la reconnexion
  useEffect(() => {
    const unsubscribe = onReconnect(async () => {
      const result = await syncOfflineChanges();
      if (result.synced > 0) {
        refetchUserBikes();
        refetchReceived();
        if (result.conflicts.length > 0) {
          setConflictMessages(result.conflicts);
        } else {
          Alert.alert('Synchronisation', `${result.synced} modification(s) synchronisée(s) avec succès.`);
        }
      }
    });
    return unsubscribe;
  }, [onReconnect, refetchUserBikes, refetchReceived]);

  // Fermer les messages de conflits
  const dismissConflicts = async () => {
    await clearConflictMessages();
    setConflictMessages([]);
  };

  // Reset formulaire
  const resetForm = () => {
    setBikeForm({ title: '', description: '', type: 'city', pricePerDay: 0, location: '' });
    setEditingBike(null);
    setShowBikeModal(false);
  };

  // Ouvrir le formulaire en mode création
  const openCreateForm = () => {
    resetForm();
    setShowBikeModal(true);
  };

  // Ouvrir le formulaire en mode édition
  const openEditForm = (bike: Bike) => {
    setBikeForm({
      title: bike.title,
      description: bike.description,
      type: bike.type,
      pricePerDay: bike.pricePerDay,
      location: bike.location,
    });
    setEditingBike(bike);
    setShowBikeModal(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!bikeForm.title.trim() || !bikeForm.description.trim() || !bikeForm.location.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (bikeForm.pricePerDay <= 0) {
      Alert.alert('Erreur', 'Le prix doit être supérieur à 0€');
      return;
    }

    try {
      if (editingBike) {
        await updateBike(editingBike.id, bikeForm);
        Alert.alert('Succès', 'Vélo modifié avec succès');
      } else {
        await createBike(bikeForm);
        Alert.alert('Succès', 'Vélo ajouté avec succès');
      }
      resetForm();
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de sauvegarder');
    }
  };

  // Supprimer un vélo
  const handleDelete = (bike: Bike) => {
    Alert.alert(
      'Confirmation',
      `Voulez-vous vraiment supprimer "${bike.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBike(bike.id);
              Alert.alert('Succès', 'Vélo supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le vélo');
            }
          },
        },
      ]
    );
  };

  // Toggle disponibilité (avec support hors ligne)
  const handleToggleAvailability = async (bike: Bike) => {
    const newValue = !bike.available;
    if (!isConnected) {
      // Mode hors ligne : stocker le changement localement
      await enqueueOfflineChange({
        bikeId: bike.id,
        bikeTitle: bike.title,
        field: 'available',
        value: newValue,
        ownerId: bike.ownerId,
      });
      Alert.alert(
        'Mode hors ligne',
        `Le changement de disponibilité pour "${bike.title}" a été enregistré localement. Il sera synchronisé automatiquement à la reconnexion.`
      );
      return;
    }
    try {
      await updateBike(bike.id, { available: newValue });
    } catch (error) {
      // Si l'écriture échoue (ex: connexion perdue pendant l'appel), sauvegarder hors ligne
      await enqueueOfflineChange({
        bikeId: bike.id,
        bikeTitle: bike.title,
        field: 'available',
        value: newValue,
        ownerId: bike.ownerId,
      });
      Alert.alert(
        'Connexion perdue',
        'Le changement a été sauvegardé localement et sera synchronisé à la reconnexion.'
      );
    }
  };

  // Voir les demandes reçues pour un vélo
  const viewRequests = (bike: Bike) => {
    const requests = receivedReservations.filter((r) => r.bikeId === bike.id);
    setSelectedBikeRequests(requests);
    setSelectedBikeTitle(bike.title);
    setShowRequestsModal(true);
  };

  const handleRequestDecision = async (reservation: Reservation, status: ReservationStatus) => {
    try {
      await respondToReservation(reservation.id, status);
      setSelectedBikeRequests((prev) =>
        prev.map((request) => (request.id === reservation.id ? { ...request, status } : request))
      );
      Alert.alert('Succès', status === 'accepted' ? 'Demande acceptée' : 'Demande refusée');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de répondre à la demande');
    }
  };

  const renderBikeItem = ({ item }: { item: Bike }) => {
    const requestCount = receivedReservations.filter((r) => r.bikeId === item.id).length;

    return (
      <View style={styles.bikeCard}>
        <View style={styles.bikeCardHeader}>
          <Text style={styles.bikeName}>{item.title}</Text>
          <View style={[styles.availBadge, { backgroundColor: item.available ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.availBadgeText, { color: item.available ? colors.success : colors.danger }]}>
              {item.available ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>
        </View>

        <Text style={styles.bikeInfo}>{bikeTypeLabels[item.type]} • {item.location} • {item.pricePerDay}€/jour</Text>

        {/* Demandes en attente */}
        {requestCount > 0 && (
          <TouchableOpacity style={styles.requestsBadge} onPress={() => viewRequests(item)}>
            <Ionicons name="mail" size={16} color={colors.secondary} />
            <Text style={styles.requestsBadgeText}>{requestCount} demande(s) reçue(s)</Text>
          </TouchableOpacity>
        )}

        {/* Boutons d'action */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openEditForm(item)}>
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, item.available ? styles.actionBtnOrange : styles.actionBtnGreen]}
            onPress={() => handleToggleAvailability(item)}
          >
            <Text style={styles.actionText}>{item.available ? 'Masquer' : 'Activer'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionBtnRed]} onPress={() => handleDelete(item)}>
            <Text style={styles.actionText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const bikeTypes: BikeType[] = ['city', 'mountain', 'electric', 'road', 'folding', 'cargo'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Vélos</Text>
        <Text style={styles.headerSubtitle}>Gérez vos vélos en location</Text>
      </View>

      {/* Bannière hors ligne */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={18} color="white" />
          <Text style={styles.offlineBannerText}>
            Mode hors ligne — Les modifications seront synchronisées à la reconnexion
          </Text>
        </View>
      )}

      {/* Messages de conflits résolus */}
      {conflictMessages.length > 0 && (
        <View style={styles.conflictBanner}>
          <View style={styles.conflictHeader}>
            <Ionicons name="warning" size={18} color={colors.warning} />
            <Text style={styles.conflictTitle}>Conflits résolus</Text>
            <TouchableOpacity onPress={dismissConflicts}>
              <Text style={styles.conflictDismiss}>Fermer</Text>
            </TouchableOpacity>
          </View>
          {conflictMessages.map((msg) => (
            <Text key={msg.id} style={styles.conflictText}>{msg.message}</Text>
          ))}
        </View>
      )}

      {/* Bouton d'ajout */}
      <TouchableOpacity style={styles.addButton} onPress={openCreateForm}>
        <Text style={styles.addButtonText}>Ajouter un vélo</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      )}

      {!loading && (
        <FlatList
          data={userBikes}
          renderItem={renderBikeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun vélo enregistré</Text>
              <Text style={styles.emptySubtext}>Ajoutez votre premier vélo en location !</Text>
            </View>
          }
        />
      )}

      {/* Modal création/édition vélo */}
      <Modal visible={showBikeModal} animationType="slide" transparent={true} onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingBike ? 'Modifier le vélo' : 'Nouveau vélo'}
              </Text>

              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={bikeForm.title}
                onChangeText={(t) => setBikeForm({ ...bikeForm, title: t })}
                placeholder="Ex: VTT Rockrider 540"
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bikeForm.description}
                onChangeText={(t) => setBikeForm({ ...bikeForm, description: t })}
                placeholder="Décrivez votre vélo..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={styles.label}>Type de vélo</Text>
              <View style={styles.typeButtons}>
                {bikeTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, bikeForm.type === type && styles.typeButtonActive]}
                    onPress={() => setBikeForm({ ...bikeForm, type })}
                  >
                    <Text style={[styles.typeButtonText, bikeForm.type === type && styles.typeButtonTextActive]}>
                      {bikeTypeLabels[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Prix par jour (€) *</Text>
              <TextInput
                style={styles.input}
                value={bikeForm.pricePerDay > 0 ? bikeForm.pricePerDay.toString() : ''}
                onChangeText={(t) => setBikeForm({ ...bikeForm, pricePerDay: parseFloat(t) || 0 })}
                placeholder="Ex: 15"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Localisation *</Text>
              <TextInput
                style={styles.input}
                value={bikeForm.location}
                onChangeText={(t) => setBikeForm({ ...bikeForm, location: t })}
                placeholder="Ex: Paris 11e"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitBtnText}>
                    {editingBike ? 'Modifier' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal demandes reçues */}
      <Modal visible={showRequestsModal} animationType="slide" transparent={true} onRequestClose={() => setShowRequestsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Demandes pour "{selectedBikeTitle}"</Text>

              {selectedBikeRequests.length === 0 ? (
                <Text style={styles.noRequests}>Aucune demande reçue pour ce vélo.</Text>
              ) : (
                selectedBikeRequests.map((req) => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestStatus}>
                        {req.status === 'pending' ? 'En attente' : req.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                      </Text>
                    </View>
                    <Text style={styles.requestInfo}>Locataire: {req.renterEmail}</Text>
                    <Text style={styles.requestInfo}>Téléphone: {req.renterPhone}</Text>
                    <Text style={styles.requestInfo}>Durée: {req.duration} jour(s) — {req.totalPrice}€ total</Text>
                    {req.additionalInfo ? (
                      <Text style={styles.requestInfo}>Infos: {req.additionalInfo}</Text>
                    ) : null}

                    {req.status === 'pending' ? (
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={[styles.requestActionButton, styles.requestActionAccept]}
                          onPress={() => handleRequestDecision(req, 'accepted')}
                        >
                          <Text style={styles.requestActionText}>Accepter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.requestActionButton, styles.requestActionReject]}
                          onPress={() => handleRequestDecision(req, 'rejected')}
                        >
                          <Text style={styles.requestActionText}>Refuser</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ))
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowRequestsModal(false)}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    margin: 12,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#7F8C8D',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    padding: 10,
    gap: 8,
  },
  offlineBannerText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  conflictBanner: {
    backgroundColor: '#FFF3E0',
    padding: 14,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  conflictTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3E50',
    flex: 1,
  },
  conflictDismiss: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  conflictText: {
    fontSize: 13,
    color: '#2C3E50',
    lineHeight: 18,
    marginBottom: 4,
  },
  listContent: {
    padding: 12,
  },
  bikeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bikeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bikeName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  availBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bikeInfo: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  requestsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  requestsBadgeText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  actionBtnOrange: {
    backgroundColor: '#FFF3E0',
  },
  actionBtnGreen: {
    backgroundColor: '#E8F5E9',
  },
  actionBtnRed: {
    backgroundColor: '#FFEBEE',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9F9F9',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  // Requests modal
  noRequests: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    padding: 20,
  },
  requestCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  requestHeader: {
    marginBottom: 8,
  },
  requestStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
  },
  requestInfo: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  requestActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestActionAccept: {
    backgroundColor: '#E8F5E9',
  },
  requestActionReject: {
    backgroundColor: '#FFEBEE',
  },
  requestActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
  },
  closeBtn: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    marginTop: 8,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
});
