// gerenciamento de usuários, login, cadastro e sessão
let usuarios = [];
let usuarioLogado = null;
let modoCadastro = false;

// carregar lista de usuários do armazenamento local
function carregarUsuarios() {
    const saved = carregarLocalStorage('raizes_usuarios');
    if (saved) {
        usuarios = saved;
    } else {
        // usuário de testes
        usuarios = [
            { id: 1, nome: "Maria da Silva", email: "maria@email.com", senha: "123456", pontos: 150, pedidos: [], avaliacoes: [] }
        ];
        salvarUsuarios();
    }
}

// salvar lista de usuários no armazenamento local
function salvarUsuarios() {
    salvarLocalStorage('raizes_usuarios', usuarios);
}

// tentar autenticar usuário com email e senha
function fazerLogin(email, senha) {
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);
    if (usuario) {
        usuarioLogado = usuario;
        salvarLocalStorage('raizes_usuario_logado', usuarioLogado);
        fecharModalAuth();
        atualizarInterfaceUsuario();
        return true;
    }
    return false;
}

// criar nova conta 
function fazerCadastro(nome, email, senha) {
    if (usuarios.find(u => u.email === email)) return false;
    
    const novoUsuario = {
        id: usuarios.length + 1,
        nome: nome,
        email: email,
        senha: senha,
        pontos: 0,
        pedidos: [],
        avaliacoes: []
    };
    usuarios.push(novoUsuario);
    salvarUsuarios();
    
    usuarioLogado = novoUsuario;
    salvarLocalStorage('raizes_usuario_logado', usuarioLogado);
    return true;
}

// encerrar sessão do usuário atual
function fazerLogout() {
    usuarioLogado = null;
    localStorage.removeItem('raizes_usuario_logado');
    localStorage.removeItem(`carrinho_${usuarioLogado?.id}`);
    carrinho = [];
    cupomAplicado = null;
    pontosUsados = 0;
    if (intervaloStatus) clearInterval(intervaloStatus);
    atualizarInterfaceUsuario();
    document.getElementById('app-content').style.display = 'none';
    document.getElementById('unidade-section').style.display = 'none';
    document.getElementById('status-card')?.classList.remove('active');
    document.getElementById('welcome-screen').style.display = 'block';
}

// verificar se já existe algum usuário logado (sessão ativa)
function verificarSessao() {
    const saved = carregarLocalStorage('raizes_usuario_logado');
    if (saved) {
        usuarioLogado = saved;
        atualizarInterfaceUsuario();
    } else {
        document.getElementById('welcome-screen').style.display = 'block';
    }
}

// variável para controlar modo visitante
let modoVisitante = false;

// entra como visitante (só visualiza cardápio)
function entrarComoVisitante() {
    modoVisitante = true;
    usuarioLogado = null;
    localStorage.removeItem('raizes_usuario_logado');
    
    // limpa carrinho (visitante não pode ter carrinho)
    carrinho = [];
    salvarCarrinho();
    
    atualizarInterfaceUsuario();
    mostrarToast('Você está no modo visitante. Faça login para fazer pedidos!', 'sucesso');
}

// verifica se está em modo visitante
function isModoVisitante() {
    return modoVisitante;
}

// sair do modo visitante
function sairModoVisitante() {
    modoVisitante = false;
    atualizarInterfaceUsuario();
}

