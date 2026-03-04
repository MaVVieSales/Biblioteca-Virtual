import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import {
  Text,
  Card,
  Provider as PaperProvider,
  IconButton,
  TextInput,
  Checkbox,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "./../contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;
const isLargeDevice = width >= 768;

const CARD_SPACING = 12;
const HORIZONTAL_PADDING = isLargeDevice ? 24 : 16;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - CARD_SPACING) / 2;
const CARD_HEIGHT = isLargeDevice ? 280 : isMediumDevice ? 260 : 240;
const IMAGE_HEIGHT = isLargeDevice ? 190 : isMediumDevice ? 170 : 155;

const Resultados = ({ route, navigation }) => {
  const { query: initialQuery = "", filtros: initialFiltros = [], tipo = "livro" } = route.params || {};
  const ip = process.env.EXPO_PUBLIC_IP;
  const { theme, isDark } = useTheme();

  const [itens, setItens] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [showFilter, setShowFilter] = useState(false);
  const [opcoesFiltro, setOpcoesFiltro] = useState([]);
  const [filtrosSelecionados, setFiltrosSelecionados] = useState(initialFiltros);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(tipo === "livro" ? ip + "/livros" : ip + "/tccs");
        const data = await res.json();
        setItens(data);

        const opcoes = tipo === "livro"
          ? Array.from(new Set(data.map((d) => d.genero).filter(Boolean)))
          : Array.from(new Set(data.map((d) => d.curso).filter(Boolean)));
        setOpcoesFiltro(opcoes);

      } catch (err) {
        console.error("Erro:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tipo]);

  const itensFiltrados = itens.filter((item) => {
    const campoBusca = item.titulo || "";
    const campoFiltro = tipo === "livro" ? item.genero : item.curso;
    const matchQuery = campoBusca.toLowerCase().includes(query.toLowerCase());
    const matchFiltro = filtrosSelecionados.length === 0 || filtrosSelecionados.includes(campoFiltro);
    return matchQuery && matchFiltro;
  });

  const handleSearch = () => {
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate(
          tipo === "livro" ? "Detalhes" : "VisualizarTCC",
          tipo === "livro" ? { livro: item } : { tcc: item }
        )
      }
      activeOpacity={0.7}
      style={styles.cardWrapper}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
        {tipo === "livro" ? (
          <View style={styles.cardImageContainer}>
            <Image
              source={item.capa ? { uri: item.capa } : require("./../../assets/capalivro.png")}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={[styles.cardTCCContainer, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }]}>
            <Image
              source={require("./../../assets/senai.png")}
              style={styles.cardTCCLogo}
              resizeMode="contain"
            />
            <View style={styles.cardTCCInfo}>
              <Text style={[styles.cardTCCTitle, { color: theme.colors.text }]} numberOfLines={3}>
                {item.titulo}
              </Text>
              <Text style={[styles.cardTCCCourse, { color: theme.colors.text }]} numberOfLines={1}>
                {item.curso}
              </Text>
            </View>
          </View>
        )}
        <Card.Content style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          {tipo === "livro" && item.autor && (
            <Text style={[styles.cardAuthor, { color: theme.colors.text }]} numberOfLines={1}>
              {item.autor}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.primary}
          hidden={true}
        />

        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <IconButton icon="arrow-left" iconColor="white" size={28} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {tipo === "livro" ? "Buscar Livros" : "Buscar TCCs"}
          </Text>
          
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <TextInput
              placeholder={`Pesquisar ${tipo === "livro" ? "livros" : "TCCs"}...`}
              mode="outlined"
              value={query}
              onChangeText={(text) => setQuery(text)}
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
              onSubmitEditing={handleSearch}
            />

            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowFilter(true)}
            >
              <IconButton
                icon="filter-variant"
                iconColor="white"
                size={24}
              />
              {filtrosSelecionados.length > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {filtrosSelecionados.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.resultadosCount, { color: theme.colors.text }]}>
            {loading ? "Carregando..." : `${itensFiltrados.length} resultado${itensFiltrados.length !== 1 ? 's' : ''} encontrado${itensFiltrados.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

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

              <ScrollView 
                style={styles.filterScroll} 
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                <TouchableOpacity
                  style={[
                    styles.checkboxItem,
                    filtrosSelecionados.length === 0 && styles.checkboxItemSelected
                  ]}
                  onPress={() => setFiltrosSelecionados([])}
                >
                  <Checkbox
                    status={filtrosSelecionados.length === 0 ? "checked" : "unchecked"}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                    Todos
                  </Text>
                </TouchableOpacity>

                <View style={[styles.filterDivider, { backgroundColor: theme.colors.text }]} />

                {opcoesFiltro.map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.checkboxItem,
                      filtrosSelecionados.includes(f) && styles.checkboxItemSelected
                    ]}
                    onPress={() => {
                      if (filtrosSelecionados.includes(f)) {
                        setFiltrosSelecionados(
                          filtrosSelecionados.filter((item) => item !== f)
                        );
                      } else {
                        setFiltrosSelecionados([...filtrosSelecionados, f]);
                      }
                    }}
                  >
                    <Checkbox
                      status={filtrosSelecionados.includes(f) ? "checked" : "unchecked"}
                      color={theme.colors.primary}
                    />
                    <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                      {f}
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
                    setFiltrosSelecionados([]);
                    setShowFilter(false);
                  }}
                >
                  Limpar
                </Button>
                <Button
                  mode="contained"
                  style={[styles.filterApplyBtn, { backgroundColor: theme.colors.primary, color: theme.colors.text }]}
                  labelStyle={styles.filterBtnLabel}
                  onPress={() => setShowFilter(false)}
                >
                  Aplicar
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Carregando...
            </Text>
          </View>
        ) : itensFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconButton
              icon="magnify-close"
              size={64}
              iconColor={theme.colors.text + '40'}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Nenhum resultado encontrado
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.text }]}>
              Tente ajustar sua busca ou filtros
            </Text>
          </View>
        ) : (
          <FlatList
            data={itensFiltrados}
            renderItem={renderCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
          />
        )}
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
    justifyContent: "space-between",
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: { 
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  searchSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchRow: { 
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
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
  resultadosCount: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
  overlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
  list: { 
    padding: HORIZONTAL_PADDING,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_SPACING,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardImageContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  cardImage: { 
    height: IMAGE_HEIGHT,
    width: CARD_WIDTH - 24,
    borderRadius: 8,
  },
  cardTCCContainer: {
    height: IMAGE_HEIGHT,
    paddingTop: 20,
    paddingHorizontal: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  cardTCCLogo: {
    width: 80,
    height: 32,
    alignSelf: 'center',
  },
  cardTCCInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 8,
  },
  cardTCCTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  cardTCCCourse: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
    fontWeight: '500',
  },
  cardContent: {
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 70,
  },
  cardTitle: { 
    fontSize: isLargeDevice ? 14 : 13,
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 4,
  },
  cardAuthor: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default Resultados;