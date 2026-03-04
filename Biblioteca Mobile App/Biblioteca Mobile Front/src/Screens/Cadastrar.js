import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ImageBackground,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
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
import { useTheme } from './../contexts/ThemeContext';
import * as NavigationBar from 'expo-navigation-bar';



const { width, height } = Dimensions.get('window');

const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

const Cadastrar = () => {
  const ip = process.env.EXPO_PUBLIC_IP;
  const { theme, isDark, toggleTheme } = useTheme();
  const textColor = theme.colors.onBackground;
  const navigation = useNavigation();

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');

  const emailRef = useRef();
  const matriculaRef = useRef();
  const senhaRef = useRef();
  const confirmarSenhaRef = useRef();

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("overlay-swipe");
    NavigationBar.setBackgroundColorAsync("transparent");

    return () => {
      NavigationBar.setVisibilityAsync("visible");
      NavigationBar.setBehaviorAsync("inset-swipe");
    };
  }, []);

  const handleCadastro = async () => {
    setErro('');
    const emailNormalizado = email.trim().toLowerCase();
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!nome || !emailNormalizado || !matricula || !senha || !confirmarSenha) {
      setErro('Preencha todos os campos!');
      return;
    }

    if (!emailRegex.test(emailNormalizado)) {
      setErro('E-mail inválido! Verifique o formato.');
      return;
    }

    const nomeRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    if (!nomeRegex.test(nome.trim())) {
      setErro('O nome deve conter apenas letras e espaços.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem!');
      return;
    }

    try {
      const resposta = await fetch(ip + '/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email: emailNormalizado, matricula, senha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        Alert.alert('Cadastro realizado com sucesso!');
        navigation.navigate('Login');
      } else {
        setErro(dados.error || 'Erro ao cadastrar!');
      }
    } catch (erro) {
      console.error('Erro de conexão:', erro);
      setErro('Erro ao conectar ao servidor!');
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
              <View style={styles.fundo}>
                <View
                  style={[
                    styles.senai,
                    {
                      backgroundColor: theme.colors.surface,
                      width: wp(45),
                      height: hp(7),
                      borderRadius: 15,
                    },
                  ]}
                >
                  <Image
                    source={require('./../../assets/senai.png')}
                    style={{
                      width: wp(35),
                      height: hp(4),
                      resizeMode: 'contain',
                    }}
                  />
                </View>

                {/* Card Principal */}
                <View style={[styles.fundo2Wrapper, { width: cardWidth }]}>
                  <View style={styles.svgContainer}>
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

                  <View style={styles.formContent}>
                    <Text style={[styles.title, { color: textColor, fontSize: wp(6) }]}>
                      Cadastrar
                    </Text>
                    <Text
                      style={[
                        styles.subtitle,
                        { color: textColor, fontSize: wp(3.5), marginBottom: hp(2) },
                      ]}
                    >
                      Crie sua conta na Biblioteca Virtual!
                    </Text>
                    <View style={{ height: hp(3.5) }}>
                      {erro !== '' && (
                        <Text style={[styles.error, { fontSize: wp(3.5) }]}>{erro}</Text>
                      )}
                    </View>
                    <TextInput
                      label="Nome completo"
                      value={nome}
                      onChangeText={(text) => setNome(text.replace(/[0-9]/g, ''))}
                      mode="outlined"
                      style={[styles.input, { height: hp(6.5) }]}
                      left={<TextInput.Icon icon="account" color={theme.colors.primary} />}
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current.focus()}
                      maxLength={150}
                      theme={{
                        colors: {
                          primary: textColor,
                          onSurfaceVariant: textColor,
                          placeholder: textColor,
                        },
                      }}
                    />

                    <TextInput
                      label="E-mail"
                      value={email}
                      onChangeText={setEmail}
                      mode="outlined"
                      autoCapitalize="none"
                      style={[styles.input, { height: hp(6.5) }]}
                      left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="next"
                      ref={emailRef}
                      onSubmitEditing={() => matriculaRef.current.focus()}
                      maxLength={150}
                      theme={{
                        colors: {
                          primary: textColor,
                          onSurfaceVariant: textColor,
                          placeholder: textColor,
                        },
                      }}
                    />

                    <TextInput
                      label="Matrícula"
                      value={matricula}
                      onChangeText={(text) => setMatricula(text.replace(/[^0-9]/g, ''))}
                      mode="outlined"
                      keyboardType="numeric"
                      style={[styles.input, { height: hp(6.5) }]}
                      left={
                        <TextInput.Icon
                          icon="card-account-details"
                          color={theme.colors.primary}
                        />
                      }
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="next"
                      ref={matriculaRef}
                      onSubmitEditing={() => senhaRef.current.focus()}
                      maxLength={150}
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
                      onChangeText={setSenha}
                      secureTextEntry={!showPassword}
                      mode="outlined"
                      style={[styles.input, { height: hp(6.5) }]}
                      left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="next"
                      ref={senhaRef}
                      onSubmitEditing={() => confirmarSenhaRef.current.focus()}
                      maxLength={150}
                      theme={{
                        colors: {
                          primary: textColor,
                          onSurfaceVariant: textColor,
                          placeholder: textColor,
                        },
                      }}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye' : 'eye-off'}
                          color={theme.colors.primary}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                    />

                    <TextInput
                      label="Confirmar senha"
                      value={confirmarSenha}
                      onChangeText={setConfirmarSenha}
                      secureTextEntry={!showPassword2}
                      mode="outlined"
                      style={[styles.input, { height: hp(6.5) }]}
                      left={<TextInput.Icon icon="lock-check" color={theme.colors.primary} />}
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="done"
                      ref={confirmarSenhaRef}
                      maxLength={150}
                      theme={{
                        colors: {
                          primary: textColor,
                          onSurfaceVariant: textColor,
                          placeholder: textColor,
                        },
                      }}
                      right={
                        <TextInput.Icon
                          icon={showPassword2 ? 'eye' : 'eye-off'}
                          color={theme.colors.primary}
                          onPress={() => setShowPassword2(!showPassword2)}
                        />
                      }
                    />

                    <TouchableOpacity
                      onPress={handleCadastro}
                      style={{
                        width: '100%',
                        height: hp(7),
                        borderRadius: 8,
                        backgroundColor: theme.colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        overflow: 'hidden',
                      }}
                    >
                      <View style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        paddingRight: wp(4)
                      }}>
                        <IconButton
                          icon="account-plus"
                          size={wp(5)}
                          iconColor='white'
                          onPress={handleCadastro}
                          style={{ marginRight: wp(0) }}
                        />

                        <Text
                          style={{
                            fontSize: wp(4.5),
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            paddingVertical: hp(1),
                          }}
                        >
                          Cadastrar
                        </Text></View>
                    </TouchableOpacity>

                    <Text style={{ color: textColor, fontSize: wp(3.5), marginTop: hp(1.5) }}>
                      Já tem uma conta?{' '}
                      <Text
                        style={[styles.link, { fontSize: wp(3.5) }]}
                        onPress={() => navigation.navigate('Login')}
                      >
                        Entrar
                      </Text>
                    </Text>
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

const styles = {
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
    marginTop: -hp(6),
  },

  fundo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  senai: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    marginBottom: hp(-3),
  },
  fundo2Wrapper: {
    position: 'relative',
    minHeight: hp(75),
    paddingTop: hp(5),
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  themeButton: {
    position: 'absolute',
    zIndex: 10,
    elevation: 6,
  },
  formContent: {
    zIndex: 5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
  error: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: hp(1.5),
    fontWeight: '600',
  },
  input: {
    width: '100%',
    marginBottom: hp(1.5),
  },
  button: {
    width: '100%',
    marginTop: hp(2),
    overflow: 'hidden',
    borderRadius: 8,
  },
  link: {
    color: 'red',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
};

export default Cadastrar;