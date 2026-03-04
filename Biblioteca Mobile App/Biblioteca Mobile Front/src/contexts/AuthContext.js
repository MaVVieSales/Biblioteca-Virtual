import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext({});

const USER_ID_KEY = 'user_id';
const USER_EMAIL_KEY = 'user_email';
const AUTH_TOKEN_KEY = 'auth_token';

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      const [storedUserId, storedEmail, storedToken] = await Promise.all([
        SecureStore.getItemAsync(USER_ID_KEY),
        SecureStore.getItemAsync(USER_EMAIL_KEY),
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
      ]);

      if (storedUserId && storedToken) {
        setUserId(storedUserId);
        setUserEmail(storedEmail);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (id, email, token = null) => {
    try {
      const authToken = token || `token_${id}_${Date.now()}`;
      
      await Promise.all([
        SecureStore.setItemAsync(USER_ID_KEY, id.toString()),
        SecureStore.setItemAsync(USER_EMAIL_KEY, email),
        SecureStore.setItemAsync(AUTH_TOKEN_KEY, authToken),
      ]);

      setUserId(id.toString());
      setUserEmail(email);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar dados de login:', error);
      return { success: false, error: 'Erro ao salvar dados de autenticação' };
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(USER_ID_KEY),
        SecureStore.deleteItemAsync(USER_EMAIL_KEY),
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      ]);

      setUserId(null);
      setUserEmail(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao limpar dados de autenticação:', error);
      return { success: false, error: 'Erro ao fazer logout' };
    }
  };

  const getAuthToken = async () => {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  };

  const updateUserData = async (newUserId, newEmail) => {
    try {
      if (newUserId) {
        await SecureStore.setItemAsync(USER_ID_KEY, newUserId.toString());
        setUserId(newUserId.toString());
      }
      if (newEmail) {
        await SecureStore.setItemAsync(USER_EMAIL_KEY, newEmail);
        setUserEmail(newEmail);
      }
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      return { success: false, error: 'Erro ao atualizar dados' };
    }
  };

  const value = {
    isLoading,
    isAuthenticated,
    userId,
    userEmail,
    login,
    logout,
    getAuthToken,
    updateUserData,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};