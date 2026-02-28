import { AuthUser } from '@/src/services/authService';
import { auth } from '@/src/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Définir l'interface AuthContextType
interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
}

// Créer le Context
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Définir les états (user, loading)
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Écouter les changements d'état d'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
            if (firebaseUser) {
                setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personnalisé useAuth
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }

    return context;
}