// atualiza elementos da tela conforme estado do usuário
function atualizarInterfaceUsuario() {
    const userBar = document.getElementById('user-bar');
    const welcomeScreen = document.getElementById('welcome-screen');
    const appContent = document.getElementById('app-content');
    const pontosArea = document.getElementById('pontos-area');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (usuarioLogado) {
        // usuário logado (acesso completo)
        welcomeScreen.style.display = 'none';
        appContent.style.display = 'block';
        modoVisitante = false;
        
        // habilita botão de finalizar pedido
        if (checkoutBtn) checkoutBtn.disabled = false;
        if (pontosArea) pontosArea.style.display = 'block';
        
        const iniciais = usuarioLogado.nome.split(' ').map(n => n[0]).join('').toUpperCase();
        userBar.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${iniciais}</div>
                <div>
                    <div class="user-name">Olá, ${usuarioLogado.nome.split(' ')[0]}!</div>
                    <div class="user-points">⭐ ${usuarioLogado.pontos} pontos</div>
                </div>
            </div>
            <button class="btn-logout" id="logout-btn">Sair</button>
        `;
        
        document.getElementById('unidade-section').style.display = 'block';
        document.getElementById('pontos-info').innerHTML = `Você tem ${usuarioLogado.pontos} pontos disponíveis. (Cada 10 pontos = R$1 desconto)`;
        
        document.getElementById('logout-btn').addEventListener('click', fazerLogout);
        
        carregarCarrinho();
        renderizarCardapio();
        renderizarCarrinho();
        
    } else if (modoVisitante) {
        // modo visitante (só visualização)
        welcomeScreen.style.display = 'none';
        appContent.style.display = 'block';
        
        // desabilita botão de finalizar pedido
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (pontosArea) pontosArea.style.display = 'none';
        
        userBar.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">👀</div>
                <div>
                    <div class="user-name">Modo Visitante</div>
                    <div class="user-points">🔍 Apenas visualização</div>
                </div>
            </div>
            <button class="btn-logout" id="logout-visitante-btn">Sair do modo visitante</button>
        `;
        
        document.getElementById('unidade-section').style.display = 'block';
        
        // limpa e desabilita carrinho
        carrinho = [];
        renderizarCarrinho();
        
        // desabilita botões de adicionar ao carrinho via CSS
        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Faça login para adicionar itens ao carrinho';
        });
        
        document.getElementById('logout-visitante-btn').addEventListener('click', sairModoVisitante);
        
        renderizarCardapio();
        
    } else {
        // usuário deslogado: mostra tela de boas-vindas
        welcomeScreen.style.display = 'block';
        appContent.style.display = 'none';
        
        userBar.innerHTML = `
            <div class="user-info">
                <div>🍽️ Faça login para fazer pedidos</div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-login" id="login-btn">Entrar / Cadastrar</button>
            </div>
        `;
        document.getElementById('login-btn')?.addEventListener('click', abrirModalAuth);
    }
}

function abrirModalAuth() {
    modoCadastro = false;
    document.getElementById('auth-nome').style.display = 'none';
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-senha').value = '';
    document.getElementById('auth-error').innerText = '';
    document.getElementById('modal-title').innerText = "Entrar na sua conta";
    document.getElementById('auth-submit').innerText = "Entrar";
    document.getElementById('auth-modal').style.display = 'flex';
}

function fecharModalAuth() {
    document.getElementById('auth-modal').style.display = 'none';
}

// alternar entre modo login e modo cadastro
function alternarModo() {
    modoCadastro = !modoCadastro;
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('auth-submit');
    const nomeField = document.getElementById('auth-nome');
    
    if (modoCadastro) {
        modalTitle.innerText = "Criar nova conta";
        submitBtn.innerText = "Cadastrar";
        nomeField.style.display = "block";
    } else {
        modalTitle.innerText = "Entrar na sua conta";
        submitBtn.innerText = "Entrar";
        nomeField.style.display = "none";
    }
    document.getElementById('auth-error').innerText = "";
}

// processa o envio do formulário de login ou cadastro
function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value.trim();
    const senha = document.getElementById('auth-senha').value;
    
    if (!email || !senha) {
        document.getElementById('auth-error').innerText = 'Preencha e-mail e senha!';
        return;
    }
    
    if (modoCadastro) {
        const nome = document.getElementById('auth-nome').value.trim();
        if (!nome) {
            document.getElementById('auth-error').innerText = 'Preencha seu nome!';
            return;
        }
        if (fazerCadastro(nome, email, senha)) {
            fecharModalAuth();
            atualizarInterfaceUsuario();
            mostrarToast('Cadastro realizado com sucesso!', 'sucesso');
        } else {
            document.getElementById('auth-error').innerText = 'E-mail já cadastrado!';
        }
    } else {
        if (fazerLogin(email, senha)) {
            fecharModalAuth();
            mostrarToast(`Bem-vindo de volta, ${usuarioLogado.nome.split(' ')[0]}!`, 'sucesso');
        } else {
            document.getElementById('auth-error').innerText = 'E-mail ou senha incorretos!';
        }
    }
}