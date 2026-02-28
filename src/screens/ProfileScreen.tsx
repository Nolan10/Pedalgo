import { useAuth } from '@/src/context/AuthContext';
import { useAppContext } from '@/src/context/AppContext';
import { useBikes } from '@/src/hooks/useBikes';
import { useReservations } from '@/src/hooks/useReservations';
import { logout, getUserProfile, updateUserProfile } from '@/src/services/authService';
import { colors } from '@/src/theme/colors';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { favorites } = useAppContext();
  const { userBikes, refetchUserBikes } = useBikes();
  const { sentReservations, receivedReservations, refetchSent, refetchReceived } = useReservations();

  // État du profil téléphone
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Charger le profil utilisateur
  useFocusEffect(
    useCallback(() => {
      refetchUserBikes();
      refetchSent();
      refetchReceived();

      if (user) {
        getUserProfile(user.id).then((profile) => {
          if (profile) {
            setPhoneNumber(profile.phoneNumber);
            setPhoneVisible(profile.phoneVisible);
          }
        });
      }
    }, [user, refetchUserBikes, refetchSent, refetchReceived])
  );

  const handleSavePhone = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user.id, { phoneNumber, phoneVisible });
      setIsEditingPhone(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    }
  };

  const handleTogglePhoneVisibility = async (value: boolean) => {
    if (!user) return;
    setPhoneVisible(value);
    try {
      await updateUserProfile(user.id, { phoneVisible: value });
    } catch (error) {
      setPhoneVisible(!value); // Rollback
      Alert.alert('Erreur', 'Impossible de modifier la visibilité');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>PG</Text>
          </View>
          <Text style={styles.name}>Utilisateur PedalGo</Text>
          <Text style={styles.email}>{user?.email || 'Non connecté'}</Text>
        </View>

        {/* Statistiques */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userBikes.length}</Text>
            <Text style={styles.statLabel}>Mes vélos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sentReservations.length}</Text>
            <Text style={styles.statLabel}>Réservations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{receivedReservations.length}</Text>
            <Text style={styles.statLabel}>Demandes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
        </View>

        {/* Section téléphone et confidentialité */}
        <View style={styles.phoneSection}>
          <Text style={styles.sectionTitle}>Mon numéro de téléphone</Text>

          {isEditingPhone ? (
            <View>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="06 12 34 56 78"
                keyboardType="phone-pad"
              />
              <View style={styles.phoneButtons}>
                <TouchableOpacity style={styles.phoneCancelBtn} onPress={() => setIsEditingPhone(false)}>
                  <Text style={styles.phoneCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.phoneSaveBtn} onPress={handleSavePhone}>
                  <Text style={styles.phoneSaveText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.phoneDisplay}>
                {phoneNumber || 'Non renseigné'}
              </Text>
              <TouchableOpacity onPress={() => setIsEditingPhone(true)}>
                <Text style={styles.editPhoneLink}>Modifier</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Toggle visibilité */}
          <View style={styles.visibilityRow}>
            <View style={styles.visibilityInfo}>
              <Text style={styles.visibilityLabel}>Rendre mon numéro visible</Text>
              <Text style={styles.visibilityHint}>
                {phoneVisible
                  ? 'Les locataires peuvent voir votre numéro directement.'
                  : 'Votre numéro est masqué. Vous contactez les locataires via leurs demandes.'}
              </Text>
            </View>
            <Switch
              value={phoneVisible}
              onValueChange={handleTogglePhoneVisibility}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={phoneVisible ? colors.primary : '#BDBDBD'}
            />
          </View>
        </View>

        {/* Favoris */}
        {favorites.length > 0 && (
          <View style={styles.favoritesSection}>
            <Text style={styles.sectionTitle}>Mes Favoris</Text>
            <Text style={styles.favoritesCount}>{favorites.length} vélo(s) en favoris</Text>
          </View>
        )}

        {/* Bouton déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  avatarSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  // Section téléphone
  phoneSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  phoneDisplay: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: '500',
    marginBottom: 4,
  },
  editPhoneLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  phoneInput: {
    backgroundColor: '#F9F9F9',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    marginBottom: 12,
  },
  phoneButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  phoneCancelBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  phoneCancelText: {
    color: '#7F8C8D',
    fontWeight: '600',
  },
  phoneSaveBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  phoneSaveText: {
    color: 'white',
    fontWeight: '600',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  visibilityInfo: {
    flex: 1,
    marginRight: 12,
  },
  visibilityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  visibilityHint: {
    fontSize: 12,
    color: '#7F8C8D',
    lineHeight: 16,
  },
  // Favoris
  favoritesSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  favoritesCount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  // Déconnexion
  logoutButton: {
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E74C3C',
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
