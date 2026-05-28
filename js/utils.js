// funções de formatação, notificação e armazenamento
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// exibir mensagem temporária no canto inferior (toast notification) 
function mostrarToast(mensagem, tipo = 'sucesso') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    
    toast.textContent = mensagem;
    toast.style.background = tipo === 'sucesso' ? '#2c7a47' : '#e74c3c';
    toast.classList.add('show');
    
    // sumir após 2 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// confirmar item adicionado ao carrinho
function mostrarConfirmacaoAdicionado(nomeProduto) {
    mostrarToast(`✅ ${nomeProduto} adicionado ao carrinho!`, 'sucesso');
}

// gerar código único para transação de pagamento
function gerarIdTransacao() {
    return 'TXN' + Math.floor(Math.random() * 1000000);
}

// gerar número aleatório para identificar os pedidos
function gerarNumeroPedido() {
    return Math.floor(Math.random() * 9000) + 1000;
}

// guardar dados no navegador 
function salvarLocalStorage(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

// recuperar dados salvos no navegador
function carregarLocalStorage(chave, padrao = null) {
    const salvo = localStorage.getItem(chave);
    if (salvo) return JSON.parse(salvo);
    return padrao;
}