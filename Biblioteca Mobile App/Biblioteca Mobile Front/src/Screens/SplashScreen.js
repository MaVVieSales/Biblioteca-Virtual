import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Easing
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("screen");

const SplashScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  // Animações principais
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bookAnim = useRef(new Animated.Value(0)).current;
  const bookOpenAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  // Partículas
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      return {
        id: i,
        startX,
        startY,
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
      };
    })
  );

  // Triângulos
  const triangle1Anim = useRef(new Animated.Value(0)).current;
  const triangle2Anim = useRef(new Animated.Value(0)).current;
  const triangle3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de partículas
    particles.forEach((particle) => {
      const dx = (Math.random() - 0.5) * 200;
      const dy = (Math.random() - 0.5) * 200;

      Animated.loop(
        Animated.sequence([
          Animated.delay(Math.random() * 2000),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.translateX, {
              toValue: dx,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: dy,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.translateX, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });

    // Animação de triângulos flutuantes
    Animated.loop(
      Animated.sequence([
        Animated.timing(triangle1Anim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(triangle1Anim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(triangle2Anim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(triangle2Anim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(triangle3Anim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(triangle3Anim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animação de brilho pulsante
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Sequência principal de animação
    Animated.sequence([
      Animated.timing(bookAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(bookOpenAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Navega condicionalmente baseado no status de autenticação
      if (!isLoading) {
        if (isAuthenticated) {
          navigation.replace("Home");
        } else {
          navigation.replace("Inicio");
        }
      }
    });
  }, [isAuthenticated, isLoading]);

  const gradientColors = theme.dark
    ? ['#1a0505', '#9a1915', '#e30613']
    : ['#1a0505', '#9a1915', '#e30613'];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
        hidden={true}
      />

      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Luz cristalina de fundo */}
        <Animated.View
          style={[
            styles.crystalLight,
            {
              opacity: glowAnim,
              transform: [{
                scale: glowAnim.interpolate({
                  inputRange: [0.4, 0.8],
                  outputRange: [1, 1.2],
                }),
              }],
            },
          ]}
        />

        {/* Partículas luminosas */}
        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.startX,
                top: particle.startY,
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  { scale: particle.scale },
                ],
              },
            ]}
          />
        ))}

        {/* Triângulos geométricos */}
        <Animated.View
          style={[
            styles.triangle,
            styles.triangle1,
            {
              opacity: 0.15,
              transform: [{
                translateY: triangle1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              }, {
                rotate: triangle1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '10deg'],
                }),
              }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.triangle,
            styles.triangle2,
            {
              opacity: 0.15,
              transform: [{
                translateY: triangle2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              }, {
                rotate: triangle2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-10deg'],
                }),
              }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.triangle,
            styles.triangle3,
            {
              opacity: 0.15,
              transform: [{
                translateY: triangle3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              }, {
                rotate: triangle3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '10deg'],
                }),
              }],
            },
          ]}
        />

        {/* Livro central */}
        <View style={styles.bookContainer}>
          <Animated.View
            style={[
              styles.book,
              {
                opacity: bookAnim,
                transform: [
                  {
                    translateY: bookAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                  {
                    scale: bookAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.bookGlow,
                { opacity: glowAnim },
              ]}
            />

            <View style={styles.bookSpine} />

            <Animated.View
              style={[
                styles.bookCover,
                {
                  transform: [{
                    rotateY: bookOpenAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '-120deg'],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.bookDecor} />
              <View style={styles.bookLine} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Conteúdo que emerge */}
        <Animated.View
          style={[
            styles.contentEmerge,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.appTitle}>Biblioteca Virtual</Text>
          <Text style={styles.appVersion}>9.14</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineAnim,
              transform: [{
                translateY: taglineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [15, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.tagline}>Seu futuro em uma estante</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crystalLight: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  triangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  triangle1: {
    top: height * 0.1,
    left: width * 0.15,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 87,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(227, 6, 19, 0.3)',
  },
  triangle2: {
    top: height * 0.6,
    right: width * 0.1,
    borderTopWidth: 65,
    borderBottomWidth: 65,
    borderLeftWidth: 113,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(154, 25, 21, 0.4)',
  },
  triangle3: {
    bottom: height * 0.2,
    left: width * 0.2,
    borderTopWidth: 45,
    borderBottomWidth: 45,
    borderRightWidth: 78,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(227, 6, 19, 0.25)',
  },
  bookContainer: {
    marginBottom: 50,
  },
  book: {
    position: 'relative',
    width: 200,
    height: 280,
  },
  bookGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(227, 6, 19, 0.6)',
    shadowColor: '#e30613',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 20,
  },
  bookSpine: {
    position: 'absolute',
    width: 30,
    height: '100%',
    left: 0,
    backgroundColor: '#7a1410',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  bookCover: {
    position: 'absolute',
    width: 170,
    height: '100%',
    left: 30,
    backgroundColor: '#e30613',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  bookDecor: {
    position: 'absolute',
    width: '70%',
    height: '80%',
    top: '10%',
    left: '15%',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  bookLine: {
    position: 'absolute',
    width: '50%',
    height: 4,
    top: '50%',
    left: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
  contentEmerge: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 24,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  taglineContainer: {
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 3,
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 15,
  },
});

export default SplashScreen;