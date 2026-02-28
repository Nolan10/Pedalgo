import { login } from '@/src/services/authService';
import { colors } from '@/src/theme/colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
            router.replace('/(tabs)');
        } catch (error: any) {
            const errorMessage = error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential'
                ? 'Email ou mot de passe incorrect'
                : error.code === 'auth/wrong-password'
                    ? 'Mot de passe incorrect'
                    : 'Erreur de connexion';
            Alert.alert('Erreur', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>PedalGo</Text>
            <Text style={styles.subtitle}>Location de vélos entre particuliers</Text>

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
                    placeholder="Mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Se connecter</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => router.push('/register')}
                >
                    <Text style={styles.linkText}>Créer un compte</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Text style={styles.browseText}>Parcourir les vélos sans compte</Text>
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
        fontSize: 42,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: colors.mutedText,
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
    browseButton: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 8,
    },
    browseText: {
        color: colors.gray,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
