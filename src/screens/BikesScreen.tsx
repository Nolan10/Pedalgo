import BikeCard from '@/src/components/BikeCard';
import type { Bike, BikeType } from '@/src/services/bikesService';
import { bikeTypeLabels } from '@/src/services/bikesService';
import { useBikes } from '@/src/hooks/useBikes';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearch, SortBy } from '@/src/hooks/useSearch';
import { colors } from '@/src/theme/colors';
import { seedDatabase } from '@/src/services/seedService';

export default function BikesScreen() {
  const router = useRouter();
  const { bikes, loading, error, refetch } = useBikes();
  const { searchQuery, setSearchQuery, selectedType, setSelectedType, sortBy, setSortBy, minPrice, setMinPrice, maxPrice, setMaxPrice, filteredBikes } = useSearch(bikes);
  const seedDone = useRef(false);

  // Seed la BDD au premier lancement
  useEffect(() => {
    if (!seedDone.current) {
      seedDone.current = true;
      seedDatabase().then(() => {
        refetch();
      });
    }
  }, [refetch]);

  // Rafraîchir quand l'écran devient visible
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const renderItem = ({ item }: { item: Bike }) => (
    <BikeCard
      id={item.id}
      title={item.title}
      description={item.description}
      type={item.type}
      pricePerDay={item.pricePerDay}
      location={item.location}
      available={item.available}
      onPress={() => router.push({ pathname: '/bike/[id]', params: { id: item.id } })}
    />
  );

  const typeFilters: { label: string; value: BikeType | null }[] = [
    { label: 'Tous', value: null },
    { label: 'Ville', value: 'city' },
    { label: 'VTT', value: 'mountain' },
    { label: 'Électrique', value: 'electric' },
    { label: 'Route', value: 'road' },
    { label: 'Pliant', value: 'folding' },
    { label: 'Cargo', value: 'cargo' },
  ];

  const sortOptions: { label: string; value: SortBy }[] = [
    { label: 'Défaut', value: null },
    { label: 'Nom', value: 'title' },
    { label: 'Prix', value: 'price' },
    { label: 'Ville', value: 'location' },
    { label: 'Type', value: 'type' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PedalGo</Text>
        <Text style={styles.headerSubtitle}>Trouvez le vélo idéal près de chez vous</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un vélo, une ville..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#7F8C8D"
        />
      </View>

      {/* Type Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={typeFilters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.label}
          renderItem={({ item: filter }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === filter.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(filter.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === filter.value && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Trier par:</Text>
        <View style={styles.sortButtons}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.sortButton,
                sortBy === option.value && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy(option.value)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === option.value && styles.sortButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.priceFilterRow}>
          <Text style={styles.sortLabel}>Prix:</Text>
          <TextInput
            style={styles.priceInput}
            value={minPrice}
            onChangeText={setMinPrice}
            placeholder="Min"
            keyboardType="numeric"
            placeholderTextColor="#7F8C8D"
          />
          <Text style={styles.priceSeparator}>—</Text>
          <TextInput
            style={styles.priceInput}
            value={maxPrice}
            onChangeText={setMaxPrice}
            placeholder="Max"
            keyboardType="numeric"
            placeholderTextColor="#7F8C8D"
          />
          <Text style={styles.priceUnit}>€/j</Text>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des vélos...</Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: {error}</Text>
        </View>
      )}

      {/* Bike list */}
      {!loading && !error && (
        <FlatList
          data={filteredBikes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Aucun vélo trouvé</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedType
                  ? 'Essayez de modifier vos critères de recherche.'
                  : 'Aucun vélo disponible pour le moment.'}
              </Text>
            </View>
          }
          contentContainerStyle={filteredBikes.length === 0 ? styles.emptyListContent : undefined}
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
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 2,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  filtersContainer: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  filterChipTextActive: {
    color: 'white',
  },
  sortContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7F8C8D',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  priceFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  priceInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 70,
    textAlign: 'center',
  },
  priceSeparator: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  priceUnit: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2C3E50',
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    color: '#7F8C8D',
  },
});
