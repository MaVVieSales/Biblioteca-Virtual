async function carregarHeader() {
  try {
    await window.configPromise;

    const response = await fetch("/frontend/header.html");
    const headerHTML = await response.text();
    document.body.insertAdjacentHTML("afterbegin", headerHTML);
    await inicializarHeader();
  } catch (err) {
    console.error("Erro ao carregar header:", err);
  }
}

async function inicializarHeader() {
  await carregarDadosUsuario();
  marcarPaginaAtiva();
}

async function carregarDadosUsuario() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const API_URL = window.APP_CONFIG.API_URL;
    const res = await fetch(`${API_URL}/administrador/${userId}`);
    if (!res.ok) throw new Error("Erro ao buscar dados");

    const user = await res.json();
    atualizarHeaderUsuario(user);
  } catch (err) {
    console.error("Erro ao carregar usuário:", err);
  }
}

function getInitials(nome) {
  if (!nome) return '👤';
  return nome
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function atualizarHeaderUsuario(user) {

  const avatar = document.getElementById("user-avatar");
  const nome = document.getElementById("user-name");

  if (!avatar || !nome) return;
  const limite = 10;
  nome.textContent = (user.nome || "Usuário").substring(0, limite);

  const API_URL = window.APP_CONFIG.API_URL;

  if (user.foto &&
    user.foto !== "/uploads/usericon.png" &&
    user.foto !== 'null' &&
    user.foto !== 'undefined' &&
    user.foto.trim() !== '') {
    const initials = getInitials(user.nome);
    avatar.innerHTML = `<img src="${API_URL}${user.foto}" alt="Foto do Usuário" onerror="this.parentElement.textContent='${initials}'">`;
  } else {
    avatar.textContent = getInitials(user.nome);
  }
}

function handleLogout() {
  if (confirm("Deseja realmente sair?")) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login.html";
  }
}

function marcarPaginaAtiva() {
  setTimeout(() => {
    const current = window.location.pathname.split("/").pop() || "home.html";
    const links = document.querySelectorAll(".nav-link");
    const userSection = document.querySelector(".user-section");

    console.log("Página atual:", current);

    links.forEach((l) => l.classList.remove("active"));

    if (current === "perfil.html") {
      if (userSection) {
        userSection.classList.add("on-perfil-page");
        console.log("Classe on-perfil-page adicionada");
      }
    } else {
      if (userSection) {
        userSection.classList.remove("on-perfil-page");
        console.log("Classe on-perfil-page removida");
      }

      links.forEach((link) => {
        if (link.getAttribute("href").endsWith(current)) {
          link.classList.add("active");
        }
      });
    }
  }, 100);
}

window.addEventListener("DOMContentLoaded", carregarHeader);
window.addEventListener("load", marcarPaginaAtiva);