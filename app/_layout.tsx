import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/src/context/AppContext';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];
    const secondSegment = segments.length > 1 ? (segments as string[])[1] : undefined;

    const inAuthGroup = firstSegment === 'login' || firstSegment === 'register';

    // Routes protégées : Mes Vélos (mybikes), Réservations et Profil
    const isProtectedTab = firstSegment === '(tabs)' && (
      secondSegment === 'mybikes' ||
      secondSegment === 'reservations' ||
      secondSegment === 'profile'
    );

    // Routes publiques : Liste des vélos (index), détail vélo, login/register
    const isPublicRoute =
      (firstSegment === '(tabs)' && !isProtectedTab) ||
      firstSegment === 'bike' ||
      inAuthGroup;

    // Non connecté et essaie d'accéder à une route protégée → login
    if (!user && !isPublicRoute) {
      router.replace('/login');
    }
    // Connecté et sur page login/register → rediriger vers l'app
    else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bike/[id]" options={{ title: 'Détails du vélo' }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
