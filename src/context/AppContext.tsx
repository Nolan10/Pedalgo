import { loadFavorites, saveFavorites } from '@/src/services/storage';
import React, {
	createContext,
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';

export interface AppContextType {
	favorites: string[];
	addFavorite: (id: string) => void;
	removeFavorite: (id: string) => void;
	isFavorite: (id: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
	const [favorites, setFavorites] = useState<string[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	// Load favorites on mount
	useEffect(() => {
		const initFavorites = async () => {
			try {
				const storedFavorites = await loadFavorites();
				const validFavorites = storedFavorites.filter(id => id.length > 5);
				setFavorites(validFavorites);
			} catch (error) {
				console.error('Failed to load favorites:', error);
			} finally {
				setIsLoaded(true);
			}
		};

		initFavorites();
	}, []);

	// Save favorites whenever they change
	useEffect(() => {
		if (!isLoaded) return;

		const saveFavoritesAsync = async () => {
			try {
				await saveFavorites(favorites);
			} catch (error) {
				console.error('Failed to save favorites:', error);
			}
		};

		saveFavoritesAsync();
	}, [favorites, isLoaded]);

	const addFavorite = useCallback((id: string) => {
		setFavorites((prev) => (prev.includes(id) ? prev : [...prev, id]));
	}, []);

	const removeFavorite = useCallback((id: string) => {
		setFavorites((prev) => prev.filter((favoriteId) => favoriteId !== id));
	}, []);

	const isFavorite = useCallback(
		(id: string) => favorites.includes(id),
		[favorites]
	);

	const value = useMemo<AppContextType>(
		() => ({ favorites, addFavorite, removeFavorite, isFavorite }),
		[favorites, addFavorite, removeFavorite, isFavorite]
	);

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useAppContext must be used within an AppProvider');
	}
	return context;
}

export default AppContext;
