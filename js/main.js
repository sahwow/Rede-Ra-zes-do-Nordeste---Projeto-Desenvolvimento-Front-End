// aguardar o carregamento completo do html para iniciar
document.addEventListener('DOMContentLoaded', () => {
    
    carregarUsuarios();
    verificarSessao();
    
    // troca de unidade 
    const unidadeSelect = document.getElementById('unidade-select');
    if (unidadeSelect) {
        unidadeSelect.addEventListener('change', (e) => {
            unidadeAtual = e.target.value;
            
            // perguntar se quer limpar carrinho ao trocar de unidade
            if (carrinho.length > 0) {
                if (confirm("Trocando de unidade, o carrinho será limpo. Continuar?")) {
                    carrinho = [];
                    cupomAplicado = null;
                    pontosUsados = 0;
                    salvarCarrinho();
                    renderizarCarrinho();
                } else {
                    e.target.value = unidadeAtual;
                    return;
                }
            }
            renderizarCardapio();
        });
    }
    
    // burcar produtos no cardápio
    const buscaInput = document.getElementById('busca-produto');
    if (buscaInput) {
        buscaInput.addEventListener('input', (e) => {
            termoBusca = e.target.value;
            renderizarCardapio();
        });
    }
    
    // forma de entrega (retirada ou delivery)
    const entregaRadios = document.querySelectorAll('input[name="entrega"]');
    entregaRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const enderecoField = document.getElementById('endereco-field');
            if (enderecoField) {
                // mostra campo de endereço apenas se escolher delivery
                enderecoField.style.display = e.target.value === 'delivery' ? 'block' : 'none';
            }
        });
    });
    
    // botoão para abrir modal de pagamento
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', solicitarPagamento);
    }
    
    // aplicar cupom de desconto
    const aplicarCupomBtn = document.getElementById('aplicar-cupom');
    if (aplicarCupomBtn) {
        aplicarCupomBtn.addEventListener('click', aplicarCupom);
    }
    
    // aplicar pontos de fidelidade
    const aplicarPontosBtn = document.getElementById('aplicar-pontos');
    if (aplicarPontosBtn) {
        aplicarPontosBtn.addEventListener('click', aplicarPontos);
    }
    
    // processar pagamento
    const processarPagamentoBtn = document.getElementById('btn-processar');
    if (processarPagamentoBtn) {
        processarPagamentoBtn.addEventListener('click', processarPagamento);
    }
    
    // cancelar pagamento 
    const cancelarPagamentoBtn = document.getElementById('btn-cancelar-pagamento');
    if (cancelarPagamentoBtn) {
        cancelarPagamentoBtn.addEventListener('click', () => {
            document.getElementById('pagamento-modal').style.display = 'none';
        });
    }
    
    // seleção de método de pagamento
    document.querySelectorAll('.metodo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // remove seleção de todos os botões
            document.querySelectorAll('.metodo-btn').forEach(b => b.classList.remove('selected'));
            // seleciona o botão clicado
            btn.classList.add('selected');
            metodoSelecionado = btn.dataset.metodo;
        });
    });
    
    //  avaliação da tela de pedido
    const enviarAvaliacaoTelaBtn = document.getElementById('enviar-avaliacao-tela');
    if (enviarAvaliacaoTelaBtn) {
        enviarAvaliacaoTelaBtn.addEventListener('click', enviarAvaliacaoTela);
    }
    
    const depoisAvaliacaoTelaBtn = document.getElementById('depois-avaliacao-tela');
    if (depoisAvaliacaoTelaBtn) {
        depoisAvaliacaoTelaBtn.addEventListener('click', esconderSecaoAvaliacao);
    }
    
    // estrelas da avaliação de 1 a 5
    document.querySelectorAll('#rating-stars-tela span').forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            document.querySelectorAll('#rating-stars-tela span').forEach((s, i) => {
                if (i < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
    
    // eventos de autenticação 
    const welcomeLoginBtn = document.getElementById('welcome-login-btn');
    if (welcomeLoginBtn) {
        welcomeLoginBtn.addEventListener('click', abrirModalAuth);
    }
    
    const authSubmitBtn = document.getElementById('auth-submit');
    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', handleAuthSubmit);
    }
    
    const authSwitchLink = document.getElementById('auth-switch-link');
    if (authSwitchLink) {
        authSwitchLink.addEventListener('click', alternarModo);
    }

    // evento do botão visitante
    const welcomeVisitanteBtn = document.getElementById('welcome-visitante-btn');
    if (welcomeVisitanteBtn) {
        welcomeVisitanteBtn.addEventListener('click', entrarComoVisitante);
}

    // fecha modais clicando fora
    window.onclick = function(event) {
        const authModal = document.getElementById('auth-modal');
        const pagamentoModal = document.getElementById('pagamento-modal');
        
        if (event.target === authModal) {
            authModal.style.display = 'none';
        }
        if (event.target === pagamentoModal) {
            pagamentoModal.style.display = 'none';
        }
        // avaliação fecha somente com o botão de "depois"
    }
    
});