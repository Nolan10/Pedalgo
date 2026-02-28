import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Interface AuthUser pour PedalGo
export interface AuthUser {
    id: string;
    email: string;
    phoneNumber?: string;
    phoneVisible?: boolean;
}

/**
 * Créer un nouveau compte utilisateur
 * Crée aussi un profil dans Firestore avec les paramètres par défaut
 */
export async function register(email: string, password: string): Promise<AuthUser> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Créer le profil utilisateur dans Firestore
        const userProfile = {
            email: user.email || '',
            phoneNumber: '',
            phoneVisible: false, // Par défaut, numéro masqué
            createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);

        return {
            id: user.uid,
            email: user.email || '',
            phoneNumber: '',
            phoneVisible: false,
        };
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        throw error;
    }
}

/**
 * Se connecter avec email/password
 */
export async function login(email: string, password: string): Promise<AuthUser> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        return {
            id: user.uid,
            email: user.email || '',
        };
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        throw error;
    }
}

/**
 * Se déconnecter
 */
export async function logout(): Promise<void> {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        throw error;
    }
}

/**
 * Récupérer le profil utilisateur depuis Firestore
 */
export async function getUserProfile(userId: string): Promise<{ phoneNumber: string; phoneVisible: boolean } | null> {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                phoneNumber: data.phoneNumber || '',
                phoneVisible: data.phoneVisible || false,
            };
        }
        return null;
    } catch (error) {
        console.error('Erreur récupération profil:', error);
        return null;
    }
}

/**
 * Mettre à jour le profil utilisateur (téléphone + visibilité)
 */
export async function updateUserProfile(
    userId: string,
    updates: { phoneNumber?: string; phoneVisible?: boolean }
): Promise<void> {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, updates, { merge: true });
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        throw error;
    }
}
