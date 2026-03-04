import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ImageBackground,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Provider as PaperProvider,
  IconButton,
} from 'react-native-paper';
import Svg, { Rect, Circle, Defs, Mask } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

const Login = () => {
  const ip = process.env.EXPO_PUBLIC_IP;
  const { theme, isDark, toggleTheme } = useTheme();
  const { login } = useAuth();
  const textColor = theme.colors.onBackground;
  const navigation = useNavigation();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const senhaRef = useRef();

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("overlay-swipe");
    NavigationBar.setBackgroundColorAsync("transparent");

    return () => {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("inset-swipe");
    };
  }, []);

  const verificarLogin = async () => {
    setErro('');

    if (!email.trim() || !senha.trim()) {
      setErro('Preencha todos os campos!');
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(ip + "/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        const resultado = await login(dados.id, email, dados.token);

        if (resultado.success) {
          await AsyncStorage.setItem('idUser', dados.id.toString());

          navigation.replace('Home');
        } else {
          setErro(resultado.error || 'Erro ao salvar dados de autenticação');
        }
      } else {
        setErro(dados.Mensagem || 'Usuário ou senha inválidos!');
      }
    } catch (erro) {
      console.error('Erro de conexão:', erro);
      setErro('Erro ao conectar ao servidor!');
    } finally {
      setCarregando(false);
    }
  };

  const cardWidth = wp(90);
  const cardHeight = hp(82);
  const circleRadius = wp(10);
  const iconSize = wp(11);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={{ flex: 1 }}>
        <ImageBackground
          source={require('../../assets/imgbg.png')}
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode="cover"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: hp(2),
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
               
                <View style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 3,
                  marginBottom: hp(-3),
                  backgroundColor: theme.colors.surface,
                  width: wp(45),
                  height: hp(7),
                  borderRadius: 15,
                }}>
                  <Image
                    source={require('../../assets/senai.png')}
                    style={{
                      width: wp(35),
                      height: hp(4),
                      resizeMode: 'contain',
                    }}
                  />
                </View>

                <View style={{
                  position: 'relative',
                  minHeight: hp(75),
                  width: cardWidth,
                  paddingTop: hp(5),
                }}>

                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0
                  }}>
                    <Svg width={cardWidth} height={cardHeight}>
                      <Defs>
                        <Mask id="mask">
                          <Rect width="100%" height="100%" fill="white" />
                          <Circle
                            cx={cardWidth / 2}
                            cy={cardHeight}
                            r={circleRadius}
                            fill="black"
                          />
                        </Mask>
                      </Defs>
                      <Rect
                        width="100%"
                        height="100%"
                        fill={theme.colors.surface}
                        mask="url(#mask)"
                        rx={15}
                      />
                    </Svg>
                  </View>

                  <View
                    pointerEvents="box-none"
                    style={{
                      position: 'absolute',
                      top: cardHeight - circleRadius,
                      left: (cardWidth / 2) - circleRadius,
                      width: circleRadius * 2,
                      height: circleRadius * 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 50,
                    }}
                  >
                    <IconButton
                      icon={isDark ? 'white-balance-sunny' : 'weather-night'}
                      iconColor="white"
                      size={iconSize}
                      onPress={toggleTheme}
                      style={{
                        margin: 0,
                        backgroundColor: 'transparent',
                      }}
                    />
                  </View>

                  <View style={{
                    zIndex: 5,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: wp(5),
                    paddingTop: hp(1),
                  }}>
                    <Text style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: hp(1), color: textColor, fontSize: wp(6) }}>
                      Entrar
                    </Text>
                    <Text style={{ textAlign: 'center', opacity: 0.8, marginBottom: hp(2), color: textColor, fontSize: wp(3.5) }}>
                      Bem-vindo(a) de volta à Biblioteca Virtual!
                    </Text>

                    <View style={{ height: hp(3.5) }}>
                      {erro !== '' && (
                        <Text style={{ color: '#e74c3c', textAlign: 'center', marginBottom: hp(1.5), fontWeight: '600', fontSize: wp(3.5) }}>
                          {erro}
                        </Text>
                      )}
                    </View>

                    <TextInput
                      label="E-mail"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setErro('');
                      }}
                      mode="outlined"
                      style={{ width: '100%', marginBottom: hp(1.5), height: hp(6.5) }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="next"
                      onSubmitEditing={() => senhaRef.current.focus()}
                      maxLength={150}
                      editable={!carregando}
                      theme={{
                        colors: {
                          primary: textColor,
                          onSurfaceVariant: textColor,
                          placeholder: textColor,
                        },
                      }}
                    />

                    <TextInput
                      label="Senha"
                      value={senha}
                      onChangeText={(text) => {
                        setSenha(text);
                        setErro('');
                      }}
                      secureTextEntry={!showPassword}
                      mode="outlined"
                      style={{ width: '100%', marginBottom: hp(1.5), height: hp(6.5) }}
                      left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye' : 'eye-off'}
                          color={theme.colors.primary}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="done"
                      ref={senhaRef}
                      maxLength={150}
                      onSubmitEditing={verificarLogin}
                      editable={!carregando}
                      theme={{
                        colors: {
                          primary: textColor,
                          onSurfaceVariant: textColor,
                          placeholder: textColor,
                        },
                      }}
                    />

                    <Text style={{ color: textColor, fontSize: wp(3.5), marginTop: hp(0.5) }}>
                      {' '}
                      <Text
                        style={{ color: 'red', fontWeight: 'bold', textDecorationLine: 'underline' }}
                        onPress={() => !carregando && navigation.navigate('RedefSenha')}
                      >
                        Esqueci minha senha
                      </Text>
                    </Text>

                    <TouchableOpacity
                      onPress={verificarLogin}
                      disabled={carregando}
                      style={{ width: '100%', height: hp(7), marginTop: hp(2), borderRadius: 8, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', }}>
                      <Text
                        style={{ fontSize: wp(4.5), fontWeight: 'bold', color: 'white', textAlign: 'center', }}>
                        Avançar
                      </Text>
                    </TouchableOpacity>

                    <Text style={{ color: textColor, fontSize: wp(3.5), marginTop: hp(1.5) }}>
                      Não possui um cadastro?{' '}
                      <Text
                        style={{ color: 'red', fontWeight: 'bold', textDecorationLine: 'underline' }}
                        onPress={() => !carregando && navigation.navigate('Cadastrar')}
                      >
                        Cadastrar
                      </Text>
                    </Text>

                    <Image
                      source={
                        isDark
                          ? require('../../assets/livro_dark.png')
                          : require('../../assets/livro_light.png')
                      }
                      style={{
                        width: wp(65),
                        height: hp(18),
                        resizeMode: 'contain',
                        marginTop: hp(3),
                      }}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </ImageBackground>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default Login;
