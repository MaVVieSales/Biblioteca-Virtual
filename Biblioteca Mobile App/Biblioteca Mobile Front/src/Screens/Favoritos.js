import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import {
  TextInput,
  Text,
  Provider as PaperProvider,
  IconButton,
  Button,
  RadioButton,
  Checkbox,
  ActivityIndicator,
  Card,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTheme } from './../contexts/ThemeContext';
import { useAuth } from "../contexts/AuthContext";

const Tab = createMaterialTopTabNavigator();
const { width, height } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;
const isLargeDevice = width >= 768;

const ListaFavoritos = ({ tipo, query, generosSelecionados, cursosSelecionados, ip, navigation }) => {

  const { theme } = useTheme();
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const carregarFavoritos = async () => {
        try {
          const idUser = await AsyncStorage.getItem("idUser");
          if (!idUser) {
            if (ativo) setLoading(false);
            return;
          }

          const endpoint =
            tipo === "livro"
              ? `/usuarios/${idUser}/favoritos`
              : `/usuarios/${idUser}/favoritos_tcc`;

          const res = await fetch(ip + endpoint + `?t=${Date.now()}`);
          const data = await res.json();
          if (ativo) setFavoritos(data);
        } catch (err) {
          console.error(`Erro ao buscar ${tipo} favoritos:`, err);
        } finally {
          if (ativo) setLoading(false);
        }
      };

      carregarFavoritos();

      return () => {
        ativo = false;
      };
    }, [tipo, ip])
  );

  const favoritosFiltrados = favoritos.filter((item) => {
    const matchTitulo = query ? item.titulo.toLowerCase().includes(query.toLowerCase()) : true;

    let matchFiltro = true;
    if (tipo === "livro") {
      matchFiltro = generosSelecionados.length ? generosSelecionados.includes(item.genero) : true;
    } else if (tipo === "tcc") {
      matchFiltro = cursosSelecionados.length ? cursosSelecionados.includes(item.curso) : true;
    }

    return matchTitulo && matchFiltro;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Carregando favoritos...
        </Text>
      </View>
    );
  }

  if (!favoritosFiltrados.length) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton
          icon={tipo === "livro" ? "heart-outline" : "school-outline"}
          size={80}
          iconColor={theme.colors.text + '40'}
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Nenhum favorito encontrado
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.text }]}>
          {tipo === "livro"
            ? "Adicione livros aos favoritos para vê-los aqui"
            : "Adicione TCCs aos favoritos para vê-los aqui"}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={favoritosFiltrados}
      keyExtractor={(item) => `${tipo}-${item.id}`}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            if (tipo === "livro") {
              navigation.navigate("Detalhes", { livro: item });
            } else {
              navigation.navigate("VisualizarTCC", { tcc: item });
            }
          }}
          activeOpacity={0.7}
        >
          <Card style={[styles.favoriteCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.cardRow}>
              <View style={styles.capaContainer}>
                <Image
                  source={
                    tipo === "livro"
                      ? (item.capa ? { uri: item.capa } : require("./../../assets/capalivro.png"))
                      : require("./../../assets/senai.png")
                  }
                  style={tipo === "livro" ? styles.capaLivro : styles.capaTCC}
                  resizeMode={tipo === "livro" ? "cover" : "contain"}
                />
              </View>

              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.titulo}
                </Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {tipo === "livro" ? item.autor : item.autores}
                </Text>
                <View style={styles.tagContainer}>
                  <View style={[styles.tag, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                      {tipo === "livro" ? item.genero : item.curso}
                    </Text>
                  </View>
                </View>
              </View>

              <IconButton
                icon="chevron-right"
                size={24}
                iconColor={theme.colors.text + '60'}
              />
            </View>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
};

const AbaFavoritos = ({
  tipo,
  query,
  setQuery,
  generos,
  cursos,
  generosSelecionados,
  cursosSelecionados,
  setGenerosSelecionados,
  setCursosSelecionados,
  ip,
  navigation,
}) => {
  const { theme } = useTheme();
  const [showFilter, setShowFilter] = useState(false);
  const [generosTemp, setGenerosTemp] = useState([...generosSelecionados]);
  const [cursosTemp, setCursosTemp] = useState([...cursosSelecionados]);

  const filtrosAtivos = tipo === "livro" ? generosSelecionados : cursosSelecionados;

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            placeholder={`Pesquisar ${tipo === "livro" ? "livros" : "TCCs"} favoritos...`}
            mode="outlined"
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}
            outlineStyle={styles.searchOutline}
            left={<TextInput.Icon icon="magnify" color={theme.colors.text} />}
            right={
              query.length > 0 ? (
                <TextInput.Icon
                  icon="close"
                  color={theme.colors.text}
                  onPress={() => setQuery("")}
                />
              ) : null
            }
            placeholderTextColor={theme.colors.text + '80'}
            textColor={theme.colors.text}
            activeOutlineColor={theme.colors.primary}
          />

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              if (tipo === "livro") setGenerosTemp([...generosSelecionados]);
              else setCursosTemp([...cursosSelecionados]);
              setShowFilter(true);
            }}
          >
            <IconButton
              icon="filter-variant"
              iconColor="white"
              size={24}
            />
            {filtrosAtivos.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {filtrosAtivos.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ListaFavoritos
        tipo={tipo}
        query={query}
        generosSelecionados={generosSelecionados}
        cursosSelecionados={cursosSelecionados}
        ip={ip}
        navigation={navigation}
      />

      {/* Modal Filtro */}
      <Modal transparent visible={showFilter} animationType="fade">
        <View style={styles.overlayCenter}>
          <View style={[styles.filterModalBox, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {tipo === "livro" ? "Filtrar por Gênero" : "Filtrar por Curso"}
              </Text>
              <IconButton
                icon="close"
                iconColor={theme.colors.text}
                size={24}
                onPress={() => setShowFilter(false)}
              />
            </View>

            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.checkboxItem,
                  (tipo === "livro" ? generosTemp.length : cursosTemp.length) === 0 && styles.checkboxItemSelected
                ]}
                onPress={() => tipo === "livro" ? setGenerosTemp([]) : setCursosTemp([])}
              >
                <Checkbox
                  status={(tipo === "livro" ? generosTemp.length : cursosTemp.length) === 0 ? "checked" : "unchecked"}
                  color={theme.colors.primary}
                />
                <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                  {tipo === "livro" ? "Todos os Gêneros" : "Todos os Cursos"}
                </Text>
              </TouchableOpacity>

              <View style={[styles.filterDivider, { backgroundColor: theme.colors.text }]} />

              {(tipo === "livro" ? generos : cursos).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.checkboxItem,
                    (tipo === "livro" ? generosTemp : cursosTemp).includes(item) && styles.checkboxItemSelected
                  ]}
                  onPress={() => {
                    if (tipo === "livro") {
                      if (generosTemp.includes(item)) {
                        setGenerosTemp(generosTemp.filter(i => i !== item));
                      } else {
                        setGenerosTemp([...generosTemp, item]);
                      }
                    } else {
                      if (cursosTemp.includes(item)) {
                        setCursosTemp(cursosTemp.filter(i => i !== item));
                      } else {
                        setCursosTemp([...cursosTemp, item]);
                      }
                    }
                  }}
                >
                  <Checkbox
                    status={(tipo === "livro" ? generosTemp : cursosTemp).includes(item) ? "checked" : "unchecked"}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.filterButtons}>
              <Button
                mode="outlined"
                style={styles.filterCancelBtn}
                labelStyle={[styles.filterBtnLabel, { color: theme.colors.text }]}
                onPress={() => {
                  if (tipo === "livro") setGenerosTemp([]);
                  else setCursosTemp([]);
                }}
              >
                Limpar
              </Button>
              <Button
                mode="contained"
                style={[styles.filterApplyBtn, { backgroundColor: theme.colors.primary, color: theme.colors.text }]}
                labelStyle={styles.filterBtnLabel}
                onPress={() => {
                  if (tipo === "livro") setGenerosSelecionados([...generosTemp]);
                  else setCursosSelecionados([...cursosTemp]);
                  setShowFilter(false);
                }}
              >
                Aplicar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Favoritos = ({ navigation }) => {
  const ip = process.env.EXPO_PUBLIC_IP;
  const { theme, isDark, setTheme } = useTheme();
  const { userId, logout } = useAuth();

  const [queryLivros, setQueryLivros] = useState("");
  const [queryTCCs, setQueryTCCs] = useState("");
  const [generos, setGeneros] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [generosSelecionados, setGenerosSelecionados] = useState([]);
  const [cursosSelecionados, setCursosSelecionados] = useState([]);
  const [temaVisible, setTemaVisible] = useState(false);
  const [temaSelecionado, setTemaSelecionado] = useState(isDark ? "escuro" : "claro");
  const [menuVisible, setMenuVisible] = useState(false);
  const [usuario, setUsuario] = useState(null);
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

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const carregarUsuario = async () => {
        try {
          const idUsuario = await AsyncStorage.getItem("idUser");
          if (!idUsuario) {
            Alert.alert("Erro", "Usuário não identificado. Faça login.");
            navigation.replace("Inicio");
            return;
          }

          const response = await fetch(`${ip}/usuarios/${idUsuario}?t=${Date.now()}`);
          const data = await response.json();

          if (ativo) {
            setUsuario(data);
          }
        } catch (error) {
          console.error("Erro ao buscar usuário:", error);
        }
      };

      carregarUsuario();

      return () => {
        ativo = false;
      };
    }, [ip])
  );

  useEffect(() => {
    setTemaSelecionado(isDark ? "escuro" : "claro");
  }, [isDark]);

  useEffect(() => {
    const carregarGeneros = async () => {
      try {
        const res = await fetch(ip + "/generos");
        const data = await res.json();
        setGeneros(data.map((g) => g.genero || g.nome));
      } catch (err) {
        console.error("Erro ao buscar gêneros:", err);
      }
    };

    const carregarCursos = async () => {
      try {
        const res = await fetch(ip + "/tccs");
        const data = await res.json();
        const listaCursos = [...new Set(data.map(t => t.curso).filter(Boolean))];
        setCursos(listaCursos);
      } catch (err) {
        console.error("Erro ao buscar cursos:", err);
      }
    };

    carregarGeneros();
    carregarCursos();
  }, [ip]);

  const aplicarTema = async () => {
    await setTheme(temaSelecionado);
    setTemaVisible(false);
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.primary}
          hidden={true}
        />

        {/* Modal Menu */}
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
                style={styles.menuItem}
              >
                <IconButton icon="bookmark" iconColor={theme.colors.menuText} size={22} />
                <Text style={[styles.menuText, { color: theme.colors.menuText }]}>
                  Reservas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Favoritos");
                }}
                style={[styles.menuItem, styles.menuItemActive, { backgroundColor: theme.colors.menuBackground, }]}
              >
                <IconButton icon="heart" iconColor={theme.colors.primary} size={22} />
                <Text style={[styles.menuText, { color: theme.colors.primary, fontWeight: '700' }]}>
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

        {/* Modal Tema */}
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

        {/* HEADER */}
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

        {/* Tabs */}
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: theme.colors.primary,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            tabBarActiveTintColor: '#fff',
            tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
            tabBarIndicatorStyle: {
              backgroundColor: '#fff',
              height: 3,
            },
            tabBarLabelStyle: {
              fontSize: 14,
              fontWeight: '700',
              textTransform: 'none',
            },
          }}
        >
          <Tab.Screen name="Livros">
            {() => (
              <AbaFavoritos
                tipo="livro"
                query={queryLivros}
                setQuery={setQueryLivros}
                generos={generos}
                cursos={cursos}
                generosSelecionados={generosSelecionados}
                cursosSelecionados={cursosSelecionados}
                setGenerosSelecionados={setGenerosSelecionados}
                setCursosSelecionados={setCursosSelecionados}
                ip={ip}
                navigation={navigation}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="TCCs">
            {() => (
              <AbaFavoritos
                tipo="tcc"
                query={queryTCCs}
                setQuery={setQueryTCCs}
                generos={generos}
                cursos={cursos}
                generosSelecionados={generosSelecionados}
                cursosSelecionados={cursosSelecionados}
                setGenerosSelecionados={setGenerosSelecionados}
                setCursosSelecionados={setCursosSelecionados}
                ip={ip}
                navigation={navigation}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabContainer: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: isLargeDevice ? 24 : 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallDevice ? 14 : 16,
  },
  searchOutline: {
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButton: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: isLargeDevice ? 24 : 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  favoriteCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  capaContainer: {
    marginRight: 12,
  },
  capaLivro: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  capaTCC: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: isLargeDevice ? 16 : 15,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
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
  overlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
  filterModalBox: {
    width: '90%',
    maxWidth: 450,
    maxHeight: height * 0.7,
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  filterScroll: {
    maxHeight: height * 0.4,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  checkboxItemSelected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.2)',
  },
  checkboxText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  filterDivider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  filterCancelBtn: {
    flex: 1,
    borderRadius: 12,
  },
  filterApplyBtn: {
    flex: 1,
    borderRadius: 12,
    elevation: 0,
  },
  filterBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 6,
    color: '#fff'
  },
});

export default Favoritos;