import { colors } from '@/src/theme/colors';
import React, { useCallback } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReservations } from '@/src/hooks/useReservations';
import { useFocusEffect } from '@react-navigation/native';
import type { Reservation } from '@/src/services/reservationsService';

export default function ReservationsScreen() {
  const { sentReservations, loading, error, refetchSent, cancelReservation } = useReservations();

  useFocusEffect(
    useCallback(() => {
      refetchSent();
    }, [refetchSent])
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FFF3E0', color: colors.warning, label: 'En attente' };
      case 'accepted':
        return { bg: '#E8F5E9', color: colors.success, label: 'Acceptée' };
      case 'rejected':
        return { bg: '#FFEBEE', color: colors.danger, label: 'Refusée' };      case 'cancelled':
        return { bg: '#F5F5F5', color: colors.gray, label: 'Annul\u00e9e' };      default:
        return { bg: '#F0F0F0', color: colors.gray, label: status };
    }
  };

  const renderItem = ({ item }: { item: Reservation }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.reservationCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.bikeTitle}>{item.bikeTitle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Durée</Text>
          <Text style={styles.infoValue}>{item.duration} jour(s)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Prix total</Text>
          <Text style={styles.infoValuePrice}>{item.totalPrice}€</Text>
        </View>

        {item.additionalInfo ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Remarques</Text>
            <Text style={styles.infoValue}>{item.additionalInfo}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mon téléphone</Text>
          <Text style={styles.infoValue}>{item.renterPhone}</Text>
        </View>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert(
                'Annuler la demande',
                `Voulez-vous annuler votre demande pour "${item.bikeTitle}" ?`,
                [
                  { text: 'Non', style: 'cancel' },
                  {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await cancelReservation(item.id);
                        Alert.alert('Succ\u00e8s', 'Demande annul\u00e9e');
                      } catch (e) {
                        Alert.alert('Erreur', 'Impossible d\'annuler la demande');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.cancelButtonText}>Annuler la demande</Text>
          </TouchableOpacity>
        )}      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Réservations</Text>
        <Text style={styles.headerSubtitle}>Vos demandes de location envoyées</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={sentReservations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Aucune réservation</Text>
              <Text style={styles.emptySubtitle}>
                Parcourez les vélos disponibles et faites votre première réservation !
              </Text>
            </View>
          }
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#7F8C8D',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
  },
  reservationCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bikeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  infoValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  infoValuePrice: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});
