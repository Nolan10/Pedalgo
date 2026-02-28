import { register } from '@/src/services/authService';
import { colors } from '@/src/theme/colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        try {
            setLoading(true);
            await register(email, password);
            Alert.alert('Succès', 'Compte créé avec succès !', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error: any) {
            const errorMessage = error.code === 'auth/email-already-in-use'
                ? 'Cet email est déjà utilisé'
                : 'Erreur lors de l\'inscription';
            Alert.alert('Erreur', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Inscription</Text>

            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Mot de passe (min 6 car.)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>S'inscrire</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => router.push('/login')}
                >
                    <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
        marginBottom: 32,
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    input: {
        backgroundColor: '#F9F9F9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    button: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loader: {
        marginVertical: 12,
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: colors.primary,
        fontSize: 16,
    },
});
