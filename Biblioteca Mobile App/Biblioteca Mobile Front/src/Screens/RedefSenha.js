import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Provider as PaperProvider,
} from 'react-native-paper';
import Svg, { Rect, Circle, Defs, Mask } from 'react-native-svg';
import { useTheme } from './../contexts/ThemeContext';
import * as NavigationBar from 'expo-navigation-bar';

const { width, height } = Dimensions.get('window');

const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

const RedefSenha = ({ navigation }) => {
  const ip = process.env.EXPO_PUBLIC_IP;

  const { theme, isDark, toggleTheme } = useTheme();
  const textColor = theme.colors.onBackground;

  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const matriculaRef = useRef();
  const novaSenhaRef = useRef();
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

  const handleRedefinirSenha = async () => {
    setMensagemErro('');

    if (!email || !matricula || !novaSenha || !confirmarSenha) {
      setMensagemErro('Preencha todos os campos');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagemErro('As senhas não coincidem');
      return;
    }

    try {
      const resposta = await fetch(ip + '/redefinir-senha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, matricula, novaSenha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        Alert.alert('Sucesso', 'Senha redefinida com sucesso!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        setMensagemErro(dados.erro || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Erro:', error);
      setMensagemErro('Erro de conexão com o servidor');
    }
  };

  const cardWidth = wp(90);
  const cardHeight = hp(80);
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
                {/* Logo SENAI */}
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
                    source={require('./../../assets/senai.png')}
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
                    <Text style={{
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginBottom: hp(1),
                      color: textColor,
                      fontSize: wp(6)
                    }}>
                      Redefinir Senha
                    </Text>

                    <Text style={{
                      textAlign: 'center',
                      opacity: 0.8,
                      marginBottom: hp(2),
                      color: textColor,
                      fontSize: wp(3.5)
                    }}>
                      Digite seu e-mail e escolha uma nova senha
                    </Text>

                    <View style={{ height: hp(3.5) }}>
                      {mensagemErro !== '' && (
                        <Text style={{
                          color: '#e74c3c',
                          textAlign: 'center',
                          marginBottom: hp(1.5),
                          fontWeight: '600',
                          fontSize: wp(3.5)
                        }}>
                          {mensagemErro}
                        </Text>
                      )}
                    </View>

                    <TextInput
                      label="E-mail"
                      value={email}
                      onChangeText={setEmail}
                      mode="outlined"
                      style={{
                        width: '100%',
                        marginBottom: hp(1.5),
                        height: hp(6.5)
                      }}
                      autoCapitalize="none"
                      left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="next"
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
                      onChangeText={setMatricula}
                      mode="outlined"
                      style={{
                        width: '100%',
                        marginBottom: hp(1.5),
                        height: hp(6.5)
                      }}
                      autoCapitalize="none"
                      left={<TextInput.Icon icon="card-account-details" color={theme.colors.primary} />}
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="next"
                      ref={matriculaRef}
                      onSubmitEditing={() => novaSenhaRef.current.focus()}
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
                      label="Nova senha"
                      value={novaSenha}
                      onChangeText={setNovaSenha}
                      secureTextEntry={!showSenha}
                      mode="outlined"
                      style={{
                        width: '100%',
                        marginBottom: hp(1.5),
                        height: hp(6.5)
                      }}
                      left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
                      right={
                        <TextInput.Icon
                          icon={showSenha ? 'eye' : 'eye-off'}
                          color={theme.colors.primary}
                          onPress={() => setShowSenha(!showSenha)}
                        />
                      }
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="next"
                      ref={novaSenhaRef}
                      onSubmitEditing={() => confirmarSenhaRef.current.focus()}
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
                      label="Confirmar senha"
                      value={confirmarSenha}
                      onChangeText={setConfirmarSenha}
                      secureTextEntry={!showConfirmarSenha}
                      mode="outlined"
                      style={{
                        width: '100%',
                        marginBottom: hp(1.5),
                        height: hp(6.5)
                      }}
                      left={<TextInput.Icon icon="lock-check" color={theme.colors.primary} />}
                      right={
                        <TextInput.Icon
                          icon={showConfirmarSenha ? 'eye' : 'eye-off'}
                          color={theme.colors.primary}
                          onPress={() => setShowConfirmarSenha(!showConfirmarSenha)}
                        />
                      }
                      outlineColor={theme.colors.primary}
                      cursorColor={theme.colors.primary}
                      activeOutlineColor={theme.colors.primary}
                      textColor={textColor}
                      returnKeyType="done"
                      ref={confirmarSenhaRef}
                      onSubmitEditing={handleRedefinirSenha}
                      maxLength={150}
                      theme={{
                        colors: {
                          primary: textColor,
                          onSurfaceVariant: textColor,
                          placeholder: textColor,
                        },
                      }}
                    />

                    <Text style={{ color: textColor, fontSize: wp(3.5), marginTop: hp(1.5) }}>
                      Lembrou sua senha?{' '}
                      <Text style={{ color: 'red', fontWeight: 'bold', textDecorationLine: 'underline' }}
                        onPress={() => navigation.navigate('Login')}>
                        Voltar ao Login
                      </Text>
                    </Text>

                    <TouchableOpacity
                      onPress={handleRedefinirSenha}
                      style={{
                        width: '100%',
                        marginTop: hp(2),
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
                          icon="lock-reset"
                          size={wp(5)}
                          iconColor='white'
                          onPress={handleRedefinirSenha}
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
                          Redefinir Senha
                        </Text></View>
                    </TouchableOpacity>

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

export default RedefSenha;