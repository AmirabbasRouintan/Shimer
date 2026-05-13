// app/_layout.tsx
import './global.css'; // Add this line at the very top
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Settings & Related Screens */}
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="how-to-use" options={{ headerShown: false }} />
          <Stack.Screen name="whats-new" options={{ headerShown: false }} />
          <Stack.Screen name="ask-question" options={{ headerShown: false }} />
          <Stack.Screen name="open-source" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen name="folders" options={{ headerShown: false }} />
          <Stack.Screen name="day-start" options={{ headerShown: false }} />
          <Stack.Screen name="home-screen-settings" options={{ headerShown: false }} />
          <Stack.Screen name="home-customize" options={{ headerShown: false }} />
          <Stack.Screen name="secure-files" options={{ headerShown: false }} />

          {/* Checklist Screens */}
          <Stack.Screen name="new-checklist" options={{ headerShown: false }} />
          <Stack.Screen name="edit-checklist" options={{ headerShown: false }} />

          {/* Activity Screens */}
          <Stack.Screen name="things" options={{ headerShown: false }} />
          <Stack.Screen name="edit_things" options={{ headerShown: false }} />
          <Stack.Screen name="edit-activity-page" options={{ headerShown: false }} />
          <Stack.Screen name="add-activity-page" options={{ headerShown: false }} />

          {/* Notes & Shortcuts */}
          <Stack.Screen name="new-note" options={{ headerShown: false }} />
          <Stack.Screen name="new-shortcut" options={{ headerShown: false }} />

          {/* Goals */}
          <Stack.Screen name="add-new-goal" options={{ headerShown: false }} />
          <Stack.Screen name="manage-goals" options={{ headerShown: false }} />
          <Stack.Screen name="edit-goal" options={{ headerShown: false }} />

          {/* History & Summary */}
          <Stack.Screen name="history" options={{ headerShown: false }} />
          <Stack.Screen name="summary" options={{ headerShown: false }} />
          <Stack.Screen name="calendar" options={{ headerShown: false }} />
          <Stack.Screen name="main" options={{ headerShown: false }} />

          {/* Modal */}
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
