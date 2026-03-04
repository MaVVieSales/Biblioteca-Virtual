import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  Text,
  Button,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  Provider as PaperProvider,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;
const isLargeDevice = width >= 768;

const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

const Perfil = ({ navigation }) => {
  const ip = process.env.EXPO_PUBLIC_IP;
  const { theme, isDark } = useTheme();
  const { userId, logout } = useAuth();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [senhaPopup, setSenhaPopup] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [deslogando, setDeslogando] = useState(false);

  const senhaRef = useRef();

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const carregarDados = async () => {
        try {
          setLoading(true);

          if (!userId) {
            Alert.alert("Erro", "Usuário não identificado. Faça login.");
            navigation.replace("Auth");
            return;
          }

          const response = await fetch(`${ip}/usuarios/${userId}?t=${Date.now()}`);
          const data = await response.json();

          if (ativo) setUsuario(data);
        } catch (error) {
          console.error("Erro ao buscar usuário:", error);
          Alert.alert("Erro", "Não foi possível carregar os dados do usuário.");
        } finally {
          if (ativo) setLoading(false);
        }
      };

      carregarDados();

      return () => {
        ativo = false;
      };
    }, [ip, userId])
  );

  const verificarSenha = async () => {
    if (!usuario) return;

    if (!senhaAtual.trim()) {
      setErroSenha("Digite sua senha!");
      return;
    }

    try {
      setVerificando(true);
      setErroSenha("");

      const response = await fetch(`${ip}/verificar-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: usuario.id, senhaAtual }),
      });

      if (!response.ok) {
        setErroSenha("Senha incorreta!");
        setSenhaAtual("");
        return;
      }

      const data = await response.json();
      if (data.Mensagem.includes("sucesso")) {
        setErroSenha("");
        setSenhaPopup(false);
        setSenhaAtual("");
        navigation.navigate("EditarPerfil", { usuario });
      }
    } catch (error) {
      setErroSenha("Erro de conexão. Tente novamente.");
    } finally {
      setVerificando(false);
    }
  };

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

  if (loading) {
    return (
      <PaperProvider theme={theme}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
            backgroundColor={theme.colors.primary}
            hidden={true}
          />
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Carregando perfil...
          </Text>
        </View>
      </PaperProvider>
    );
  }

  if (!usuario) {
    return (
      <PaperProvider theme={theme}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
            backgroundColor={theme.colors.primary}
            hidden={true}
          />
          <IconButton icon="account-off" size={64} iconColor={theme.colors.text + '40'} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Usuário não encontrado
          </Text>
          <Button
            mode="contained"
            style={[styles.backToHomeBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate("Home")}
          >
            Voltar para Home
          </Button>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.primary}
          hidden={true}
        />

        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("Home");
              }
            }}
            style={styles.backButton}
          >
            <IconButton icon="arrow-left" iconColor="white" size={28} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Meu Perfil</Text>

          <TouchableOpacity
            onPress={() => setSenhaPopup(true)}
            style={styles.editButton}
          >
            <IconButton icon="pencil" iconColor="white" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            <View style={styles.photoContainer}>
              <Image
                source={
                  usuario.foto
                    ? { uri: `${ip}/uploads/${usuario.foto}?t=${Date.now()}` }
                    : require("../../assets/usericon.png")
                }
                style={[styles.photo, { borderColor: theme.colors.primary }]}
              />
            </View>

            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {usuario.nome}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.text }]}>
              {usuario.email}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.infoCardTitle, { color: theme.colors.text }]}>
              Informações da Conta
            </Text>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <IconButton icon="card-account-details" size={24} iconColor={theme.colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>
                  Matrícula
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {usuario.matricula || usuario.Matricula || "Não informada"}
                </Text>
              </View>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.text + '20' }]} />

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <IconButton icon="email" size={24} iconColor={theme.colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>
                  E-mail
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>
                  {usuario.email}
                </Text>
              </View>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.text + '20' }]} />

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <IconButton icon="account" size={24} iconColor={theme.colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>
                  Nome Completo
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {usuario.nome}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Button
              mode="contained"
              icon="pencil"
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              contentStyle={styles.actionButtonContent}
              labelStyle={styles.actionButtonLabel}
              onPress={() => setSenhaPopup(true)}
              disabled={deslogando}
            >
              Editar Perfil
            </Button>

            <Button
              mode="outlined"
              icon="logout"
              style={[styles.actionButton, styles.logoutButton, { borderColor: theme.colors.primary }]}
              contentStyle={styles.actionButtonContent}
              labelStyle={[styles.actionButtonLabel, { color: theme.colors.primary }]}
              onPress={handleSair}
              loading={deslogando}
              disabled={deslogando}
            >
              {deslogando ? 'Saindo...' : 'Sair da Conta'}
            </Button>
          </View>
        </ScrollView>

        <Portal>
          <Dialog
            visible={senhaPopup}
            onDismiss={() => {
              setSenhaPopup(false);
              setSenhaAtual("");
              setErroSenha("");
              setShowSenha(false);
            }}
            style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
          >
            <Dialog.Title style={[styles.dialogTitle, { color: theme.colors.text }]}>
              Verificar Identidade
            </Dialog.Title>

            <Dialog.Content>
              <Text style={[styles.dialogSubtitle, { color: theme.colors.text }]}>
                Para editar seu perfil, confirme sua senha atual
              </Text>

              <TextInput
                ref={senhaRef}
                label="Senha atual"
                value={senhaAtual}
                onChangeText={(text) => {
                  setSenhaAtual(text);
                  setErroSenha("");
                }}
                secureTextEntry={!showSenha}
                mode="outlined"
                error={!!erroSenha}
                style={styles.dialogInput}
                left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
                right={
                  <TextInput.Icon
                    icon={showSenha ? "eye" : "eye-off"}
                    color={theme.colors.primary}
                    onPress={() => setShowSenha(!showSenha)}
                  />
                }
                outlineColor={theme.colors.primary}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.text}
                returnKeyType="done"
                onSubmitEditing={verificarSenha}
                autoFocus
                theme={{
                  colors: {
                    primary: theme.colors.text,
                    onSurfaceVariant: theme.colors.text,
                    placeholder: theme.colors.text,
                  },
                }}
              />

              {erroSenha ? (
                <View style={styles.errorContainer}>
                  <IconButton icon="alert-circle" size={20} iconColor="#FF5252" />
                  <Text style={styles.errorText}>{erroSenha}</Text>
                </View>
              ) : null}
            </Dialog.Content>

            <Dialog.Actions style={styles.dialogActions}>
              <Button
                onPress={() => {
                  setSenhaPopup(false);
                  setSenhaAtual("");
                  setErroSenha("");
                  setShowSenha(false);
                }}
                textColor={theme.colors.text}
                style={styles.dialogButton}
              >
                Cancelar
              </Button>
              <Button
                loading={verificando}
                disabled={verificando || !senhaAtual.trim()}
                onPress={verificarSenha}
                mode="contained"
                buttonColor={theme.colors.primary}
                style={styles.dialogButton}
                textColor="white"
              >
                Confirmar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  backToHomeBtn: {
    marginTop: 24,
    borderRadius: 12,
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
  editButton: {
    marginRight: -8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: isLargeDevice ? 40 : 32,
    paddingHorizontal: 20,
  },
  photoContainer: {
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  photo: {
    width: isLargeDevice ? 160 : 140,
    height: isLargeDevice ? 160 : 140,
    borderRadius: isLargeDevice ? 80 : 70,
    borderWidth: 4,
  },
  userName: {
    fontSize: isLargeDevice ? 26 : 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: isLargeDevice ? 16 : 15,
    opacity: 0.7,
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: isLargeDevice ? 32 : 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCardTitle: {
    fontSize: isLargeDevice ? 18 : 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    marginRight: 8,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: isLargeDevice ? 16 : 15,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 4,
  },
  actionsSection: {
    paddingHorizontal: isLargeDevice ? 32 : 20,
    gap: 16,
  },
  actionButton: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutButton: {
    borderWidth: 2,
  },
  actionButtonContent: {
    height: isLargeDevice ? 56 : 52,
  },
  actionButtonLabel: {
    fontSize: isLargeDevice ? 18 : 16,
    fontWeight: '700',
    color: 'white',
  },
  dialog: {
    borderRadius: 16,
    marginHorizontal: 20,
  },
  dialogTitle: {
    fontSize: isLargeDevice ? 22 : 20,
    fontWeight: '700',
  },
  dialogSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 20,
  },
  dialogInput: {
    backgroundColor: 'transparent',
    fontSize: isSmallDevice ? 14 : 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: -8,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: -4,
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  dialogButton: {
    borderRadius: 8,
  },
});

export default Perfil;