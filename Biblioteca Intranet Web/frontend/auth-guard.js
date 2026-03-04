class AuthGuard {
    constructor() {
      this.verificarAutenticacao();
    }
    
    verificarAutenticacao() {
      const userId = localStorage.getItem('userId');
      const paginasPublicas = ['login.html', 'cadastro.html', 'index.html', ''];
      const paginaAtual = window.location.pathname.split('/').pop();
      
      if (!paginasPublicas.includes(paginaAtual) && !userId) {
        this.redirecionarLogin();
        return false;
      }
      
      if (userId) {
        this.carregarDadosUsuario(userId);
      }
      
      return true;
    }
    
    redirecionarLogin() {
      localStorage.setItem('redirectAfterLogin', window.location.href);
      window.location.href = 'login.html';
    }
    
    async carregarDadosUsuario(userId) {
      try {
        if (!window.APP_CONFIG) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const res = await fetch(`${window.APP_CONFIG.API_URL}/administrador/${userId}`);
        if (!res.ok) throw new Error('Erro ao carregar usuário');
        
        const admin = await res.json();
        this.atualizarUI(admin);
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
      }
    }
    
    atualizarUI(admin) {
      const interval = setInterval(() => {
        const nomeEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        
        if (nomeEl || avatarEl) {
          clearInterval(interval);
          
          if (nomeEl) {
            nomeEl.textContent = admin.nome || 'Usuário';
          }
          
          if (avatarEl && admin.foto) {
            const fotoUrl = admin.foto.startsWith('http') 
              ? admin.foto 
              : `${window.APP_CONFIG.API_URL}${admin.foto}`;
            avatarEl.innerHTML = `<img src="${fotoUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`;
          }
        }
      }, 100);
      
      setTimeout(() => clearInterval(interval), 3000);
    }
  }
  
  new AuthGuard();