import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigation from './src/navigation/AppNavigation';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar translucent backgroundColor="transparent" />
        <AppNavigation />
      </AuthProvider>
    </ThemeProvider>
  );
}