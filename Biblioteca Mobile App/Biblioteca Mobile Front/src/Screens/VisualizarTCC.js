import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Linking,
  Alert,
  Image,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from './../contexts/ThemeContext';
import { Provider as PaperProvider, IconButton } from "react-native-paper";

const { width, height } = Dimensions.get("window");

const wp = (p) => (width * p) / 100;
const hp = (p) => (height * p) / 100;

const BOOK_W = wp(90);
const BOOK_H = BOOK_W * 1.05;

const VisualizarTCC = ({ route, navigation }) => {
  const ip = process.env.EXPO_PUBLIC_IP;
  const { tcc: initialTcc } = route.params;

  const { theme, isDark, toggleTheme } = useTheme();

  const [aberto, setAberto] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const [tcc, setTcc] = useState(initialTcc);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const idUsuario = await AsyncStorage.getItem("idUser");
        if (!idUsuario) {
          Alert.alert("Erro", "Usuário não identificado. Faça login.");
          return;
        }
        setUsuarioId(idUsuario);

        if (!ip) {
          console.warn("Variável EXPO_PUBLIC_IP não definida. Pulando fetch do TCC.");
          return;
        }

        const res = await fetch(`${ip}/tcc/${initialTcc.id}?usuario_id=${idUsuario}`);
        if (!res.ok) throw new Error("Erro ao buscar TCC");
        const fresh = await res.json();
        setTcc(fresh);
      } catch (e) {
        console.log("Erro ao carregar TCC:", e.message || e);
      }
    })();
  }, [initialTcc.id, ip]);

  const toggleBook = useCallback(() => {
    Animated.spring(anim, {
      toValue: aberto ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
    setAberto((prev) => !prev);
  }, [aberto, anim]);

  const coverRotateY = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-180deg"] });
  const leftPageRotateY = anim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "0deg"] });
  const rightPageRotateY = anim.interpolate({ inputRange: [0, 1], outputRange: ["-180deg", "0deg"] });
  const coverOpacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0, 0] });

  const abrirPDF = async () => {
    if (!tcc?.link) {
      Alert.alert("Link não disponível");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(tcc.link);
      if (supported) {
        Linking.openURL(tcc.link);
      } else {
        Alert.alert("Não foi possível abrir o link");
      }
    } catch (e) {
      Alert.alert("Erro ao abrir link");
    }
  };

  const toggleFavorito = useCallback(async () => {
    if (!usuarioId) return Alert.alert("Erro", "Usuário não identificado.");
    try {
      const res = await fetch(`${ip}/tcc/${tcc.id}/favoritar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: usuarioId }),
      });
      const data = await res.json();
      if (res.ok) setTcc((prev) => ({ ...prev, favorito: data.favorito }));
      else {
        console.warn("Erro favoritar:", data);
        Alert.alert("Erro", data.message || "Não foi possível favoritar");
      }
    } catch (err) {
      console.log("Erro ao favoritar:", err.message || err);
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    }
  }, [tcc?.id, usuarioId, ip]);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>

        <TouchableOpacity
          style={styles.btnVoltar}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <IconButton icon="arrow-left" iconColor={theme.colors.primary} size={wp(6)} onPress={() => navigation.goBack()} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnTema} onPress={toggleTheme} activeOpacity={0.8}>
          <IconButton
            icon={isDark ? "white-balance-sunny" : "weather-night"}
            iconColor={theme.colors.primary}
            size={wp(6)}
            onPress={toggleTheme}
          />
        </TouchableOpacity>

        <View style={styles.contentContainer} pointerEvents="box-none">
          <Text style={[styles.instructionText, { color: theme.colors.primary, fontSize: wp(4) }]}>
            Pressione o TCC
          </Text>

          <TouchableOpacity activeOpacity={1} onPress={toggleBook} style={styles.bookContainer}>
            <View style={styles.bookWrapper}>
              <Animated.View
                pointerEvents={aberto ? "none" : "auto"}
                style={[
                  styles.cover,
                  {
                    transform: [{ rotateY: coverRotateY }],
                    opacity: coverOpacity,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={require("./../../assets/senai.png")}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.cardContentWrapper}>
                  <Text style={[styles.cardTitle, { color: theme.colors.primary, fontSize: wp(4.2) }]}>
                    {tcc?.titulo || "—"}
                  </Text>
                  <Text style={[styles.cardCourse, { color: theme.colors.primary, fontSize: wp(3.4) }]}>
                    {tcc?.curso || "—"}
                  </Text>
                </View>
              </Animated.View>

              <View style={styles.book}>
                <Animated.View
                  pointerEvents={aberto ? "auto" : "none"}
                  style={[
                    styles.pageLeft,
                    {
                      backgroundColor: theme.colors.cardBackground,
                      transform: [{ perspective: 1000 }, { rotateY: leftPageRotateY }],
                    },
                  ]}
                >
                  <ScrollView contentContainerStyle={styles.pagePad} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, { color: theme.colors.primary, fontSize: wp(5) }]}>
                      {tcc?.titulo || "—"}
                    </Text>

                    {[
                      ["Curso", tcc?.curso],
                      ["Ano", tcc?.ano],
                      ["Autores", tcc?.autores],
                    ].map(([label, value]) => (
                      <View style={styles.detailRow} key={label}>
                        <Text style={[styles.label, { color: theme.colors.primary, fontSize: wp(3.6) }]}>{label}:</Text>
                        <Text style={[styles.value, { color: theme.colors.text, fontSize: wp(3.6) }]} numberOfLines={2}>{value || "—"}</Text>
                      </View>
                    ))}

                    <View style={[styles.separator, { backgroundColor: theme.colors.menuText }]} />
                    <Text style={[styles.title1, { color: theme.colors.primary, fontSize: wp(3.6) }]}>
                      Trabalho de Conclusão de Curso (TCC)
                    </Text>
                  </ScrollView>
                </Animated.View>
                <Animated.View
                  pointerEvents={aberto ? "auto" : "none"}
                  style={[
                    styles.pageRight,
                    {
                      backgroundColor: theme.colors.cardBackground,
                      transform: [{ perspective: 1000 }, { rotateY: rightPageRotateY }],
                    },
                  ]}
                >
                  <View style={styles.pagePad}>
                    <Text style={[styles.titleRight, { color: theme.colors.primary, fontSize: wp(4.6) }]}>
                      Ações
                    </Text>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.colors.primary, paddingVertical: hp(1.4) }]}
                      onPress={abrirPDF}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.actionText, { color: "#fff", fontSize: wp(3.9) }]}>Ler ou Baixar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        tcc?.favorito
                          ? { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary, paddingVertical: hp(1.4) }
                          : { backgroundColor: theme.colors.primary, paddingVertical: hp(1.4) },
                      ]}
                      activeOpacity={0.85}
                      onPress={aberto ? toggleFavorito : undefined}
                    >
                      <Text style={[styles.actionText1, { color: tcc?.favorito ? theme.colors.primary : "#fff", fontSize: wp(3.9) }]}>
                        {tcc?.favorito ? "❤️ Favorito" : "🤍 Favoritar"}
                      </Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />

                  </View>
                </Animated.View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(2),
  },
  instructionText: {
    marginBottom: hp(2),
    fontWeight: "bold",
  },
  bookContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  bookWrapper: {
    width: BOOK_W,
    height: BOOK_H,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    position: "absolute",
    width: BOOK_W * 0.78,
    height: BOOK_H,
    borderWidth: 1,
    backfaceVisibility: "hidden",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(2),
  },
  cardImageWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    height: hp(6),
    marginTop: hp(2),
    marginBottom: hp(1.2),
  },
  cardImage: {
    width: wp(22),
    height: hp(3.6),
  },
  cardContentWrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: wp(2),
  },
  cardTitle: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: hp(0.6),
  },
  cardCourse: {
    textAlign: "center",
  },
  book: {
    position: "absolute",
    width: BOOK_W,
    height: BOOK_H,
    flexDirection: "row",
  },
  pageLeft: {
    width: "50%",
    height: "100%",
    borderRightWidth: 0.5,
    borderRightColor: "#c4c4c4",
    backfaceVisibility: "hidden",
  },
  pageRight: {
    width: "50%",
    height: "100%",
    borderLeftWidth: 0.5,
    borderLeftColor: "#c4c4c4",
    backfaceVisibility: "hidden",

  },
  pagePad: {
    flex: 1,
    padding: wp(3.6),
    paddingVertical: hp(1.6),
    justifyContent: "space-evenly",
  },
  title: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: hp(1),
    lineHeight: wp(6),
  },
  title1: {
    fontWeight: "800",
    textAlign: "center",
  },
  titleRight: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: hp(1),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: hp(0.8),
  },
  label: {
    fontWeight: "700",
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
  },
  separator: {
    height: 0.5,
    marginVertical: hp(1),
  },
  actionBtn: {
    borderRadius: 8,
    alignItems: "center",
    marginVertical: hp(0.6),
    paddingHorizontal: wp(4),
  },
  actionText: {
    fontWeight: "700",
  },
  actionText1: {
    fontWeight: "700",
  },
  btnVoltar: {
    position: "absolute",
    top: Platform.OS === "ios" ? hp(4.5) : hp(2.4),
    left: wp(2),
    zIndex: 9999,
    elevation: 10,
  },
  btnTema: {
    position: "absolute",
    top: Platform.OS === "ios" ? hp(4.5) : hp(2.4),
    right: wp(2),
    zIndex: 9999,
    elevation: 10,
  },
});

export default VisualizarTCC;
