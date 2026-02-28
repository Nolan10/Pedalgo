import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { bikeTypeLabels, type BikeType } from '../services/bikesService';

interface BikeCardProps {
  id: string;
  title: string;
  description: string;
  type: BikeType;
  pricePerDay: number;
  location: string;
  available: boolean;
  onPress?: () => void;
}

const BikeCard: React.FC<BikeCardProps> = ({ id, title, description, type, pricePerDay, location, available, onPress }) => {
  const { addFavorite, removeFavorite, isFavorite } = useAppContext();
  const favorite = isFavorite(id);

  const toggleFavorite = () => {
    if (favorite) removeFavorite(id);
    else addFavorite(id);
  };

  return (
    <TouchableOpacity
      style={[styles.card, !available && styles.cardUnavailable]}
      activeOpacity={0.7}
      onPress={onPress ?? (() => console.log('Pressed bike id:', id))}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={(e) => {
            if ('stopPropagation' in e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            toggleFavorite();
          }}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={favorite ? colors.danger : colors.gray}
          />
        </Pressable>
      </View>

      <Text style={styles.description} numberOfLines={2}>{description}</Text>

      <View style={styles.bottomRow}>
        <View style={styles.infoContainer}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{bikeTypeLabels[type]}</Text>
          </View>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={colors.gray} />
            <Text style={styles.location}>{location}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{pricePerDay}€</Text>
          <Text style={styles.priceUnit}>/jour</Text>
        </View>
      </View>

      {!available && (
        <View style={styles.unavailableBadge}>
          <Text style={styles.unavailableText}>Indisponible</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    margin: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardUnavailable: {
    opacity: 0.6,
    borderLeftColor: colors.gray,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 10,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  infoContainer: {
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: '#7F8C8D',
    marginLeft: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 13,
    color: '#7F8C8D',
    marginLeft: 2,
  },
  unavailableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unavailableText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default BikeCard;
