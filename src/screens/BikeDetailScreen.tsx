import { useBikes } from '@/src/hooks/useBikes';
import { useAuth } from '@/src/context/AuthContext';
import { bikeTypeLabels } from '@/src/services/bikesService';
import { getUserProfile } from '@/src/services/authService';
import { colors } from '@/src/theme/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReservations } from '@/src/hooks/useReservations';
import { Ionicons } from '@expo/vector-icons';

export default function BikeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bikes, loading } = useBikes();
  const { user } = useAuth();
  const { createReservation } = useReservations();

  // État du formulaire de réservation
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [duration, setDuration] = useState('1');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [renterPhone, setRenterPhone] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);

  // État pour le numéro du propriétaire
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  const [ownerPhoneVisible, setOwnerPhoneVisible] = useState(false);

  const bike = bikes.find((b) => b.id === id);

  // Charger le profil du propriétaire pour voir si son numéro est public
  useEffect(() => {
    if (bike && bike.ownerId && !bike.ownerId.startsWith('seed_owner')) {
      getUserProfile(bike.ownerId).then((profile) => {
        if (profile && profile.phoneVisible && profile.phoneNumber) {
          setOwnerPhone(profile.phoneNumber);
          setOwnerPhoneVisible(true);
        }
      });
    }
  }, [bike]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bike) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Vélo non trouvé</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleReserve = () => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour réserver un vélo.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    // Vérifier que l'utilisateur n'essaie pas de réserver son propre vélo
    if (user.id === bike.ownerId) {
      Alert.alert('Erreur', 'Vous ne pouvez pas réserver votre propre vélo.');
      return;
    }

    setShowReservationModal(true);
  };

  const handleSubmitReservation = async () => {
    const durationNum = parseInt(duration, 10);

    if (!durationNum || durationNum < 1) {
      Alert.alert('Erreur', 'La durée doit être d\'au moins 1 jour.');
      return;
    }

    if (!renterPhone.trim()) {
      Alert.alert('Erreur', 'Le numéro de téléphone est obligatoire pour valider la demande.');
      return;
    }

    try {
      setReservationLoading(true);
      await createReservation({
        bikeId: bike.id,
        bikeTitle: bike.title,
        ownerId: bike.ownerId,
        duration: durationNum,
        additionalInfo: additionalInfo.trim(),
        renterPhone: renterPhone.trim(),
        totalPrice: durationNum * bike.pricePerDay,
      });

      setShowReservationModal(false);
      setDuration('1');
      setAdditionalInfo('');
      setRenterPhone('');

      Alert.alert(
        'Demande envoyée !',
        `Votre demande de réservation pour "${bike.title}" a été transmise au propriétaire. Il vous contactera par téléphone.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de créer la réservation');
    } finally {
      setReservationLoading(false);
    }
  };

  const totalPrice = (parseInt(duration, 10) || 0) * bike.pricePerDay;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Titre et type */}
          <View style={styles.titleSection}>
            <Text style={styles.bikeTitle}>{bike.title}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{bikeTypeLabels[bike.type]}</Text>
            </View>
          </View>

          {/* Prix */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{bike.pricePerDay}€</Text>
            <Text style={styles.priceUnit}> / jour</Text>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <Text style={styles.cardValue}>{bike.description}</Text>
          </View>

          {/* Localisation */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Localisation</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={styles.cardValue}>{bike.location}</Text>
            </View>
          </View>

          {/* Propriétaire */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Propriétaire</Text>
            <Text style={styles.cardValue}>{bike.ownerEmail}</Text>
            {ownerPhoneVisible && ownerPhone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={16} color={colors.primary} />
                <Text style={styles.phoneText}>{ownerPhone}</Text>
              </View>
            )}
            {!ownerPhoneVisible && (
              <Text style={styles.phoneHidden}>Numéro masqué — sera partagé après réservation</Text>
            )}
          </View>

          {/* Disponibilité */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Disponibilité</Text>
            <View style={[styles.availabilityBadge, { backgroundColor: bike.available ? '#E8F5E9' : '#FFEBEE' }]}>
              <Text style={[styles.availabilityText, { color: bike.available ? colors.success : colors.danger }]}>
                {bike.available ? '✓ Disponible' : '✗ Indisponible'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bouton de réservation fixe en bas */}
      {bike.available && (
        <View style={styles.reserveContainer}>
          <View style={styles.reservePriceInfo}>
            <Text style={styles.reservePrice}>{bike.pricePerDay}€</Text>
            <Text style={styles.reservePriceUnit}>/jour</Text>
          </View>
          <TouchableOpacity style={styles.reserveButton} onPress={handleReserve}>
            <Text style={styles.reserveButtonText}>Réserver</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de réservation */}
      <Modal
        visible={showReservationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReservationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Réserver "{bike.title}"</Text>

              {/* Durée */}
              <Text style={styles.inputLabel}>Nombre de jours de location *</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="1"
                keyboardType="numeric"
              />

              {/* Informations complémentaires */}
              <Text style={styles.inputLabel}>Informations complémentaires (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="Ex: horaire de récupération, remarques..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Numéro de téléphone */}
              <Text style={styles.inputLabel}>Votre numéro de téléphone *</Text>
              <TextInput
                style={styles.input}
                value={renterPhone}
                onChangeText={setRenterPhone}
                placeholder="06 12 34 56 78"
                keyboardType="phone-pad"
              />
              <Text style={styles.inputHint}>Le propriétaire pourra vous contacter à ce numéro.</Text>

              {/* Résumé du prix */}
              <View style={styles.priceSummary}>
                <Text style={styles.priceSummaryLabel}>
                  {bike.pricePerDay}€ × {parseInt(duration, 10) || 0} jour(s)
                </Text>
                <Text style={styles.priceSummaryTotal}>{totalPrice}€</Text>
              </View>

              {/* Boutons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowReservationModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                {reservationLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleSubmitReservation}
                  >
                    <Text style={styles.confirmButtonText}>Envoyer la demande</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 8,
  },
  bikeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 16,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 18,
    color: '#7F8C8D',
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  phoneText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  phoneHidden: {
    fontSize: 13,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginTop: 4,
  },
  availabilityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    fontSize: 20,
    color: '#E74C3C',
    marginBottom: 20,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  // Bouton de réservation en bas
  reserveContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  reservePriceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  reservePrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  reservePriceUnit: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  reserveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  reserveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  inputLabel: {
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
  inputHint: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: -12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  priceSummaryLabel: {
    fontSize: 15,
    color: '#2C3E50',
  },
  priceSummaryTotal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
