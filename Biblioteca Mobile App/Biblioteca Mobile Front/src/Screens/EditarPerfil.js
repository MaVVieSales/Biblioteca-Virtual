import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  Image,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Provider as PaperProvider,
  ActivityIndicator,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./../contexts/ThemeContext";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

const { width, height } = Dimensions.get("window");

const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;
const isLargeDevice = width >= 768;

const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

const EditarPerfil = () => {
  const ip = process.env.EXPO_PUBLIC_IP;
  const { theme, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();

  const [usuario, setUsuario] = useState(route.params?.usuario || null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [nomeEditado, setNomeEditado] = useState("");
  const [emailEditado, setEmailEditado] = useState("");
  const [matriculaEditada, setMatriculaEditada] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [fotoUri, setFotoUri] = useState(null);
  const [fotoOriginal, setFotoOriginal] = useState(null);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const emailRef = useRef();
  const matriculaRef = useRef();
  const novaSenhaRef = useRef();
  const confirmarSenhaRef = useRef();

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const carregarDados = async () => {
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

      carregarDados();

      return () => {
        ativo = false;
      };
    }, [ip])
  );

  useEffect(() => {
    if (usuario) {
      setNomeEditado(usuario.nome || "");
      setEmailEditado(usuario.email || "");
      const matricula =
        usuario.matricula ||
        usuario.Matricula ||
        usuario.numero_matricula ||
        usuario.registration ||
        "";
      setMatriculaEditada(String(matricula));

      if (usuario.foto) {
        let caminhoFoto = usuario.foto;

        if (!caminhoFoto.startsWith("uploads/") && !caminhoFoto.startsWith("/uploads/")) {
          caminhoFoto = `uploads/${caminhoFoto}`;
        }

        const urlCompleta = `${ip}/${caminhoFoto}?t=${Date.now()}`;
        setFotoUri(urlCompleta);
        setFotoOriginal(urlCompleta);
      } else {
        setFotoUri(null);
        setFotoOriginal(null);
      }
    }
  }, [usuario, ip]);

  const selecionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Permita o acesso à galeria para selecionar a foto."
      );
      return;
    }

    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!resultado.canceled && resultado.assets?.length > 0) {
        setFotoUri(resultado.assets[0].uri);
      }
    } catch (err) {
      console.error("Erro ao selecionar foto:", err);
      Alert.alert("Erro", "Não foi possível abrir a galeria.");
    }
  };

  const handleSalvarEdicao = async () => {
    if (!nomeEditado.trim() || !emailEditado.trim() || !matriculaEditada.trim()) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios!");
      return;
    }

    const nomeValido = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(nomeEditado.trim());
    if (!nomeValido) {
      Alert.alert("Erro", "O nome deve conter apenas letras e espaços.");
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEditado.trim());
    if (!emailValido) {
      Alert.alert("Erro", "Informe um e-mail válido.");
      return;
    }

    const matriculaValida = /^\d+$/.test(matriculaEditada.trim());
    if (!matriculaValida) {
      Alert.alert("Erro", "A matrícula deve conter apenas números.");
      return;
    }

    try {
      const verificaEmail = await fetch(`${ip}/usuarios/verificar-email?email=${encodeURIComponent(emailEditado.trim())}`);
      const resultado = await verificaEmail.json();

      if (verificaEmail.ok && resultado.existe && resultado.id !== usuario.id) {
        Alert.alert("Erro", "Este e-mail já está sendo utilizado por outro usuário.");
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar e-mail:", error);
      Alert.alert("Erro", "Não foi possível validar o e-mail. Tente novamente.");
      return;
    }


    if (novaSenha && novaSenha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem!");
      return;
    }

    try {
      setSalvando(true);

      const formData = new FormData();
      formData.append("id", String(usuario.id));
      formData.append("nome", nomeEditado.trim());
      formData.append("email", emailEditado.trim());
      formData.append("matricula", matriculaEditada.trim());

      if (novaSenha && novaSenha.trim()) {
        formData.append("senha", novaSenha.trim());
      }

      if (fotoUri && fotoUri !== fotoOriginal) {
        await new Promise(resolve => setTimeout(resolve, 100));

        let uriToSend = fotoUri;

        if (uriToSend.startsWith('file://')) {
          uriToSend = uriToSend.substring(7);
        }

        const filename = uriToSend.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

        const fotoObj = {
          uri: Platform.OS === 'android' ? `file://${uriToSend}` : uriToSend,
          name: filename,
          type: type,
        };

        formData.append("foto", fotoObj);

        console.log("📸 Enviando foto:", {
          nome: filename,
          tipo: type,
          uri: fotoObj.uri.substring(0, 50) + "..."
        });
      }

      console.log("📤 Iniciando requisição...");

      let resposta;
      let tentativas = 0;
      const maxTentativas = 2;

      while (tentativas < maxTentativas) {
        try {
          tentativas++;
          console.log(`🔄 Tentativa ${tentativas}/${maxTentativas}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          resposta = await fetch(`${ip}/editar-perfil`, {
            method: "POST",
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          break;

        } catch (err) {
          console.log(`⚠️ Erro na tentativa ${tentativas}:`, err.message);

          if (tentativas >= maxTentativas) {
            throw err;
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log("📥 Status da resposta:", resposta.status);

      const dados = await resposta.json();
      console.log("📦 Dados recebidos:", dados);

      if (resposta.ok) {
        Alert.alert("Sucesso", "Perfil atualizado com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              if (dados.foto) {
                const novaFotoUrl = `${ip}${dados.foto}?t=${Date.now()}`;
                setFotoUri(novaFotoUrl);
                setFotoOriginal(novaFotoUrl);
              }
              setNovaSenha("");
              setConfirmarSenha("");

              setTimeout(() => {
                navigation.goBack();
              }, 300);
            }
          }
        ]);
      } else {
        Alert.alert("Erro", dados.Mensagem || "Erro ao atualizar perfil");
      }
    } catch (erro) {
      console.error("❌ Erro de conexão:", erro);

      if (erro.name === 'AbortError') {
        Alert.alert(
          "Tempo Esgotado",
          "A requisição demorou muito. Verifique sua conexão e tente novamente."
        );
      } else {
        Alert.alert(
          "Erro de Conexão",
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
        );
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.primary}
          hidden={true}
        />

        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <IconButton icon="arrow-left" iconColor="white" size={28} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Editar Perfil</Text>

          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.photoSection}>
              <View style={styles.photoContainer}>
                <Image
                  source={
                    fotoUri
                      ? { uri: fotoUri }
                      : require("./../../assets/usericon.png")
                  }
                  style={[styles.photo, { borderColor: theme.colors.primary }]}
                  onError={(e) =>
                    console.log("❌ Erro ao carregar imagem:", e.nativeEvent.error)
                  }
                />
                <TouchableOpacity
                  style={[styles.photoButton, { backgroundColor: theme.colors.primary }]}
                  onPress={selecionarFoto}
                  activeOpacity={0.8}
                >
                  <IconButton icon="camera" iconColor="white" size={24} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.photoLabel, { color: theme.colors.text }]}>
                Toque no ícone para alterar
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Informações Pessoais
              </Text>

              <View style={styles.inputGroup}>
                <TextInput
                  label="Nome completo"
                  value={nomeEditado}
                  onChangeText={setNomeEditado}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="account" color={theme.colors.primary} />}
                  outlineColor={theme.colors.primary}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.text}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  maxLength={100}
                  theme={{
                    colors: {
                      primary: theme.colors.text,
                      onSurfaceVariant: theme.colors.text,
                      placeholder: theme.colors.text,
                    },
                  }}
                />

                <TextInput
                  ref={emailRef}
                  label="E-mail"
                  value={emailEditado}
                  onChangeText={setEmailEditado}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
                  outlineColor={theme.colors.primary}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.text}
                  returnKeyType="next"
                  onSubmitEditing={() => matriculaRef.current?.focus()}
                  maxLength={150}
                  theme={{
                    colors: {
                      primary: theme.colors.text,
                      onSurfaceVariant: theme.colors.text,
                      placeholder: theme.colors.text,
                    },
                  }}
                />

                <TextInput
                  ref={matriculaRef}
                  label="Matrícula"
                  value={matriculaEditada}
                  onChangeText={setMatriculaEditada}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon="card-account-details" color={theme.colors.primary} />}
                  outlineColor={theme.colors.primary}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.text}
                  returnKeyType="next"
                  onSubmitEditing={() => novaSenhaRef.current?.focus()}
                  maxLength={20}
                  theme={{
                    colors: {
                      primary: theme.colors.text,
                      onSurfaceVariant: theme.colors.text,
                      placeholder: theme.colors.text,
                    },
                  }}
                />
              </View>

              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
                Alterar Senha (Opcional)
              </Text>

              <View style={styles.inputGroup}>
                <TextInput
                  ref={novaSenhaRef}
                  label="Nova senha"
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  mode="outlined"
                  style={styles.input}
                  secureTextEntry={!showNovaSenha}
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
                  right={
                    <TextInput.Icon
                      icon={showNovaSenha ? "eye" : "eye-off"}
                      color={theme.colors.primary}
                      onPress={() => setShowNovaSenha(!showNovaSenha)}
                    />
                  }
                  outlineColor={theme.colors.primary}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.text}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmarSenhaRef.current?.focus()}
                  maxLength={150}
                  theme={{
                    colors: {
                      primary: theme.colors.text,
                      onSurfaceVariant: theme.colors.text,
                      placeholder: theme.colors.text,
                    },
                  }}
                />

                {novaSenha.length > 0 && (
                  <TextInput
                    ref={confirmarSenhaRef}
                    label="Confirmar nova senha"
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry={!showConfirmarSenha}
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="lock-check" color={theme.colors.primary} />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmarSenha ? "eye" : "eye-off"}
                        color={theme.colors.primary}
                        onPress={() => setShowConfirmarSenha(!showConfirmarSenha)}
                      />
                    }
                    outlineColor={theme.colors.primary}
                    activeOutlineColor={theme.colors.primary}
                    textColor={theme.colors.text}
                    returnKeyType="done"
                    onSubmitEditing={handleSalvarEdicao}
                    maxLength={150}
                    theme={{
                      colors: {
                        primary: theme.colors.text,
                        onSurfaceVariant: theme.colors.text,
                        placeholder: theme.colors.text,
                      },
                    }}
                  />
                )}
              </View>

              <Button
                mode="contained"
                icon={salvando ? undefined : "check"}
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.saveButtonContent}
                labelStyle={styles.saveButtonLabel}
                onPress={handleSalvarEdicao}
                disabled={salvando}
                loading={salvando}
              >
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </Button>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: isLargeDevice ? 40 : 32,
    paddingHorizontal: 20,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  photo: {
    width: isLargeDevice ? 140 : 120,
    height: isLargeDevice ? 140 : 120,
    borderRadius: isLargeDevice ? 70 : 60,
    borderWidth: 4,
  },
  photoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  photoLabel: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  formSection: {
    paddingHorizontal: isLargeDevice ? 32 : 20,
  },
  sectionTitle: {
    fontSize: isLargeDevice ? 18 : 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: isSmallDevice ? 14 : 16,
  },
  saveButton: {
    marginTop: 32,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonContent: {
    height: isLargeDevice ? 56 : 52,
  },
  saveButtonLabel: {
    fontSize: isLargeDevice ? 18 : 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default EditarPerfil;