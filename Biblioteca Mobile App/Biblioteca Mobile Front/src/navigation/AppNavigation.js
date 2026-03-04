import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import SplashScreen from '../Screens/SplashScreen';
import Home from '../Screens/Home';
import Login from '../Screens/Login';
import Cadastrar from '../Screens/Cadastrar';
import Inicio from '../Screens/Inicio';
import RedefSenha from '../Screens/RedefSenha';
import Detalhes from '../Screens/Detalhes';
import Favoritos from '../Screens/Favoritos';
import Museu from '../Screens/Museu';
import Perfil from '../Screens/Perfil';
import VisualizarTCC from '../Screens/VisualizarTCC';
import Resultados from '../Screens/Resultados';
import Reservas from '../Screens/Reservas';
import EditarPerfil from '../Screens/EditarPerfil';

const Stack = createStackNavigator();

const LoadingScreen = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.text }]}>
        Verificando autenticação...
      </Text>
    </View>
  );
};

const AppNavigation = () => {
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : (
          <>
            
            <Stack.Screen name="Splash" component={SplashScreen} />
            
            <Stack.Screen name="Inicio" component={Inicio} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Cadastrar" component={Cadastrar} />
            <Stack.Screen name="RedefSenha" component={RedefSenha} />
            
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Perfil" component={Perfil} />
            <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
            <Stack.Screen name="Detalhes" component={Detalhes} />
            <Stack.Screen name="Favoritos" component={Favoritos} />
            <Stack.Screen name="Museu" component={Museu} />
            <Stack.Screen name="VisualizarTCC" component={VisualizarTCC} />
            <Stack.Screen name="Resultados" component={Resultados} />
            <Stack.Screen name="Reservas" component={Reservas} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AppNavigation;