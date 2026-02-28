import { useMemo, useState } from 'react';
import type { Bike, BikeType } from '@/src/services/bikesService';

export type SortBy = 'title' | 'price' | 'location' | 'type' | null;

interface UseSearchResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedType: BikeType | null;
  setSelectedType: (type: BikeType | null) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  minPrice: string;
  setMinPrice: (price: string) => void;
  maxPrice: string;
  setMaxPrice: (price: string) => void;
  filteredBikes: Bike[];
}

export function useSearch(bikes: Bike[]): UseSearchResult {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<BikeType | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const filteredBikes = useMemo(() => {
    let result = bikes;

    // Filtrer par recherche textuelle (titre + description + localisation)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((bike) =>
        bike.title.toLowerCase().includes(query) ||
        bike.description.toLowerCase().includes(query) ||
        bike.location.toLowerCase().includes(query)
      );
    }

    // Filtrer par type de vélo
    if (selectedType) {
      result = result.filter((bike) => bike.type === selectedType);
    }

    // Filtrer par fourchette de prix
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && min > 0) {
      result = result.filter((bike) => bike.pricePerDay >= min);
    }
    if (!isNaN(max) && max > 0) {
      result = result.filter((bike) => bike.pricePerDay <= max);
    }

    // Ne montrer que les vélos disponibles
    result = result.filter((bike) => bike.available);

    // Trier
    if (sortBy) {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'price':
            return a.pricePerDay - b.pricePerDay;
          case 'location':
            return a.location.localeCompare(b.location);
          case 'type':
            return a.type.localeCompare(b.type);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [bikes, searchQuery, selectedType, sortBy, minPrice, maxPrice]);

  return {
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    filteredBikes,
  };
}
