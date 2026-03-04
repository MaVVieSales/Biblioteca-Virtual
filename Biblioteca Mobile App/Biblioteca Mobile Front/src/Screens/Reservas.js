import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import {
  Text,
  Provider as PaperProvider,
  IconButton,
  Card,
  Button,
  RadioButton,
  Badge,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;
const isLargeDevice = width >= 768;

const CARD_WIDTH = isLargeDevice ? 180 : isMediumDevice ? 160 : 140;
const CARD_HEIGHT = isLargeDevice ? 240 : isMediumDevice ? 220 : 200;
const IMAGE_HEIGHT = isLargeDevice ? 180 : isMediumDevice ? 160 : 140;
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80;

const Reservas = ({ navigation }) => {
  const ip = process.env.EXPO_PUBLIC_IP;
  const { theme, isDark, setTheme } = useTheme();
  const { userId, logout } = useAuth();

  const listRefs = useRef({});
  const scrollViewRef = useRef(null);

  const [preReservas, setPreReservas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [temaVisible, setTemaVisible] = useState(false);
  const [temaSelecionado, setTemaSelecionado] = useState(isDark ? "escuro" : "claro");
  const [deslogando, setDeslogando] = useState(false);

  const handleSair = () => {
    Alert.alert(
      "Sair da Conta",
      "Tem certeza que deseja sair?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              setDeslogando(true);

              const resultado = await logout();

              if (resultado.success) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Inicio' }],
                });
              } else {
                Alert.alert("Erro", resultado.error || "Erro ao fazer logout");
                setDeslogando(false);
              }
            } catch (error) {
              console.error("Erro ao fazer logout:", error);
              Alert.alert("Erro", "Erro ao sair da conta");
              setDeslogando(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    setTemaSelecionado(isDark ? "escuro" : "claro");
  }, [isDark]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const carregarUsuario = async () => {
        try {
          setLoading(true);
          const idUsuario = await AsyncStorage.getItem("idUser");

          if (!idUsuario) {
            Alert.alert("Erro", "Usuário não identificado. Faça login.");
            navigation.replace("Inicio");
            return;
          }

          const response = await fetch(`${ip}/usuarios/${idUsuario}?t=${Date.now()}`);
          const data = await response.json();

          if (ativo) setUsuario(data);
        } catch (error) {
          console.error("Erro ao buscar usuário:", error);
          Alert.alert("Erro", "Não foi possível carregar os dados do usuário.");
        } finally {
          if (ativo) setLoading(false);
        }
      };

      carregarUsuario();

      return () => {
        ativo = false;
      };
    }, [ip])
  );

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const idUsuario = await AsyncStorage.getItem("idUser");
        if (!idUsuario) return;

        const res = await fetch(`${ip}/pre_reservas/usuario/${idUsuario}`);

        if (!res.ok) {
          throw new Error(`Erro na requisição: ${res.status}`);
        }

        const data = await res.json();

        const aguardando = data.filter((r) => r.status === "aguardando");
        const historicoData = data.filter(
          (r) => r.status === "retirado" || r.status === "devolvido"
        );

        setPreReservas(aguardando);
        console.log(Reservas)


        setHistorico(historicoData);
        console.log("Histórico abaixo")
        console.log(historico)

      } catch (err) {
        console.error("Erro ao buscar reservas:", err);
      }
    };

    fetchReservas();
  }, [ip]);

  const scrollTo = (key, direction) => {
    const listRef = listRefs.current[key];
    if (!listRef) return;

    const offset =
      (listRef._currentOffset || 0) +
      (direction === "right" ? CARD_WIDTH + 12 : -(CARD_WIDTH + 12));
    listRef.scrollToOffset({ offset, animated: true });
  };

  const aplicarTema = async () => {
    await setTheme(temaSelecionado);
    setTemaVisible(false);
  };

  const renderPreReserva = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("Detalhes", { livro: item })}
      activeOpacity={0.7}
      style={styles.cardWrapper}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.cardImageContainer}>
          <Image
            source={
              item.capa ? { uri: item.capa } : require("./../../assets/capalivro.png")
            }
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.statusBadgeText}>Ativa</Text>
          </View>
        </View>
        <Card.Content style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          <View style={styles.cardDateContainer}>
            <Text style={[styles.cardDateLabel, { color: theme.colors.text, opacity: 0.6 }]}>
              Retirar até
            </Text>
            <Text style={[styles.cardDate, { color: theme.colors.primary }]}>
              {new Date(item.data_retirada_max).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderHistorico = ({ item }) => {
    const isDevolvido = item.status === "devolvido";

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("Detalhes", { livro: item })}
        activeOpacity={0.7}
      >
        <Card style={[styles.historicoCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.histRow}>
            <View style={styles.histImageContainer}>
              <Image
                source={
                  item.capa ? { uri: item.capa } : require("./../../assets/capalivro.png")
                }
                style={styles.histImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.histContent}>
              <Text
                style={[styles.histTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {item.titulo}
              </Text>

              <View style={[
                styles.histStatusBadge,
                { backgroundColor: isDevolvido ? '#4CAF50' : theme.colors.primary }
              ]}>
                <Text style={styles.histStatusText}>
                  {isDevolvido ? 'Devolvido' : 'Retirado'}
                </Text>
              </View>

              <View style={styles.histDates}>
                <View style={styles.histDateItem}>
                  <Text style={[styles.histDateLabel, { color: theme.colors.text, opacity: 0.6 }]}>
                    Retirado em
                  </Text>
                  <Text style={[styles.histDateValue, { color: theme.colors.text }]}>
                    {new Date(item.data_retirada).toLocaleDateString("pt-BR")}
                  </Text>
                </View>

                {isDevolvido && (
                  <View style={styles.histDateItem}>
                    <Text style={[styles.histDateLabel, { color: theme.colors.text, opacity: 0.6 }]}>
                      Devolvido em
                    </Text>
                    <Text style={[styles.histDateValue, { color: theme.colors.text }]}>
                      {new Date(item.data_devolucao).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Modal transparent visible={menuVisible} animationType="slide">
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View
              style={[styles.menu, { backgroundColor: theme.colors.background }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.menuHeader}>
                <Text style={[styles.menuHeaderText, { color: theme.colors.text }]}>
                  Menu
                </Text>
                <IconButton
                  icon="close"
                  iconColor={theme.colors.text}
                  size={24}
                  onPress={() => setMenuVisible(false)}
                />
              </View>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Home");
                }}
                style={styles.menuItem}
              >
                <IconButton icon="book-open-variant" iconColor={theme.colors.menuText} size={22} />
                <Text style={[styles.menuText, { color: theme.colors.menuText }]}>
                  Biblioteca
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Museu");
                }}
                style={styles.menuItem}
              >
                <IconButton icon="school" iconColor={theme.colors.menuText} size={22} />
                <Text style={[styles.menuText, { color: theme.colors.menuText }]}>
                  Museu dos TCCs
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Reservas");
                }}
                style={[styles.menuItem, styles.menuItemActive, { backgroundColor: theme.colors.menuBackground, }]}
              >
                <IconButton icon="bookmark" iconColor={theme.colors.primary} size={22} />
                <Text style={[styles.menuText, { color: theme.colors.primary, fontWeight: '700' }]}>
                  Reservas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Favoritos");
                }}
                style={styles.menuItem}
              >
                <IconButton icon="heart" iconColor={theme.colors.menuText} size={22} />
                <Text style={[styles.menuText, { color: theme.colors.menuText }]}>
                  Favoritos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  setTemaVisible(true);
                }}
                style={styles.menuItem}
              >
                <IconButton icon="palette" iconColor={theme.colors.menuText} size={22} />
                <Text style={[styles.menuText, { color: theme.colors.menuText }]}>
                  Tema
                </Text>
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: theme.colors.text }]} />

              <TouchableOpacity
                onPress={handleSair}
                style={styles.menuItem}
              >
                <IconButton icon="logout" iconColor={theme.colors.menuText} size={22} />
                <Text style={[styles.menuText, { color: theme.colors.menuText }]}>
                  Sair
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal transparent visible={temaVisible} animationType="fade">
          <View style={styles.overlayCenter}>
            <View style={[styles.modalBox, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Selecionar Tema
                </Text>
                <IconButton
                  icon="close"
                  iconColor={theme.colors.text}
                  size={24}
                  onPress={() => setTemaVisible(false)}
                />
              </View>

              <RadioButton.Group
                onValueChange={(value) => setTemaSelecionado(value)}
                value={temaSelecionado}
              >
                <TouchableOpacity
                  style={[
                    styles.radioItem,
                    temaSelecionado === "claro" && styles.radioItemSelected
                  ]}
                  onPress={() => setTemaSelecionado("claro")}
                >
                  <RadioButton value="claro" color={theme.colors.primary} />
                  <IconButton icon="white-balance-sunny" iconColor={theme.colors.text} size={20} />
                  <Text style={[styles.radioText, { color: theme.colors.text }]}>Tema Claro</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioItem,
                    temaSelecionado === "escuro" && styles.radioItemSelected
                  ]}
                  onPress={() => setTemaSelecionado("escuro")}
                >
                  <RadioButton value="escuro" color={theme.colors.primary} />
                  <IconButton icon="moon-waning-crescent" iconColor={theme.colors.text} size={20} />
                  <Text style={[styles.radioText, { color: theme.colors.text }]}>Tema Escuro</Text>
                </TouchableOpacity>
              </RadioButton.Group>

              <Button
                mode="contained"
                style={[styles.prontoBtn, { backgroundColor: theme.colors.primary }]}
                labelStyle={styles.prontoBtnLabel}
                onPress={aplicarTema}
              >
                Aplicar Tema
              </Button>
            </View>
          </View>
        </Modal>

        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
            <IconButton icon="menu" iconColor="white" size={38} />
          </TouchableOpacity>

          <Image
            source={require("./../../assets/senaib.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("Perfil")}
            style={styles.profileButton}
          >
            <Image
              source={
                usuario?.foto
                  ? { uri: `${ip}/uploads/${usuario.foto}?t=${Date.now()}` }
                  : require("./../../assets/usericon.png")
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Pré-Reservas Ativas
              </Text>
              {preReservas.length > 0 && (
                <Badge
                  style={[styles.badge, { backgroundColor: theme.colors.primary }]}
                  size={24}
                >
                  {preReservas.length}
                </Badge>
              )}
            </View>

            {preReservas.length > 0 ? (
              <View style={styles.carrossel}>
                <IconButton
                  icon="chevron-left"
                  iconColor="white"
                  containerColor={theme.colors.primary}
                  size={24}
                  style={styles.carrosselButton}
                  onPress={() => scrollTo("pre", "left")}
                />
                <FlatList
                  ref={(ref) => (listRefs.current["pre"] = ref)}
                  data={preReservas}
                  renderItem={renderPreReserva}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carrosselContent}
                  onScroll={(e) => {
                    listRefs.current["pre"]._currentOffset =
                      e.nativeEvent.contentOffset.x;
                  }}
                  scrollEventThrottle={16}
                />
                <IconButton
                  icon="chevron-right"
                  iconColor="white"
                  containerColor={theme.colors.primary}
                  size={24}
                  style={styles.carrosselButton}
                  onPress={() => scrollTo("pre", "right")}
                />
              </View>
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
                <IconButton icon="bookmark-outline" iconColor={theme.colors.text} size={48} />
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  Nenhuma pré-reserva ativa
                </Text>
                <Text style={[styles.emptySubText, { color: theme.colors.text }]}>
                  Suas reservas aparecerão aqui
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Histórico de Reservas
              </Text>
              {historico.length > 0 && (
                <Badge
                  style={[styles.badge, { backgroundColor: theme.colors.primary }]}
                  size={24}
                >
                  {historico.length}
                </Badge>
              )}
            </View>

            {historico.length > 0 ? (
              <FlatList
                data={historico}
                renderItem={renderHistorico}
                keyExtractor={(item) => item.reserva_id.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.historicoList}
              />
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
                <IconButton icon="history" iconColor={theme.colors.text} size={48} />
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  Nenhum histórico encontrado
                </Text>
                <Text style={[styles.emptySubText, { color: theme.colors.text }]}>
                  Suas reservas concluídas aparecerão aqui
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: isLargeDevice ? 24 : 16,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    position: 'relative',
    height: Platform.OS === 'ios' ? 100 : 80,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { 
    height: 36,
    width: 110,
  },
  profileButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 50 : 20,
    zIndex: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
  },
  overlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  menu: {
    width: isLargeDevice ? 280 : 260,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginBottom: 8,
  },
  menuHeaderText: {
    fontSize: 24,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 24,
  },
  menuItemActive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  menuDivider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  modalBox: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  radioItemSelected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.2)',
  },
  radioText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  prontoBtn: {
    marginTop: 20,
    borderRadius: 12,
    elevation: 0,
  },
  prontoBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 6,
    color: '#fff',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: isLargeDevice ? 22 : 20,
    fontWeight: '700',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
  },
  carrossel: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -16,
    paddingHorizontal: 8,
  },
  carrosselButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  carrosselContent: {
    paddingHorizontal: 8,
  },
  cardWrapper: {
    marginHorizontal: 6,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 16,
  },
  cardImage: {
    height: IMAGE_HEIGHT,
    width: CARD_WIDTH - 32,
    borderRadius: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: isLargeDevice ? 15 : 14,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 8,
    minHeight: 40,
  },
  cardDateContainer: {
    alignItems: 'center',
  },
  cardDateLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: "center",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
  historicoList: {
    gap: 12,
  },
  historicoCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 12,
  },
  histRow: {
    flexDirection: "row",
  },
  histImageContainer: {
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    height: isLargeDevice ? 130 : 110,
    width: isLargeDevice ? 90 : 75,
  },
  histImage: {
    height: isLargeDevice ? 130 : 110,
    width: isLargeDevice ? 90 : 75,
  },
  histContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  histTitle: {
    fontSize: isLargeDevice ? 16 : 15,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 20,
  },
  histStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  histStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  histDates: {
    gap: 1,
  },
  histDateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  histDateLabel: {
    fontSize: 12,
  },
  histDateValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default Reservas;