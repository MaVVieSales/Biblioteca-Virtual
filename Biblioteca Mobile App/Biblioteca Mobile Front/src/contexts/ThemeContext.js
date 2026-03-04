import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const LightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#9a1915',
    background: '#ffffff',
    surface: '#f8f8f8',
    text: '#000000',
    onBackground: '#000000',
    menuBackground: '#f8f8f8',
    menuText: '#000',
    cardBackground: '#f8f8f8',
  },
};

const DarkThemeCustom = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#e30613',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    onBackground: '#ffffff',
    menuBackground: '#1e1e1e',
    menuText: '#fff',
    cardBackground: '#1e1e1e',
  },
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const theme = isDark ? DarkThemeCustom : LightTheme;

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      console.log('🔄 Carregando tema salvo...');
      const savedTheme = await AsyncStorage.getItem('app_theme');
      console.log('📖 Tema encontrado:', savedTheme);

      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
        console.log('✅ Tema aplicado:', savedTheme === 'dark' ? 'escuro' : 'claro');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      console.log('🔄 Salvando tema:', newTheme ? 'dark' : 'light');

      setIsDark(newTheme);
      await AsyncStorage.setItem('app_theme', newTheme ? 'dark' : 'light');

      console.log('✅ Tema salvo com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar tema:', error);
    }
  };

  const setTheme = async (themeType) => {
    try {
      const newIsDark = themeType === 'dark' || themeType === 'escuro';
      console.log('🔄 Definindo tema:', themeType, '→', newIsDark ? 'escuro' : 'claro');

      setIsDark(newIsDark);
      await AsyncStorage.setItem('app_theme', newIsDark ? 'dark' : 'light');

      console.log('✅ Tema definido e salvo!');
    } catch (error) {
      console.error('❌ Erro ao salvar tema:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        setTheme,
        isLoading,
        LightTheme,
        DarkThemeCustom,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};